"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { saveAvatar, deleteAvatar } from "@/lib/storage/avatarStorage";
import {
  isAccountActionRateLimited,
  recordFailedAccountAction,
  clearAccountActionAttempts,
} from "@/lib/account/rateLimit";
import {
  validateAvatarFile,
  changePasswordService,
  changeEmailService,
  confirmEmailChangeService,
  deleteAccountService,
} from "./service";
import {
  ChangePasswordSchema,
  ChangeEmailSchema,
  DeleteAccountSchema,
  type ChangePasswordInput,
  type ChangeEmailInput,
  type DeleteAccountInput,
} from "./schema";
import * as repository from "./repository";

/**
 * Багфікс 05.08.2026 (за прямим зверненням користувача — при
 * закороткому паролі в UI показувався сирий JSON `ZodError.issues`
 * замість людського повідомлення). `ChangePasswordSchema.parse(...)`/
 * `ChangeEmailSchema.parse(...)` кидають `ZodError`, а не звичайний
 * `Error` — `ZodError.message` це JSON-рядок з масивом усіх issues, не
 * готовий для показу користувачу текст (на відміну від `Error`, який
 * кидають `changePasswordService`/`changeEmailService` нижче з уже
 * готовим українським повідомленням). Ця функція дістає повідомлення
 * ПЕРШОЇ issue з `ZodError` (той самий текст, що заданий у
 * `.min(6, "Пароль має містити мінімум 6 символів")` тощо в
 * `schema.ts`), і лишає звичайний `err.message` для решти помилок
 * (`changePasswordService`/`changeEmailService`/throttle/сесія).
 */
function formatActionError(err: unknown, fallback: string): string {
  if (err instanceof ZodError) {
    return err.issues[0]?.message ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

/**
 * `modules/account/actions.ts` — Фаза 3+, задача 3+.1.3 (перші дії
 * нового модуля). Кожна перевіряє `auth()` (реальна сесія,
 * `session.user.id`, той самий принцип, що вже в `addCommentAction`/
 * `updateHomeworkVisibilityAction`) і повертає `{ success, error }` —
 * той самий формат відповіді, що вже всюди в проєкті (`modules/quizzes`,
 * `modules/comments`, `modules/profile`).
 *
 * Файл передається через `FormData`, а не звичайний JSON-аргумент —
 * обмеження Next.js server actions для бінарних даних (`File` не
 * серіалізується як звичайний аргумент).
 *
 * 05.08.2026, задача 3+.1.5 (замикає фічу, розпочату 3+.1.1–3+.1.4):
 * після успішного запису в БД обидві дії викликають `revalidatePath` для
 * КОЖНОГО місця в проєкті, де реально показується `avatarUrl` (перевірено
 * `grep -rl "avatarUrl" app/ components/` — цей самий список використано
 * нижче): `/profile` (клієнтський компонент, але сам виклик
 * `getPublicProfileAction` — server action, не кешується Next.js
 * автоматично; `revalidatePath` тут — той самий захист "про всяк випадок",
 * що вже прийнятий у проєкті, див. `updateHomeworkVisibilityAction` нижче),
 * `/users/[id]` (динамічний шаблон шляху, той самий синтаксис
 * `revalidatePath("/users/[id]", "page")`, що вже є в
 * `modules/profile/actions.ts` — задача 9.15), `/leaderboard` (серверний
 * компонент, читає `avatarUrl` напряму з БД) і сторінка уроку з
 * коментарями — `/courses/[slug]/lessons/[lessonId]` (`RealCommentsBlock`/
 * `CommentCard` рендерять `author.avatarUrl` із `initialComments`,
 * завантажених на сервері) — той самий динамічний шаблон, тому
 * `revalidatePath("/courses/[slug]/lessons/[lessonId]", "page")` замість
 * переліку конкретних `courseId`/`lessonId` (тут, на відміну від
 * `modules/lessons/actions.ts`, немає під рукою конкретного `courseId`,
 * щоб звузити шлях до однієї сторінки — інвалідація всього шаблону є
 * єдиним практичним варіантом для дії, що не привʼязана до курсу).
 *
 * Сам `useSession().update({ avatarUrl })` (3+.0.2, `jwt`-колбек у
 * `auth.config.ts` вже обробляє `trigger === "update"`) викликається на
 * КЛІЄНТІ (`app/settings/page.tsx`), одразу після успішної відповіді цих
 * дій — це і закриває розбіжність "нове фото видно лише на `/settings` до
 * релогіну", задокументовану в 3+.1.4.
 */

const AVATAR_DISPLAY_PATHS = [
  "/profile",
  "/leaderboard",
] as const;

function revalidateAvatarPaths(): void {
  for (const path of AVATAR_DISPLAY_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/users/[id]", "page");
  revalidatePath("/courses/[slug]/lessons/[lessonId]", "page");
}

export async function updateAvatarAction(formData: FormData) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб змінити фото");
    }

    const file = formData.get("avatar");
    if (!(file instanceof File)) {
      throw new Error("Файл не передано");
    }

    validateAvatarFile(file);

    const avatarUrl = await saveAvatar(userId, file);

    try {
      await repository.updateAvatarUrl(userId, avatarUrl);
    } catch (dbErr) {
      // IMG+.2.4 (ФАЗА IMG+, 08.08.2026, orphan-safety): Cloudinary
      // upload уже успішний, але запис у БД впав — без цього тут
      // лишився б валідний файл у Cloudinary, про який БД нічого не
      // знає. Низький практичний ризик саме для аватарки (стабільний
      // `public_id = userId`, наступне завантаження й так перезапише
      // сирітський файл через `overwrite: true`), але видаляємо для
      // повноти й консистентності з тим самим підходом, що вже
      // критичний для сертифікатів (IMG+.3.4, кожен — окремий
      // `public_id` без `overwrite`). Помилку самого видалення
      // ігноруємо — головна помилка (`dbErr`) важливіша й саме вона
      // йде користувачу нижче.
      try {
        await deleteAvatar(userId);
      } catch {
        // ігноруємо — не приховувати первинну помилку БД через відмову cleanup
      }
      throw dbErr;
    }

    revalidateAvatarPaths();

    return { success: true as const, avatarUrl, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося оновити фото";
    return { success: false as const, avatarUrl: null, error: message };
  }
}

/** Скидає фото на `null` — UI (3+.1.4) підставляє `FALLBACK_PROFILE_PHOTO`. */
export async function removeAvatarAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб видалити фото");
    }

    await deleteAvatar(userId);
    await repository.updateAvatarUrl(userId, null);
    revalidateAvatarPaths();

    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося видалити фото";
    return { success: false as const, error: message };
  }
}

/**
 * `changePasswordAction` — задача 3+.3.3 (разом закриває 3+.0.3: перша
 * реалізована чутлива дія email/пароль-класу з throttle, за зразком
 * `updateAvatarAction`/`removeAvatarAction` вище — `auth()` перевіряє
 * реальну сесію, формат відповіді `{ success, error }`).
 *
 * Throttle (3+.0.4, `lib/account/rateLimit.ts`) — ключ `userId`, а не
 * `email`, як у `lib/auth/rateLimit.ts` (логін, дія до сесії): тут
 * лічильник рахує НЕВДАЛІ перевірки поточного пароля вже залогіненого
 * користувача (типова ціль брутфорсу, якби хтось отримав доступ до
 * відкритої сесії й намагався підібрати старий пароль) — перевіряється
 * ДО виклику `changePasswordService`, щоб не витрачати bcrypt-порівняння
 * на вже заблокованого користувача; лічильник скидається при успіху
 * (`clearAccountActionAttempts`) і НЕ зростає при помилці валідації
 * `ChangePasswordSchema` (невдалий формат — не спроба підбору пароля,
 * той самий принцип, що throttle логіну рахує лише невдалі спроби
 * входу, а не будь-яку помилку форми).
 *
 * 3+.3.5 (задокументоване свідоме обмеження, не код): сесії — JWT
 * (Фаза 2), без серверного сховища, тому токени на ІНШИХ пристроях НЕ
 * інвалідуються зміною пароля — немає що відкликати, токен самодостатній
 * до `maxAge`. Прийнятний наслідок рішення "JWT, не database-сесії";
 * виправлення вимагало б переходу на `strategy: "database"`, поза межами
 * цього плану.
 */
export async function changePasswordAction(input: ChangePasswordInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб змінити пароль");
    }

    if (isAccountActionRateLimited(userId)) {
      throw new Error("Забагато спроб. Спробуйте ще раз за кілька хвилин.");
    }

    const validated = ChangePasswordSchema.parse(input);

    try {
      await changePasswordService(userId, validated);
    } catch (serviceErr) {
      recordFailedAccountAction(userId);
      throw serviceErr;
    }

    clearAccountActionAttempts(userId);
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = formatActionError(err, "Не вдалося змінити пароль");
    return { success: false as const, error: message };
  }
}

/**
 * `changeEmailAction` — задача 3+.2.4, останній із трьох чутливих дій
 * акаунта (разом закриває 3+.0.3 повністю — фото/пароль/email тепер усі
 * мають реалізовані server actions). Той самий throttle за `userId`, що
 * вже в `changePasswordAction` вище (перевірка ПОТОЧНОГО пароля —
 * типова ціль брутфорсу тут так само, як і при зміні пароля).
 *
 * НЕ повертає новий email одразу (на відміну від `changePasswordAction`,
 * де зміна відбувається миттєво) — успіх тут означає лише "лист
 * надіслано", сам email у БД ще не змінився (3+.2.3): `useSession().
 * update({ email })` (3+.2.6) викликається лише пізніше, після переходу
 * за посиланням і успіху `confirmEmailChangeAction` нижче, не тут.
 */
export async function changeEmailAction(input: ChangeEmailInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб змінити email");
    }

    if (isAccountActionRateLimited(userId)) {
      throw new Error("Забагато спроб. Спробуйте ще раз за кілька хвилин.");
    }

    const validated = ChangeEmailSchema.parse(input);

    try {
      await changeEmailService(userId, validated);
    } catch (serviceErr) {
      recordFailedAccountAction(userId);
      throw serviceErr;
    }

    clearAccountActionAttempts(userId);
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = formatActionError(err, "Не вдалося змінити email");
    return { success: false as const, error: message };
  }
}

/**
 * `confirmEmailChangeAction` — друга половина 3+.2.3, викликається зі
 * сторінки `/settings/confirm-email` (новий маршрут, поза `AccountLayout`
 * — посилання з листа може бути відкрите будь-де: інша вкладка, інший
 * пристрій, навіть неавторизована сесія в цьому браузері) після переходу
 * за посиланням із листа. НАВМИСНО без перевірки `auth()`/поточної
 * сесії — сам підписаний токен (`userId` у payload, підпис на
 * `AUTH_SECRET`) є достатнім доказом права на зміну саме цього
 * акаунта: лист прийшов на НОВУ адресу лише після того, як
 * `changeEmailService` уже перевірив поточний пароль власника, тож
 * подальша перевірка сесії була б надлишковою (і завадила б звичному
 * сценарію "лист відкрито в іншому браузері/пристрої, ніж той, де
 * логін").
 */
/**
 * `deleteAccountAction` — задача F.24 (09.08.2026), реалізує відкладений
 * IMG+.3.6. Той самий каркас, що `changePasswordAction`/
 * `changeEmailAction` вище: `auth()` перевіряє реальну сесію, той самий
 * throttle `isAccountActionRateLimited`/`recordFailedAccountAction`
 * (спільний лічильник за `userId`, `lib/account/rateLimit.ts` — той
 * самий простір, що вже захищає пароль/email від брутфорсу поточного
 * пароля, видалення акаунта — не менш приваблива ціль).
 *
 * НЕ викликає `signOut()` тут — server action не має доступу до
 * client-side `next-auth/react`; клієнт (`app/settings/page.tsx`)
 * викликає `signOut({ redirect: false })` сам, ПІСЛЯ отримання
 * `{ success: true }` від цієї дії (той самий порядок, що вже був у
 * F.7-заглушці, лише тепер услід за реальним видаленням).
 */
export async function deleteAccountAction(input: DeleteAccountInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб видалити акаунт");
    }

    if (isAccountActionRateLimited(userId)) {
      throw new Error("Забагато спроб. Спробуйте ще раз за кілька хвилин.");
    }

    const validated = DeleteAccountSchema.parse(input);

    try {
      await deleteAccountService(userId, validated);
    } catch (serviceErr) {
      recordFailedAccountAction(userId);
      throw serviceErr;
    }

    clearAccountActionAttempts(userId);
    revalidatePath("/leaderboard");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = formatActionError(err, "Не вдалося видалити акаунт");
    return { success: false as const, error: message };
  }
}

export async function confirmEmailChangeAction(token: string) {
  try {
    const newEmail = await confirmEmailChangeService(token);
    return { success: true as const, email: newEmail, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося підтвердити зміну email";
    return { success: false as const, email: null, error: message };
  }
}
