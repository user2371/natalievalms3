import { z } from "zod";

/**
 * `modules/courses/schema.ts` (задача 3.1).
 *
 * Вхідні дані для створення/оновлення курсу адміном. `slug` навмисно НЕ
 * входить у жодну зі схем нижче — генерується автоматично з `title` у
 * `service.ts` (задача 3.3, "генерація slug з title, перевірка
 * унікальності"), адмін його не вводить руками.
 *
 * Це Prisma-бекований модуль (`modules/courses`) — окремий від статичного
 * `lib/data/courses.ts`, яким і далі керується публічний UI (`/courses`,
 * лендінг) до задач 3.11–3.13 (підключення реальних даних). Тип `Course`
 * тут відповідає моделі `Course` у `prisma/schema.prisma`, а не типу
 * `Course` з `lib/data/courses.ts` — два різні шари, змішувати не можна.
 */
/**
 * Правила файлу обкладинки курсу (задача, за прямим зверненням
 * користувача — обкладинка курсу тепер завантажується як файл в
 * адмінці, а не вводиться URL-рядком). Ті самі правила, що вже для
 * аватарки користувача (`modules/account/schema.ts::
 * AVATAR_MAX_SIZE_BYTES`/`AVATAR_ALLOWED_MIME_TYPES`): 5MB, JPG/PNG/
 * WebP. Окрема константа зі своїм значенням (а не прямий імпорт з
 * `modules/account`) — той самий принцип незалежності модулів, що вже
 * прийнятий у проєкті для `CERTIFICATE_MAX_SIZE_BYTES`
 * (`modules/certificates/schema.ts`), навіть коли числове значення
 * збігається з іншим модулем.
 */
export const COURSE_COVER_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const COURSE_COVER_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type CourseCoverAllowedMimeType = (typeof COURSE_COVER_ALLOWED_MIME_TYPES)[number];

/**
 * ФАЗА CERTTPL+ (30.08.2026, за прямим проханням користувача) — макет
 * сертифіката курсу: адмін опційно завантажує ГОТОВЕ зображення
 * сертифіката при створенні/редагуванні курсу; якщо не завантажив —
 * при видачі системного сертифіката (`modules/certificates`) і далі
 * рендериться стандартний намальований макет ("Сертифікат... успішно
 * завершила курс... {назва курсу}", `CertificateVisual` у
 * `components/certificates/CertificateCard.tsx`) — той самий, що й
 * зараз до цієї фази.
 *
 * Окремі константи (а не переюзані `COURSE_COVER_*`/
 * `CERTIFICATE_*` з `modules/certificates/schema.ts`) — той самий
 * принцип незалежності модулів, що вже прийнятий у проєкті (див.
 * докблок над `COURSE_COVER_MAX_SIZE_BYTES` вище): 10MB — як
 * `CERTIFICATE_MAX_SIZE_BYTES` (це фото готового документа/макета, а
 * не звичайна обкладинка-скріншот, тому більший ліміт, ніж 5MB
 * обкладинки), той самий набір форматів JPG/PNG/WebP.
 */
export const COURSE_CERTIFICATE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const COURSE_CERTIFICATE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type CourseCertificateAllowedMimeType =
  (typeof COURSE_CERTIFICATE_ALLOWED_MIME_TYPES)[number];

export const CreateCourseSchema = z.object({
  title: z.string().trim().min(3, "Назва курсу має містити мінімум 3 символи"),
  description: z.string().trim().min(10, "Опис курсу має містити мінімум 10 символів"),
  coverImage: z.string().trim().url("Некоректний URL обкладинки").optional().nullable(),
  // CERTTPL+.0.1 — той самий підхід, що `coverImage` вище: URL уже
  // завантаженого в Cloudinary файлу, сам файл завжди йде окремо через
  // `FormData` (`modules/courses/actions.ts`), тут лише готовий рядок.
  certificateImage: z
    .string()
    .trim()
    .url("Некоректний URL макета сертифіката")
    .optional()
    .nullable(),
  published: z.boolean().optional().default(false),
  introVideoUrl: z.string().trim().min(1).optional().nullable(),
  introDescription: z.string().trim().optional().nullable(),
  masterName: z.string().trim().min(1).optional().nullable(),
  masterBio: z.string().trim().min(1).optional().nullable(),
  masterAvatarUrl: z.string().trim().url("Некоректний URL аватара").optional().nullable(),
  // Заголовок і пункти-переваги секції "Про курс" на лендінгу (задача
  // HOME+.2.1) — доповнюють `introVideoUrl`/`introDescription` вище.
  introTitle: z.string().trim().min(1).optional().nullable(),
  introHighlights: z.array(z.string().trim().min(1)).optional(),
});

export const UpdateCourseSchema = CreateCourseSchema.partial().extend({
  id: z.string().min(1, "Не вказано ID курсу"),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

/** Форма курсу, яку повертає `repository`/`service` (дзеркалить модель Prisma `Course`). */
export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  /** CERTTPL+.0.1 — `NULL`, доки адмін не завантажив власний макет сертифіката для цього курсу. */
  certificateImage: string | null;
  published: boolean;
  introVideoUrl: string | null;
  introDescription: string | null;
  masterName: string | null;
  masterBio: string | null;
  masterAvatarUrl: string | null;
  introTitle: string | null;
  introHighlights: string[];
  createdAt: Date;
  updatedAt: Date;
}
