/**
 * `lib/images/imageErrors.ts` — ФАЗА IMG+, задача IMG+.0.5.
 *
 * Спільний, невеликий набір типізованих помилок, які кидає
 * `processUploadedImage` (IMG+.1) і споживачі pipeline
 * (`modules/account/service.ts` — ретрофіт, IMG+.2; майбутній
 * `modules/certificates/service.ts` — IMG+.3). Той самий підхід, що вже
 * прийнятий у ПРОЄКТІ всюди: не окрема ієрархія класів помилок, а
 * звичайний `Error` з готовим українським текстом — `actions.ts` ловить
 * і повертає як `{ success: false, error }`, без стек-трейсів чи
 * внутрішніх деталей Cloudinary/Sharp користувачу.
 *
 * `code` — машинно-читана мітка (не показується користувачу напряму),
 * потрібна лише щоб споживач pipeline (наприклад,
 * `uploadCertificateService`) міг за потреби відрізнити один тип
 * відмови від іншого (напр. показати різний текст для "завелика
 * роздільна здатність" проти "завеликий розмір файлу") без парсингу
 * рядка повідомлення.
 */

export type ImageProcessingErrorCode =
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FORMAT"
  | "TOO_MANY_MEGAPIXELS"
  | "CORRUPTED_IMAGE";

export class ImageProcessingError extends Error {
  readonly code: ImageProcessingErrorCode;

  constructor(code: ImageProcessingErrorCode, message: string) {
    super(message);
    this.name = "ImageProcessingError";
    this.code = code;
  }
}

/**
 * Решта кодів помилок, згаданих у плані (IMG+.0.5) — `UNAUTHORIZED`,
 * `LIMIT_REACHED`, `CLOUDINARY_ERROR`, `DB_ERROR` — НЕ стосуються самого
 * Sharp-pipeline (вони виникають на рівні `actions.ts`/`service.ts`
 * споживачів, до або після викликів `processUploadedImage`), тож тут не
 * оголошені: кожен такий випадок і зараз, і надалі — звичайний `Error` з
 * готовим українським текстом прямо в місці виклику (той самий підхід,
 * що вже в `validateAvatarFile`/`changePasswordService`), без потреби в
 * спільному коді.
 */
