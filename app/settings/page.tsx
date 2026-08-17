"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useSession, signOut } from "next-auth/react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { GuestGate } from "@/components/account/GuestGate";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { GearIcon, EditIcon, TrashIcon, MailIcon, LockIcon } from "@/components/ui/icons";
import { useHomeworkVisibility } from "@/lib/progress/useLocalSettings";
import {
  getPublicProfileAction,
  updateHomeworkVisibilityAction,
  updateBioAction,
} from "@/modules/profile/actions";
import {
  updateAvatarAction,
  removeAvatarAction,
  changePasswordAction,
  changeEmailAction,
  deleteAccountAction,
} from "@/modules/account/actions";
import { AVATAR_MAX_SIZE_BYTES, AVATAR_ALLOWED_MIME_TYPES } from "@/modules/account/schema";
import { validateFileBeforeUpload } from "@/lib/images/validateFileBeforeUpload";
import type { PublicProfile } from "@/modules/profile/service";
import { cn } from "@/lib/utils";

const BIO_MAX_LENGTH = 500;
/** Заглушка фото профілю (той самий підхід, що на `/profile`/`/users/[id]`), коли в юзера ще немає завантаженої аватарки. */
const FALLBACK_PROFILE_PHOTO = "/profileDemoPhoto.jpg";

/**
 * Сторінка "Налаштування" (`/settings`), за мокапом `SettingsaPage.png`
 * (у `TASKS_DETAILED.md` розділ 0.10 досі посилається на файл
 * `mockup-05-settings.html`, який так і не був завантажений — реальний
 * мокап у проєкті має назву `SettingsaPage.png`, той самий патерн заміни,
 * що вже стався з 0.9b/`HomeWorkPage.png`).
 *
 * 0.10.1 — заголовок сторінки (іконка `GearIcon` + "Налаштування") і
 * підзаголовок.
 *
 * 0.10.2 — блок "Фото профілю": поточне фото, кнопки "Змінити фото" /
 * "Видалити", підказка формату. Без реальної логіки завантаження — немає
 * бекенду для файлів (Фаза 1+/3+), лише UI за мокапом.
 *
 * 0.10.3 — блок "Про себе": `Textarea`, ініціалізована `DEMO_PROFILE.bio`,
 * лічильник символів "N/500". У мокапі під цим блоком НЕМАЄ власної кнопки
 * "Зберегти" (задача формулювала її окремо, але мокап — єдине джерело
 * правди після виправлення на `/homework`) — поле входило до спільного
 * блоку форми, що зберігався нижньою кнопкою "Зберегти зміни" (див.
 * абзац 05.08.2026/3+.4.4 нижче — це вже змінилось).
 *
 * 0.10.4 — блок "Email": поточний email (`DEMO_PROFILE.email`, поле лише
 * для читання) + кнопка "Змінити email". Реальна зміна пошти (з
 * підтвердженням/повторним логіном) вимагає бекенду — Фаза 2+, поки що UI.
 *
 * 0.10.5 — блок "Зміна паролю": три поля пароль/новий/повторити (лейбл
 * зліва, поле справа — patern мокапу, не стандартний `Input` label-зверху),
 * `type="password"` з готовим у `Input` перемикачем видимості (іконка ока).
 * Так само без бекенду — оновлення реального пароля не відбувається.
 *
 * 0.10.6 — блок "Видимість домашніх завдань": `Switch`, зв'язаний з
 * `useHomeworkVisibility()` (`lib/progress/localSettings.ts`, готувався ще
 * в сесії 0.9.5). Застосовується миттєво при кліку, без кнопки "Зберегти".
 *
 * 01.08.2026 (задача 9.15, виправлення прогалини 2, знайденої під час
 * трасування фінального E2E-сценарію): для РЕАЛЬНОГО залогіненого
 * користувача (`useSession()`, не фейковий `loggedIn` цієї сторінки —
 * решта полів сторінки й далі демо, той самий обсяг, що й раніше) значення
 * тепер синхронізується з `User.homeworkVisible` у БД —
 * `getPublicProfileAction`/`updateHomeworkVisibilityAction`
 * (`modules/profile`). При заході на сторінку реальне значення з БД
 * підвантажується і перекриває локальне (БД — джерело правди); кожен клік
 * перемикача пише і в `localStorage`/Redux (миттєвий UI, як і раніше), і
 * (best-effort, не блокує UI) у БД — щоб реальний публічний профіль
 * (`/users/[id]`) справді ховав/показував ДЗ відповідно до цього
 * перемикача.
 *
 * 02.08.2026, Фаза "Fixes", задача F.7, за прямим зверненням користувача
 * ("бачу тут ніби чужу сторінку") — той самий клас багів, що F.1/F.2/F.5/
 * F.6: гейт доступу (`loggedIn`) досі був ФЕЙКОВИМ локальним `useState`
 * (не пов'язаним із реальною сесією — на відміну від `/profile`/
 * `/my-learning`/`/homework`, задача 2.18/F.5/F.6), і сама сторінка й далі
 * показувала `DEMO_PROFILE.photoUrl`/`.bio`/`.email`/`.name`/`.avatarUrl`
 * замість даних реального користувача. Виправлено: гейт тепер
 * `useSession()` (`status === "authenticated"`, той самий принцип, що на
 * інших сторінках кабінету); фото/біо — `getPublicProfileAction`
 * (`profile.avatarUrl`/`.bio`); email — `session.user.email` (стандартне
 * поле NextAuth, уже було в сесії, просто не використовувалось тут);
 * ім'я/аватар у `AccountLayout` — `session.user`/`profile`, той самий
 * патерн, що на `/profile`. `onLogout` більше НЕ передається явно —
 * покладається на вже виправлений default `AccountLayout` (задача F.4,
 * клієнтський `signOut`), а не на фейковий `setLoggedIn(false)`. Зміна
 * пароля/email/фото і кнопка "Зберегти зміни" — і далі БЕЗ реального
 * бекенду (як і було задокументовано з самого початку, 0.10.4/0.10.5) —
 * це НЕ входило до звернення користувача (він скаржився на показ чужих
 * даних, не на неможливість їх змінити).
 *
 * 05.08.2026 (Фаза 3+, задача 3+.1.4): блок "Фото профілю" — тепер РЕАЛЬНИЙ
 * бекенд (єдиний із трьох "непрацюючих" блоків вище, де це вже зроблено;
 * email/пароль — і далі як описано в абзаці F.7 вище, лишаються в черзі
 * 3+.2/3+.3). Кнопка "Змінити фото" стала `<label>` навколо прихованого
 * `<input type="file">` (клік по лейблу відкриває системний вибір файлу —
 * стандартна поведінка браузера, без JS); вибір файлу одразу показує
 * локальний прев'ю (`URL.createObjectURL`) і викликає `updateAvatarAction`
 * (`modules/account/actions.ts`, 3+.1.3). "Видалити" — `removeAvatarAction`,
 * повертає до `FALLBACK_PROFILE_PHOTO`.
 *
 * 05.08.2026 (задача 3+.1.5, замикає фічу): після успішної відповіді
 * обох дій клієнт викликає `useSession().update({ avatarUrl })`
 * (3+.0.2, `next-auth/react`) — той самий патерн, що вже раніше
 * застосовувався в `LoginScreen`/`RegisterScreen` для синхронізації
 * `Header` після логіну. `auth.config.ts` мержить це у JWT (`trigger ===
 * "update"`), тож `Header`/`AccountLayout`/`/profile` одразу показують
 * нове фото без релогіну. `modules/account/actions.ts` тепер також
 * викликає `revalidatePath` для `/profile`, `/leaderboard`,
 * `/users/[id]` і `/courses/[slug]/lessons/[lessonId]` (коментарі) —
 * місця, де `avatarUrl` рендериться на СЕРВЕРІ або через `initialComments`
 * із сервера, а не лише з живого `useSession()`.
 *
 * 0.10.7 — блок "Видалити акаунт" (danger zone: рамка/фон у кольорі
 * `danger`, кнопка-варіант `danger`). Клік відкриває `Modal` із
 * підтвердженням; підтвердження закриває модалку й виконує клієнтський
 * `signOut()` (F.7: раніше — `onLogout()` через фейковий локальний стан
 * `loggedIn`, якого більше нема) — імітація видалення акаунта без
 * реального бекенду (модуль користувачів — Фаза 3+).
 *
 * 0.10.8 — адаптив: усі нові блоки складаються в одну колонку на
 * мобільному (`flex-col sm:flex-row`), той самий патерн, що вже
 * використовувався в блоці "Фото профілю" і на `/homework`.
 *
 * 05.08.2026 (задача 3+.4, продовжує 3+.1.5 — "Про себе" тепер теж
 * РЕАЛЬНИЙ бекенд): блок "Про себе" отримав власну кнопку "Зберегти" —
 * `updateBioAction` (`modules/profile/actions.ts`, новий модуль
 * `modules/profile/schema.ts` з `UpdateBioSchema`, той самий ліміт 500
 * символів, що вже в UI-лічильнику, але тепер РЕАЛЬНО перевіряється на
 * сервері). Загальну нижню кнопку "Зберегти зміни" (раніше — декоративна,
 * без обробника, задача 0.10.3) прибрано з самого низу сторінки — саме
 * той крок, що вже передбачався в 3+.4.4 ("на сторінці не лишалось жодної
 * кнопки з неочевидним обсягом дії"): Email/Пароль і далі без бекенду
 * (черга 3+.2/3+.3), тому в них поки що НЕМАЄ жодної кнопки збереження —
 * чесніше для користувача, ніж кнопка, що нічого не робить.
 *
 * 05.08.2026 (Фаза 3+, задача 3+.3, продовжує 3+.4/3+.1.5 — "Зміна
 * паролю" тепер теж РЕАЛЬНИЙ бекенд, останній із трьох "непрацюючих"
 * блоків, окрім email/3+.2): три поля стали контрольованими
 * (`currentPassword`/`newPassword`/`repeatPassword`), власна кнопка
 * "Зберегти новий пароль" ПІД блоком (той самий підхід, що вже в "Про
 * себе") викликає `changePasswordAction` (`modules/account/actions.ts`,
 * задачі 3+.0.3/3+.0.4/3+.3.1–3+.3.3 — throttle за `userId`, перевірка
 * поточного пароля, заборона нового == старому, той самий формат
 * відповіді `{ success, error }`). Після успіху всі 3 поля очищаються.
 * Email — і далі без бекенду (єдиний блок, що лишився в черзі, 3+.2,
 * найскладніший — вимагає Resend).
 *
 * 05.08.2026 (Фаза 3+, задача 3+.2, останній блок — "Зміна email" тепер
 * теж РЕАЛЬНИЙ бекенд, закриває всі 4 "непрацюючі" блоки `/settings`):
 * статичну кнопку "Змінити email" замінено на `Modal` (той самий
 * компонент, що вже нижче для підтвердження видалення акаунта) із
 * полями "Новий email"/"Поточний пароль" — саме поле email на сторінці
 * лишається `readOnly`, редагування лише через модалку. Модалка
 * викликає `changeEmailAction` (`modules/account/actions.ts`, задача
 * 3+.2.4), яка перевіряє пароль/унікальність і надсилає лист через
 * Resend (`lib/email/emailChangeMail.ts`, задача 3+.2.3) — email у БД
 * ЩЕ НЕ змінюється одразу, лише після переходу за посиланням на
 * `/settings/confirm-email` (`ConfirmEmailClient`, задача 3+.2.3,
 * `confirmEmailChangeAction`). Модалка після успіху показує коротке
 * підтвердження "Лист надіслано…", НЕ "email змінено" — навмисна
 * різниця з блоками фото/bio/пароль, де зміна миттєва.
 *
 * `useSession().update({ email })` (задача 3+.2.6) НАВМИСНО викликається
 * НЕ тут, а на самій `/settings/confirm-email` (`ConfirmEmailClient`) —
 * лише ПІСЛЯ реального запису нового email у БД: виклик одразу після
 * запиту зміни (як буквально сформульовано в задачі 3+.2.6) створив би
 * розбіжність сесія/БД, якби користувач так і не перейшов за
 * посиланням із листа (типовий сценарій для sandbox-обмеження Resend,
 * 3+.0.6 — лист реально дійде лише на адресу, якою зареєстровано
 * Resend-акаунт).
 */
export default function SettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const loggedIn = status === "authenticated";
  const realUserId = session?.user?.id;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [bio, setBio] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [bioSaved, setBioSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  // Задача F.24 (09.08.2026): та сама модель полів, що вже в блоці зміни
  // email/пароля (`deleteCurrentPassword`/`deleteSaving`/`deleteError`) —
  // реальне видалення вимагає підтвердження поточним паролем
  // (`deleteAccountAction`), на відміну від колишньої F.7-заглушки
  // (просто `signOut()` без жодної перевірки).
  const [deleteCurrentPassword, setDeleteCurrentPassword] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { homeworkVisible, setHomeworkVisible } = useHomeworkVisibility();

  // Задача 3+.1.4: локальний echo для фото — миттєвий прев'ю після вибору
  // файлу/видалення, без очікування на `useSession().update(...)` (3+.1.5,
  // ще не реалізовано, тож `Header`/`AccountLayout` покажуть нове фото
  // лише після релогіну — відомий і задокументований наслідок, доки
  // 3+.1.5 не зроблено). `avatarRemoved` — окремий прапорець (не просто
  // "avatarPreview === null"), бо `null` тут — це і "ще нічого не робили",
  // і "щойно видалили фото": без нього кнопка "Видалити" не мала б жодного
  // видимого ефекту (далі показувалось би старе фото з сесії/профілю).
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Задача 3+.3.4: три поля пароля були повністю неконтрольованими (без
  // `useState`/`onChange`) — той самий рівень контролю, що вже в блоці
  // "Про себе" (`bio`/`bioSaving`/`bioError`/`bioSaved`) вище.
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Задача 3+.2.5: модалка "Змінити email" (той самий компонент `Modal`,
  // що вже використано нижче для підтвердження видалення акаунта) —
  // поле email на самій сторінці лишається `readOnly`, редагування лише
  // через модалку. `emailSent` — окреме коротке підтвердження всередині
  // модалки ("Лист надіслано…"), НЕ "email змінено" — сама зміна ще не
  // відбулась, лише лист відправлено (3+.2.3), реальний запис —
  // після переходу за посиланням на `/settings/confirm-email`.
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Задача 9.15: при заході реального залогіненого користувача — БД
  // (`User.homeworkVisible`) переважає над тим, що вже було в localStorage
  // (могло розійтись, якщо значення міняли на іншому пристрої/до цієї
  // сесії). Залежність лише від `realUserId` — спрацьовує рівно раз на
  // появу реальної сесії, той самий принцип, що й `useProgressSync`.
  //
  // F.7: та сама реакція ще й підвантажує реальний профіль (фото/біо) —
  // `bio` ініціалізується з `profile.bio` лише коли значення прийшло
  // (щоб не перезаписати те, що користувач, можливо, уже почав редагувати
  // до завершення запиту).
  useEffect(() => {
    if (!realUserId) return;
    getPublicProfileAction(realUserId).then((result) => {
      if (result.success) {
        setHomeworkVisible(result.profile.homeworkVisible);
        setProfile(result.profile);
        setBio(result.profile.bio ?? "");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realUserId]);

  function handleHomeworkVisibleChange(visible: boolean) {
    setHomeworkVisible(visible);
    if (!realUserId) return;
    // Best-effort: локальний UI вже оновлено вище синхронно, запис у БД не
    // блокує перемикач (той самий принцип best-effort, що й
    // `submitQuizResultAction` у `RealQuizBlock`). Мережевий/серверний збій
    // тут навмисно мовчазний — немає окремого місця на сторінці для
    // показу помилки саме цього поля, а сам перемикач і так відображає
    // актуальний локальний стан.
    updateHomeworkVisibilityAction(visible).catch(() => {});
  }

  // Задача 3+.1.4: вибір файлу одразу показує локальний прев'ю
  // (`URL.createObjectURL`) і відправляє `updateAvatarAction` — без
  // окремої кнопки "Зберегти" для цього блоку (за мокапом дія одразу
  // застосовується, той самий принцип, що вже в перемикачі "Видимість
  // домашніх завдань" вище). Клієнтська валідація типу — через `accept=`
  // на `<input>` нижче (лише зручність, реальна перевірка — на сервері,
  // `validateAvatarFile`, 3+.1.2).
  async function handleAvatarFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // дозволяє повторно вибрати той самий файл наступного разу
    if (!file) return;

    setAvatarError(null);
    setAvatarRemoved(false);

    // Багфікс IMG+.2.6 (08.08.2026, за прямим зверненням користувача —
    // файл 12MB "падав" із сирим технічним повідомленням Next.js
    // ("Body exceeded 12mb limit") замість українського. `next.config.ts`
    // обмежує тіло Server Action до 12MB (`experimental.serverActions.
    // bodySizeLimit`, IMG+.0.4) — свідомий, навмисно вищий за
    // `AVATAR_MAX_SIZE_BYTES`/`CERTIFICATE_MAX_SIZE_BYTES` рубіж (щоб
    // врахувати накладні витрати `multipart/form-data`), який лишається
    // ГОЛОВНИМ захистом від апріорі величезних запитів (тестовий кейс
    // "файл ~100MB" в обхід UI, IMG+.6). Але для файлу, що ЛИШЕ трохи
    // перевищує реальний ліміт застосунку (5MB для аватарки) — сам
    // `multipart/form-data`-конверт міг випадково опинитись
    // близько/за межею 12MB, тож Next відхиляв запит ще ДО
    // `updateAvatarAction`/`validateAvatarFile`, і користувач замість
    // нормального повідомлення бачив технічну помилку фреймворку.
    // `validateFileBeforeUpload` (`lib/images/validateFileBeforeUpload.ts`)
    // — та сама перевірка, що вже є на сервері, виконана ще ДО
    // мережевого запиту: миттєва відмова, яка НІКОЛИ не наближається до
    // ліміту тіла запиту. Серверна перевірка лишається головною лінією
    // захисту — цю клієнтську легко обійти, як і раніше пояснено
    // коментарем нижче про `accept=`.
    const validationError = validateFileBeforeUpload(file, {
      maxSizeBytes: AVATAR_MAX_SIZE_BYTES,
      allowedMimeTypes: AVATAR_ALLOWED_MIME_TYPES,
      maxSizeErrorMessage: "Розмір файлу перевищує 5MB",
      formatErrorMessage: "Дозволені лише зображення у форматі JPG, PNG або WebP",
    });
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const result = await updateAvatarAction(formData);

      if (result.success) {
        // Задача 3+.1.5: замикає розбіжність, задокументовану в 3+.1.4 —
        // без цього виклику JWT-сесія (звідки `Header`/`AccountLayout`/
        // `/profile` беруть `avatarUrl`) лишалась би зі старим значенням до
        // релогіну, хоча БД і сама сторінка `/settings` (через локальний
        // прев'ю вище) уже показували нове фото. `auth.config.ts` (3+.0.2)
        // вже вміє мержити `trigger === "update"` з тим, що прийде тут.
        await updateSession({ avatarUrl: result.avatarUrl });
      } else {
        setAvatarError(result.error);
        setAvatarPreview(null);
      }
    } catch {
      // Багфікс IMG+.2.6: запобіжник на випадок, якщо запит усе ж дійде
      // до мережевого/фреймворкового збою (напр. обрив з'єднання, або
      // теоретично файл, що пройшов клієнтську перевірку вище, але
      // разом з накладними витратами `multipart/form-data` все ж
      // впритул до ліміту тіла запиту) — `updateAvatarAction` тоді
      // взагалі не встигає повернути `{success, error}`, тому й ловимо
      // окремо, а не покладаємось лише на `result.error` вище. Раніше
      // цей виклик нічим не був обгорнутий — спінер лишався висіти
      // назавжди, а помилка йшла в консоль необробленою.
      setAvatarError("Не вдалося завантажити файл. Спробуйте ще раз.");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleAvatarRemove() {
    setAvatarError(null);
    setAvatarUploading(true);

    const result = await removeAvatarAction();

    setAvatarUploading(false);
    if (result.success) {
      setAvatarPreview(null);
      setAvatarRemoved(true);
      // Той самий принцип, що й у `handleAvatarFileChange` вище — синхронізує
      // сесію, щоб "Видалити" теж одразу відображалось усюди, не лише на
      // цій сторінці.
      await updateSession({ avatarUrl: null });
    } else {
      setAvatarError(result.error);
    }
  }

  // Задача 3+.4.4: власна кнопка "Зберегти" ПІД блоком "Про себе" —
  // замінює загальну нижню кнопку (яка досі не мала обробника й
  // стосувалась незрозуміло чого). `bioSaved` — коротке підтвердження
  // (той самий рівень складності, що вже в `ProgressSyncToast`), гасне
  // само собою при наступній зміні тексту (нижче, в `onChange`
  // `Textarea`).
  async function handleSaveBio() {
    setBioError(null);
    setBioSaved(false);
    setBioSaving(true);

    const result = await updateBioAction(bio);

    setBioSaving(false);
    if (result.success) {
      setBioSaved(true);
    } else {
      setBioError(result.error);
    }
  }

  // Задача 3+.3.4: власна кнопка "Зберегти новий пароль" ПІД цим блоком
  // (а не загальна нижня кнопка — вже видалена в 3+.4.4). Після успіху —
  // очищає всі 3 поля й показує коротке підтвердження (той самий рівень
  // складності, що вже в `handleSaveBio`/`ProgressSyncToast`).
  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSaved(false);
    setPasswordSaving(true);

    const result = await changePasswordAction({
      currentPassword,
      newPassword,
      repeatPassword,
    });

    setPasswordSaving(false);
    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setPasswordSaved(true);
    } else {
      setPasswordError(result.error);
    }
  }

  async function handleChangeEmail() {
    setEmailError(null);
    setEmailSaving(true);

    const result = await changeEmailAction({
      newEmail,
      currentPassword: emailCurrentPassword,
    });

    setEmailSaving(false);
    if (result.success) {
      setEmailSent(true);
      setEmailCurrentPassword("");
    } else {
      setEmailError(result.error);
    }
  }

  function closeEmailModal() {
    setEmailModalOpen(false);
    setNewEmail("");
    setEmailCurrentPassword("");
    setEmailError(null);
    setEmailSent(false);
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    setDeleteCurrentPassword("");
    setDeleteError(null);
  }

  /**
   * F.24 (09.08.2026) — раніше (F.7) ця кнопка одразу викликала
   * `signOut()` без жодного реального видалення (`setLoggedIn` фейкового
   * стану більше не існує, `modules/account` тоді ще не мав бекенду для
   * цього). Тепер: реальний `deleteAccountAction` (перевірка поточного
   * пароля, каскадне видалення в БД, Cloudinary-очищення аватарки й
   * завантажених сертифікатів, `modules/account/service.ts::
   * deleteAccountService`) — і лише ПІСЛЯ його успіху клієнтський
   * `signOut()` (той самий виклик, що й раніше, тепер услід за реальним
   * видаленням, а не замість нього).
   */
  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleteSaving(true);

    const result = await deleteAccountAction({ currentPassword: deleteCurrentPassword });

    if (result.success) {
      setDeleteModalOpen(false);
      signOut({ redirect: false });
    } else {
      setDeleteSaving(false);
      setDeleteError(result.error);
    }
  }

  if (status === "loading") {
    return null;
  }

  if (!loggedIn) {
    return <GuestGate description="налаштувань" />;
  }

  const displayName = session?.user?.name ?? profile?.name ?? "";
  const sessionOrProfileAvatarUrl =
    (session?.user as { avatarUrl?: string } | undefined)?.avatarUrl ??
    profile?.avatarUrl ??
    null;
  const avatarUrl = avatarPreview ?? (avatarRemoved ? null : sessionOrProfileAvatarUrl);

  return (
    <AccountLayout user={{ name: displayName, avatarUrl }}>
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
          <GearIcon size={22} />
        </span>
        <div>
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">Налаштування</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Керуй своїм профілем, фото та обліковим записом.
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-rose-line/40 p-6">
        <h2 className="font-serif text-lg text-ink">Фото профілю</h2>

        <div className="mt-4 flex flex-wrap items-center gap-5">
          <span className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-cream-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl ?? FALLBACK_PROFILE_PHOTO}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>

          <div className="flex flex-col items-start gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark",
                  avatarUploading && "pointer-events-none opacity-50",
                )}
              >
                <EditIcon size={16} />
                Змінити фото
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={avatarUploading}
                  onChange={handleAvatarFileChange}
                />
              </label>
              <button
                type="button"
                onClick={handleAvatarRemove}
                disabled={avatarUploading}
                className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent-dark disabled:opacity-50"
              >
                <TrashIcon size={16} />
                Видалити
              </button>
            </div>
            <p className="text-xs text-muted">JPG, PNG або WebP, максимум 5MB.</p>
            {avatarError && <p className="text-sm text-danger">{avatarError}</p>}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-rose-line/40 p-6">
        <h2 className="font-serif text-lg text-ink">Email</h2>
        <p className="mt-1 text-sm text-muted">
          Ваша електронна адреса використовується для входу та важливих повідомлень.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              type="email"
              icon={<MailIcon size={18} />}
              defaultValue={session?.user?.email ?? ""}
              readOnly
              aria-label="Email"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setEmailModalOpen(true)}
          >
            Змінити email
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-rose-line/40 p-6">
        <h2 className="font-serif text-lg text-ink">Зміна паролю</h2>
        <p className="mt-1 text-sm text-muted">
          Рекомендуємо використовувати надійний пароль для захисту акаунта.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          {[
            {
              id: "current-password",
              label: "Поточний пароль",
              autoComplete: "current-password",
              value: currentPassword,
              onChange: setCurrentPassword,
            },
            {
              id: "new-password",
              label: "Новий пароль",
              autoComplete: "new-password",
              value: newPassword,
              onChange: setNewPassword,
            },
            {
              id: "repeat-password",
              label: "Повторіть новий пароль",
              autoComplete: "new-password",
              value: repeatPassword,
              onChange: setRepeatPassword,
            },
          ].map((field) => (
            <div
              key={field.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <label htmlFor={field.id} className="shrink-0 text-sm text-ink sm:w-44">
                {field.label}
              </label>
              <div className="flex-1">
                <Input
                  id={field.id}
                  type="password"
                  icon={<LockIcon size={18} />}
                  placeholder={field.label}
                  autoComplete={field.autoComplete}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setPasswordSaved(false);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={handleChangePassword}
            disabled={
              passwordSaving || !currentPassword || !newPassword || !repeatPassword
            }
          >
            {passwordSaving ? "Зберігаємо…" : "Зберегти новий пароль"}
          </Button>
          {passwordSaved && <p className="text-sm text-accent-dark">Пароль змінено.</p>}
          {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-rose-line/40 p-6">
        <h2 className="font-serif text-lg text-ink">Про себе</h2>
        <p className="mt-1 text-sm text-muted">
          Розкажи трохи про себе. Цей текст буде відображатися у твоєму профілі.
        </p>

        <div className="mt-4">
          <Textarea
            value={bio}
            onChange={(e) => {
              setBio(e.target.value.slice(0, BIO_MAX_LENGTH));
              setBioSaved(false);
            }}
            rows={4}
            maxLength={BIO_MAX_LENGTH}
            aria-label="Про себе"
          />
          <p className="mt-1.5 text-right text-xs text-muted">
            {bio.length}/{BIO_MAX_LENGTH}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={handleSaveBio} disabled={bioSaving}>
            {bioSaving ? "Зберігаємо…" : "Зберегти"}
          </Button>
          {bioSaved && <p className="text-sm text-accent-dark">Збережено.</p>}
          {bioError && <p className="text-sm text-danger">{bioError}</p>}
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-rose-line/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-lg text-ink">Видимість домашніх завдань</h2>
          <p className="mt-1 text-sm text-muted">
            Вибери, чи показувати твої домашні завдання на сторінці профілю.
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2.5 text-sm text-ink">
          <Switch
            checked={homeworkVisible}
            onChange={handleHomeworkVisibleChange}
            aria-label="Показувати домашні завдання на профілі"
          />
          Показувати на профілі
        </label>
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-danger/30 bg-danger/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-lg text-ink">Видалити акаунт</h2>
          <p className="mt-1 max-w-md text-sm text-muted">
            Після видалення акаунта всі ваші дані будуть безповоротно видалені. Цю дію
            неможливо скасувати.
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          icon={<TrashIcon size={16} />}
          className="shrink-0"
          onClick={() => setDeleteModalOpen(true)}
        >
          Видалити акаунт
        </Button>
      </section>

      <Modal
        open={emailModalOpen}
        onClose={closeEmailModal}
        labelledBy="change-email-title"
      >
        <h2 id="change-email-title" className="font-serif text-xl text-ink">
          Змінити email
        </h2>
        {emailSent ? (
          <>
            <p className="mt-2 text-sm text-muted">
              Лист із посиланням для підтвердження надіслано на {newEmail}. Email
              зміниться лише після переходу за посиланням у листі — поточний email і
              далі підходить для входу.
            </p>
            <div className="mt-6 flex justify-end">
              <Button size="sm" onClick={closeEmailModal}>
                Зрозуміло
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              На нову адресу прийде лист із посиланням для підтвердження. Email у
              акаунті зміниться лише після переходу за цим посиланням.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Input
                type="email"
                icon={<MailIcon size={18} />}
                placeholder="Новий email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                aria-label="Новий email"
              />
              <Input
                type="password"
                icon={<LockIcon size={18} />}
                placeholder="Поточний пароль"
                autoComplete="current-password"
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                aria-label="Поточний пароль"
              />
              {emailError && <p className="text-sm text-danger">{emailError}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={closeEmailModal}>
                Скасувати
              </Button>
              <Button
                size="sm"
                onClick={handleChangeEmail}
                disabled={emailSaving || !newEmail || !emailCurrentPassword}
              >
                {emailSaving ? "Надсилаємо…" : "Надіслати лист"}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => !deleteSaving && closeDeleteModal()}
        labelledBy="delete-account-title"
      >
        <h2 id="delete-account-title" className="font-serif text-xl text-ink">
          Видалити акаунт?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Усі твої дані, прогрес і здані домашні завдання будуть безповоротно видалені. Цю
          дію неможливо скасувати.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            type="password"
            icon={<LockIcon size={18} />}
            placeholder="Поточний пароль"
            autoComplete="current-password"
            value={deleteCurrentPassword}
            onChange={(e) => setDeleteCurrentPassword(e.target.value)}
            aria-label="Поточний пароль"
            disabled={deleteSaving}
          />
          {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={closeDeleteModal} disabled={deleteSaving}>
            Скасувати
          </Button>
          <Button
            variant="dangerSolid"
            size="sm"
            icon={<TrashIcon size={16} />}
            onClick={handleDeleteAccount}
            disabled={deleteSaving || !deleteCurrentPassword}
          >
            {deleteSaving ? "Видаляємо…" : "Так, видалити"}
          </Button>
        </div>
      </Modal>
    </AccountLayout>
  );
}
