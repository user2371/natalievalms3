import { slugify } from "@/lib/utils";
import {
  COURSE_COVER_ALLOWED_MIME_TYPES,
  COURSE_COVER_MAX_SIZE_BYTES,
  COURSE_CERTIFICATE_ALLOWED_MIME_TYPES,
  COURSE_CERTIFICATE_MAX_SIZE_BYTES,
  CreateCourseInput,
  CreateCourseSchema,
  UpdateCourseInput,
  UpdateCourseSchema,
} from "./schema";
import * as repository from "./repository";

/**
 * Дешева серверна валідація файлу обкладинки курсу — ПЕРЕД
 * `saveCourseCover` (`lib/storage/courseCoverStorage.ts`), той самий
 * принцип поділу відповідальності й той самий рівень перевірки
 * (розмір + заявлений `file.type`), що вже в `modules/account/
 * service.ts::validateAvatarFile`: перший, дешевий UX-шар, а не
 * заміна реальної перевірки вмісту файлу (`processUploadedImage`,
 * викликається всередині `saveCourseCover`).
 */
export function validateCourseCoverFile(file: File): void {
  if (file.size === 0) {
    throw new Error("Файл порожній");
  }

  if (
    !COURSE_COVER_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof COURSE_COVER_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Дозволені лише зображення у форматі JPG, PNG або WebP");
  }

  if (file.size > COURSE_COVER_MAX_SIZE_BYTES) {
    throw new Error("Розмір файлу перевищує 5MB");
  }
}

/**
 * ФАЗА CERTTPL+.0.2 (30.08.2026) — дешева серверна валідація файлу
 * макета сертифіката, ПЕРЕД `saveCertificateTemplate`
 * (`lib/storage/certificateTemplateStorage.ts`). Локальна копія того
 * самого принципу, що `validateCourseCoverFile` вище (не переюзана
 * напряму — окремий модуль, окремі константи/повідомлення, той самий
 * підхід незалежності модулів, що вже прийнятий у проєкті).
 */
export function validateCertificateTemplateFile(file: File): void {
  if (file.size === 0) {
    throw new Error("Файл порожній");
  }

  if (
    !COURSE_CERTIFICATE_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof COURSE_CERTIFICATE_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Дозволені лише зображення у форматі JPG, PNG або WebP");
  }

  if (file.size > COURSE_CERTIFICATE_MAX_SIZE_BYTES) {
    throw new Error("Розмір файлу перевищує 10MB");
  }
}

/**
 * `modules/courses/service.ts` (задача 3.3) — бізнес-логіка та валідація
 * поверх `repository.ts`. `actions.ts` викликає лише функції звідси, ніколи
 * не звертається до `repository.ts` напряму.
 */

/**
 * Генерує унікальний slug з назви курсу (задача 3.3, "генерація slug з
 * title, перевірка унікальності"). Якщо базовий slug вже зайнятий — додає
 * числовий суфікс (`-2`, `-3`, ...), поки не знайде вільний.
 */
async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "course";

  let candidate = base;
  let suffix = 2;
  while (await repository.findCourseBySlugExists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function listCoursesService(publishedOnly = false) {
  return repository.findAllCourses({ publishedOnly });
}

export async function getCourseBySlugService(slug: string) {
  return repository.findCourseBySlug(slug);
}

export async function getCourseByIdService(id: string) {
  return repository.findCourseById(id);
}

export async function createCourseService(
  input: CreateCourseInput,
  /**
   * `id` — не вводиться адміном і НЕ входить у `CreateCourseSchema`
   * (звичайний user input завжди йде через zod): це внутрішній
   * `crypto.randomUUID()`, згенерований у `actions.ts::createCourseAction`
   * ДО створення запису — лише тоді, коли адмін одразу завантажує файл
   * обкладинки, щоб `saveCourseCover` (стабільний `public_id =
   * course-covers/{courseId}`, той самий принцип, що вже в
   * `avatarStorage.ts`) мав курс-id ще до вставки рядка в БД.
   */
  options?: { id?: string },
) {
  const parsed = CreateCourseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані курсу");
  }

  const slug = await generateUniqueSlug(parsed.data.title);

  return repository.createCourse({
    id: options?.id,
    slug,
    title: parsed.data.title,
    description: parsed.data.description,
    coverImage: parsed.data.coverImage,
    certificateImage: parsed.data.certificateImage,
    published: parsed.data.published,
    introVideoUrl: parsed.data.introVideoUrl,
    introDescription: parsed.data.introDescription,
    masterName: parsed.data.masterName,
    masterBio: parsed.data.masterBio,
    masterAvatarUrl: parsed.data.masterAvatarUrl,
    introTitle: parsed.data.introTitle,
    introHighlights: parsed.data.introHighlights,
    categories: parsed.data.categories,
  });
}

export async function updateCourseService(input: UpdateCourseInput) {
  const parsed = UpdateCourseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані курсу");
  }

  const existing = await repository.findCourseById(parsed.data.id);
  if (!existing) {
    throw new Error("Курс не знайдено");
  }

  // Slug навмисно НЕ перегенеровується при зміні `title` — стабільний slug
  // важливий для вже опублікованих посилань на курс (SEO, закладки).
  // Зміна slug'а курсу після публікації — окрема задача поза 3.1–3.5.
  const { id, ...rest } = parsed.data;
  return repository.updateCourse(id, rest);
}

export async function deleteCourseService(id: string) {
  const existing = await repository.findCourseById(id);
  if (!existing) {
    throw new Error("Курс не знайдено");
  }

  return repository.deleteCourse(id);
}
