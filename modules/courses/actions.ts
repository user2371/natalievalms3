"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { saveCourseCover, deleteCourseCover } from "@/lib/storage/courseCoverStorage";
import { validateCourseCoverFile } from "./service";
import * as service from "./service";

/**
 * `modules/courses/actions.ts` (задача 3.4) — Next.js server actions,
 * викликають лише `service.ts`. Мутації курсу доступні тільки ролі `ADMIN`
 * — перевірка ролі ОБОВ'ЯЗКОВА тут, а не лише в UI/middleware (`/admin/*`
 * і так захищений `middleware.ts`, але той самий принцип "не тільки в UI",
 * задокументований у `CLAUDE.md`, вимагає дублювання перевірки на рівні
 * самого server action).
 *
 * ОНОВЛЕНО (за прямим зверненням користувача) — обкладинка курсу тепер
 * завантажується файлом, а не URL-рядком (`components/admin/CourseForm.tsx`,
 * колишня задача 8.1.6). Обидві дії тепер приймають `FormData` (а не
 * типізований `CreateCourseInput`/`UpdateCourseInput` напряму) — те саме
 * обмеження Next.js server actions для бінарних даних, що вже задокументоване
 * в `modules/account/actions.ts` (`File` не серіалізується як звичайний
 * аргумент).
 */

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Доступ заборонено: потрібна роль адміністратора");
  }
}

/** Спільний парсинг текстових полів форми курсу — однаковий для create/update. */
function readCourseFormFields(formData: FormData) {
  const getString = (key: string): string => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  return {
    title: getString("title"),
    description: getString("description"),
    published: formData.get("published") === "true",
    introVideoUrl: getString("introVideoUrl") || null,
    introDescription: getString("introDescription") || null,
    masterName: getString("masterName") || null,
    masterBio: getString("masterBio") || null,
    masterAvatarUrl: getString("masterAvatarUrl") || null,
    introTitle: getString("introTitle") || null,
    // Кілька полів `introHighlights` з однаковим іменем (задача
    // HOME+.2.4) — `FormData.getAll` повертає їх усі; порожні/пробільні
    // рядки відфільтровуються (адмін міг лишити порожній рядок у списку).
    introHighlights: formData
      .getAll("introHighlights")
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0),
  };
}

export async function createCourseAction(formData: FormData) {
  try {
    await assertAdmin();

    const fields = readCourseFormFields(formData);
    const file = formData.get("coverImage");

    let coverImage: string | null = null;
    // Задається лише коли адмін одразу завантажує файл обкладинки —
    // `courseId` генерується ТУТ, до вставки рядка в БД, щоб
    // `saveCourseCover` (стабільний `public_id`, `overwrite: true`,
    // той самий принцип, що вже в `avatarStorage.ts`) мав курс-id ще
    // до створення самого запису.
    let courseId: string | undefined;

    if (file instanceof File && file.size > 0) {
      validateCourseCoverFile(file);
      courseId = randomUUID();
      coverImage = await saveCourseCover(courseId, file);
    }

    try {
      const course = await service.createCourseService(
        { ...fields, coverImage },
        { id: courseId },
      );
      revalidatePath("/admin/courses");
      revalidatePath("/courses");
      revalidatePath("/");
      return { success: true as const, course, error: null };
    } catch (dbErr) {
      // Orphan-safety (той самий принцип, що вже в `modules/account/
      // actions.ts::updateAvatarAction`): файл уже завантажено в
      // Cloudinary, але запис курсу в БД не вдалось створити (напр.
      // серверна валідація `CreateCourseSchema` впала) — видаляємо
      // сирітський файл, щоб він не лишався прив'язаним до `courseId`,
      // який ніколи не стане реальним курсом.
      if (courseId) {
        try {
          await deleteCourseCover(courseId);
        } catch {
          // ігноруємо — не приховувати первинну помилку через відмову cleanup
        }
      }
      throw dbErr;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося створити курс";
    return { success: false as const, course: null, error: message };
  }
}

export async function updateCourseAction(formData: FormData) {
  try {
    await assertAdmin();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) {
      throw new Error("Не вказано ID курсу");
    }

    const fields = readCourseFormFields(formData);
    const file = formData.get("coverImage");
    const removeCoverImage = formData.get("removeCoverImage") === "true";

    // `undefined` — обкладинку не чіпаємо (адмін нічого не змінював у
    // цьому блоці форми); `null` — явно прибрати; рядок — нове фото.
    let coverImage: string | null | undefined;

    if (file instanceof File && file.size > 0) {
      validateCourseCoverFile(file);
      // `public_id = course-covers/{id}` уже стабільний (курс існує) —
      // `overwrite: true` сам замінює попередню обкладинку, без
      // окремого `deleteCourseCover` перед завантаженням (той самий
      // принцип, що вже в `avatarStorage.ts::saveAvatar`).
      coverImage = await saveCourseCover(id, file);
    } else if (removeCoverImage) {
      await deleteCourseCover(id);
      coverImage = null;
    }

    const course = await service.updateCourseService({
      id,
      ...fields,
      ...(coverImage !== undefined ? { coverImage } : {}),
    });

    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath(`/courses/${course.slug}`);
    // Курс міг бути featured-курсом на головній (задача HOME+) —
    // редагування hero/про-курс/про-майстра полів має одразу
    // відобразитись на лендінгу, без окремого перемикання featured-курсу.
    revalidatePath("/");
    return { success: true as const, course, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося оновити курс";
    return { success: false as const, course: null, error: message };
  }
}

export async function deleteCourseAction(id: string) {
  try {
    await assertAdmin();
    await service.deleteCourseService(id);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося видалити курс";
    return { success: false as const, error: message };
  }
}
