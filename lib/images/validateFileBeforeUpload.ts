/**
 * `lib/images/validateFileBeforeUpload.ts` — Багфікс IMG+.2.6 (08.08.2026,
 * за прямим зверненням користувача — файл 12MB на `/settings` "падав" із
 * сирим технічним повідомленням Next.js замість українського).
 *
 * Клієнтська, "дешева" перевірка файлу зображення ПЕРЕД відправкою на
 * сервер — окремо від `lib/images/processUploadedImage.ts` (той файл
 * імпортує `sharp`, серверну-лише залежність, і НЕ може бути
 * імпортований у клієнтський компонент, `"use client"`).
 *
 * Мета: впіймати завеликий/непідтримуваний файл ще ДО мережевого
 * запиту, щоб користувач ніколи не впирався напряму в
 * `experimental.serverActions.bodySizeLimit` Next.js (`next.config.ts`,
 * IMG+.0.4, "12mb") — той рубіж лишається на місці як другий, глибший
 * захист (напр. від прямого виклику API в обхід UI, чекліст IMG+.6), але
 * звичайний користувач через звичайну форму тепер завжди бачить те саме
 * українське повідомлення, що дала б і серверна перевірка
 * (`validateAvatarFile`/майбутній `validateCertificateFile`,
 * CERT+/IMG+.3), а не технічний текст фреймворку.
 *
 * ЦЕ ЛИШЕ UX-шар: як і серверна "дешева" перевірка (IMG+.2.1), її легко
 * обійти (напр. DevTools/прямий виклик server action) — вона НЕ
 * замінює й НЕ послаблює реальну серверну валідацію, яка лишається
 * обов'язковою й ЄДИНИМ джерелом істини щодо того, що потрапляє в
 * Cloudinary/БД.
 *
 * Спільна для будь-якого місця завантаження зображень у проєкті —
 * зараз аватарка (`app/settings/page.tsx`), надалі так само й
 * сертифікати (ФАЗА CERT+, коли з'явиться UI завантаження, ще НЕ
 * реалізовано) мають використовувати цю саму функцію зі своїми
 * константами (`CERTIFICATE_MAX_SIZE_BYTES`/
 * `CERTIFICATE_ALLOWED_MIME_TYPES`, `modules/certificates/schema.ts`),
 * а не дублювати перевірку інлайн.
 */
export interface ValidateFileBeforeUploadOptions {
  /** Максимальний розмір файлу в байтах — те саме число, що й на сервері. */
  maxSizeBytes: number;
  /** Дозволені MIME-типи — той самий список, що й на сервері. */
  allowedMimeTypes: readonly string[];
  /** Готовий український текст помилки для перевищення розміру. */
  maxSizeErrorMessage: string;
  /** Готовий український текст помилки для недозволеного формату. */
  formatErrorMessage: string;
}

/**
 * Повертає готове українське повідомлення про помилку, якщо файл не
 * проходить перевірку, або `null`, якщо все гаразд і можна відправляти
 * на сервер.
 */
export function validateFileBeforeUpload(
  file: File,
  options: ValidateFileBeforeUploadOptions,
): string | null {
  if (
    !options.allowedMimeTypes.includes(
      file.type as (typeof options.allowedMimeTypes)[number],
    )
  ) {
    return options.formatErrorMessage;
  }

  if (file.size > options.maxSizeBytes) {
    return options.maxSizeErrorMessage;
  }

  return null;
}
