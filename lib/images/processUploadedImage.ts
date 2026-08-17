import sharp from "sharp";
import { ImageProcessingError } from "./imageErrors";

/**
 * `lib/images/processUploadedImage.ts` — ФАЗА IMG+, задачі IMG+.0.3 та
 * IMG+.1 (сам pipeline).
 *
 * ОДНА крапка входу в Sharp, яку перевикористовують і ретрофіт
 * аватарки (`lib/storage/avatarStorage.ts`, IMG+.2 — ще не зроблено),
 * і майбутні сертифікати (`lib/storage/certificateStorage.ts`, IMG+.3),
 * і будь-яка майбутня file-upload фіча — щоб перевірку/оптимізацію не
 * дублювати в кожному модулі окремо (той самий принцип переюзання, що
 * вже застосований у проєкті для `avatarStorage.ts`-подібних
 * абстракцій, `VideoPlayer`-провайдерів тощо).
 *
 * Що робить (у цьому порядку — порядок навмисний, від найдешевшої
 * перевірки до найдорожчої, IMG+.5):
 *  1. Дешева перевірка розміру буфера (без Sharp).
 *  2. `sharp(...).metadata()` — читає лише заголовок файлу, розпізнає
 *     РЕАЛЬНИЙ формат вмісту (сніфінг), а не довіряє
 *     `file.type`/розширенню імені файлу, які приходять із браузера і
 *     легко підробляються.
 *  3. Перевірка формату проти дозволених.
 *  4. Перевірка роздільної здатності (мегапікселі) — захист від
 *     "decompression bomb": файл може бути малим за вагою (сильно
 *     стиснутий), але мати підозріло величезні пікселі; ця перевірка
 *     спрацьовує ДО повного декодування пікселів (яке запускають лише
 *     `.resize()`/`.toBuffer()` нижче).
 *  5. Ресайз (зберігає aspect ratio, не апскейлить маленькі зображення).
 *  6. Конвертація в WebP (Sharp сам відкидає EXIF/GPS/інші метадані при
 *     конвертації формату — саме цього й вимагає "видаляти непотрібні
 *     metadata", окремий `.withMetadata()` НЕ викликається).
 *
 * Кидає `ImageProcessingError` (типізовані коди, `lib/images/imageErrors.ts`)
 * при відмові на будь-якому кроці. Викликач (сервісний шар споживача —
 * `modules/account/service.ts`/`modules/certificates/service.ts`) МУСИТЬ
 * обгортати виклик у `try/catch` і встановлювати контекстний, зрозумілий
 * українською текст для конкретного типу файлу (аватарка/сертифікат —
 * різні ліміти й різний текст), той самий поділ, що вже всюди в
 * проєкті: спільна "механіка" в `lib/`, тексти помилок — у
 * `service.ts` кожного модуля-споживача (`modules/<назва>/service.ts`).
 */

export interface ProcessImageOptions {
  /** Максимальний розмір вхідного буфера (оригіналу) у байтах. */
  maxSizeBytes: number;
  /** Максимальна ширина/висота результату (aspect ratio зберігається). */
  maxDimension: number;
  /**
   * Максимальна кількість пікселів (ширина × висота) ВХІДНОГО
   * зображення. За замовчуванням — 25 мегапікселів, той самий ліміт,
   * що вже й у Cloudinary Free plan (CERT+.3.4), щоб відхиляти
   * підозрілі файли ДО спроби завантаження в Cloudinary.
   */
  maxMegapixels?: number;
  /** Якість WebP (0–100). За замовчуванням 80 — компроміс розмір/якість. */
  quality?: number;
  /** Дозволені вхідні формати. За замовчуванням — усі три, що підтримує проєкт. */
  allowedFormats?: readonly ("jpeg" | "png" | "webp")[];
}

export interface ProcessedImage {
  /** Готовий WebP-буфер, придатний для завантаження в Cloudinary. */
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
}

const DEFAULT_MAX_MEGAPIXELS = 25_000_000;
const DEFAULT_QUALITY = 80;
const DEFAULT_ALLOWED_FORMATS: readonly ("jpeg" | "png" | "webp")[] = [
  "jpeg",
  "png",
  "webp",
];

export async function processUploadedImage(
  input: Buffer,
  options: ProcessImageOptions,
): Promise<ProcessedImage> {
  const maxMegapixels = options.maxMegapixels ?? DEFAULT_MAX_MEGAPIXELS;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const allowedFormats = options.allowedFormats ?? DEFAULT_ALLOWED_FORMATS;

  // IMG+.1.1 — найдешевша перевірка, до будь-якого виклику Sharp: не
  // гаяти CPU на розбір завідомо надто великого буфера.
  if (input.length > options.maxSizeBytes) {
    throw new ImageProcessingError(
      "FILE_TOO_LARGE",
      `Розмір файлу перевищує ${Math.round(options.maxSizeBytes / (1024 * 1024))}MB`,
    );
  }

  // IMG+.1.2 — Sharp не зміг розпізнати вміст (пошкоджений файл,
  // не-зображення з фейковим розширенням). Це і є справжня перевірка
  // "реального binary content", а не довіра до `file.type`.
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(input).metadata();
  } catch {
    throw new ImageProcessingError(
      "CORRUPTED_IMAGE",
      "Не вдалося розпізнати зображення — файл пошкоджений або має неправильний формат",
    );
  }

  // IMG+.1.3 — реальний формат (визначений Sharp за вмістом), а НЕ
  // розширення імені файлу чи заявлений MIME-тип.
  if (!metadata.format || !allowedFormats.includes(metadata.format as "jpeg" | "png" | "webp")) {
    throw new ImageProcessingError(
      "UNSUPPORTED_FORMAT",
      "Дозволені лише зображення у форматі JPG, PNG або WebP",
    );
  }

  // IMG+.1.3b — захист від "decompression bomb": перевіряється ДО
  // ресайзу/конвертації (тобто до повного декодування пікселів), бо
  // `metadata()` вище лише читає заголовок.
  const megapixels = (metadata.width ?? 0) * (metadata.height ?? 0);
  if (megapixels > maxMegapixels) {
    throw new ImageProcessingError(
      "TOO_MANY_MEGAPIXELS",
      "Зображення завелике за роздільною здатністю",
    );
  }

  // IMG+.1.4–IMG+.1.6 — ресайз (без апскейлу маленьких зображень) і
  // конвертація в WebP. Будь-яка помилка тут (IMG+.1.7) — не мала б
  // траплятись після успішного `metadata()`, але Sharp — зовнішня
  // бібліотека, тож теж ловиться й показується як загальний
  // `CORRUPTED_IMAGE`, без сирого тексту помилки Sharp користувачу.
  try {
    const { data, info } = await sharp(input)
      .resize({
        width: options.maxDimension,
        height: options.maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      sizeBytes: info.size,
    };
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      throw error;
    }
    throw new ImageProcessingError(
      "CORRUPTED_IMAGE",
      "Не вдалося обробити зображення — спробуйте інший файл",
    );
  }
}
