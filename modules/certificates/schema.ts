import { z } from "zod";

/**
 * `modules/certificates/schema.ts` — новий модуль (Фаза "Fixes", за прямим
 * проханням користувача), той самий поділ на
 * schema/repository/service/actions/index, що й у `modules/homework`.
 *
 * Немає Zod-схеми вхідних даних, бо видача сертифіката — НЕ форма, яку
 * заповнює користувач: вона автоматична, системний побічний ефект
 * завершення курсу (той самий тригер, що вже нараховує +5 балів —
 * `awardCoursePoints`, `modules/quizzes/actions.ts` →
 * `submitQuizResultAction`). Єдиний "вхід" — `userId`+`courseId`, обидва
 * вже перевірені на момент виклику (сесія + `courseCheck.courseId` з
 * `isCourseFullyCompletedForLessonService`), валідувати нема чого.
 */

/**
 * ФАЗА CERT+ (08.08.2026) — константи нижче додані як частина CERT+.0
 * (спільні рішення перед першою підзадачею бекенду). Сам
 * `UploadCertificateSchema`/оновлення `CertificateEntry` (новий
 * `source`/`imageUrl`, перейменування `courseName` → `title`) прийдуть
 * разом із CERT+.1.1 — окремою наступною підзадачею, ще НЕ
 * реалізованою; ця частина плану — лише фундамент (валідаційні
 * ліміти), яким уже користується `lib/storage/certificateStorage.ts`
 * (CERT+.0.3).
 */

/**
 * CERT+.0.4. Своя пара констант, НЕ переюзана з
 * `modules/account/schema.ts::AVATAR_ALLOWED_MIME_TYPES`/
 * `AVATAR_MAX_SIZE_BYTES` напряму — інший модуль, інші ліміти.
 *
 * Формати — **ВИРІШЕНО ОСТАТОЧНО, CERT+.3.1**: JPEG + PNG + WebP, усі
 * три, без звуження (той самий набір, що вже в аватарки після
 * ретрофіту, IMG+.2.2, але окрема константа — навмисно різні модулі).
 *
 * Ці константи — лише ПЕРШИЙ, дешевий UX-шар (frontend `accept=` +
 * швидкий серверний pre-check розміру ДО читання файлу в пам'ять), той
 * самий принцип, що вже в `AVATAR_ALLOWED_MIME_TYPES`/
 * `AVATAR_MAX_SIZE_BYTES` після ретрофіту (IMG+.2.1). РЕАЛЬНА перевірка
 * формату — сніфінг справжнього вмісту файлу через Sharp
 * (`processUploadedImage`, IMG+.1), викликається в
 * `saveCertificateImage` (`lib/storage/certificateStorage.ts`,
 * CERT+.0.3) — не довіра до `file.type`/розширення.
 */
export const CERTIFICATE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type CertificateAllowedMimeType = (typeof CERTIFICATE_ALLOWED_MIME_TYPES)[number];

/**
 * CERT+.0.4/CERT+.3.4 — **10MB, ЗАТВЕРДЖЕНИЙ ліміт (не орієнтовний)**,
 * підтверджено актуальною документацією Cloudinary Free plan.
 * Застосовується до РОЗМІРУ ОРИГІНАЛУ, який завантажує людина, а НЕ до
 * фінального файлу після Sharp-оптимізації (IMG+.1) — фінальний WebP
 * зазвичай значно менший.
 *
 * Навмисно БІЛЬШИЙ за `AVATAR_MAX_SIZE_BYTES` (5MB, `modules/account/
 * schema.ts`) — фото паперового документа зі смартфона легко важить
 * 5–8MB навіть у нормальному вигляді, 5MB відхиляв би цілком нормальні
 * фото; окремі, навмисно різні ліміти, а не одне спільне число для всіх
 * типів зображень у проєкті.
 */
export const CERTIFICATE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** CERT+.0.5 — обов'язкове поле вільного тексту "Назва сертифіката" при завантаженні. */
export const CERTIFICATE_TITLE_MIN_LENGTH = 1;
export const CERTIFICATE_TITLE_MAX_LENGTH = 120;

/**
 * CERT+.0.6 — ліміт кількості ЗАВАНТАЖЕНИХ (`source = "UPLOADED"`)
 * сертифікатів на користувача. Автоматично видані `SYSTEM`-сертифікати
 * в ліміт НЕ входять — кількість курсів, які реально пройшла людина,
 * обмежувати не можна. Перевірка — у майбутньому
 * `uploadCertificateService` (CERT+.1.3, ще не реалізовано),
 * `modules/certificates/repository.ts::countUploadedForUser` (CERT+.1.2,
 * ще не реалізовано).
 */
export const MAX_UPLOADED_CERTIFICATES_PER_USER = 20;

/** Форма сертифіката для UI (`components/certificates/*`) — той самий інтерфейс `Certificate`, що раніше жив лише в `lib/data/certificates.ts` як демо-дані. */
export interface CertificateEntry {
  id: string;
  courseName: string;
  /** ISO-дата видачі. */
  issuedAt: string;
  /**
   * CERT+.1.1 (08.08.2026). `"system"` — автоматично видані за
   * завершення курсу (як і раніше), `"uploaded"` — завантажені самим
   * користувачем (CERT+.1). Рядкові літерали, не enum-значення Prisma
   * (`CertificateSource`) напряму — той самий принцип, що вже в
   * `role`/інших enum-полях проєкту: модуль не протікає деталі схеми
   * БД у UI-типи.
   */
  source: "system" | "uploaded";
  /**
   * Cloudinary URL фото — лише для `source === "uploaded"`. `null` для
   * `"system"` (там і далі рендериться SVG-"папір" з `courseName`, не
   * фото — UI-компонент вирішує, що показати, за цим полем).
   */
  imageUrl: string | null;
}

/**
 * CERT+.1.1 (08.08.2026). Форма даних при завантаженні власного
 * сертифіката — сам файл передається ОКРЕМО через `FormData`
 * (`formData.get("image")`), той самий підхід, що вже в
 * `updateAvatarAction` (`modules/account/actions.ts`) — `File` не
 * серіалізується як звичайний Zod-аргумент, тому Zod тут перевіряє
 * лише текстове поле `title`.
 */
export const UploadCertificateSchema = z.object({
  title: z
    .string()
    .min(CERTIFICATE_TITLE_MIN_LENGTH, "Введіть назву сертифіката")
    .max(
      CERTIFICATE_TITLE_MAX_LENGTH,
      `Назва не може перевищувати ${CERTIFICATE_TITLE_MAX_LENGTH} символів`,
    ),
});
export type UploadCertificateInput = z.infer<typeof UploadCertificateSchema>;
