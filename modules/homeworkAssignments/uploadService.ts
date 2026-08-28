import { saveHomeworkImage } from "@/lib/storage/homeworkImageStorage";
import { HOMEWORK_IMAGE_ALLOWED_MIME_TYPES, HOMEWORK_IMAGE_MAX_SIZE_BYTES } from "./schema";

/**
 * `modules/homeworkAssignments/uploadService.ts` — ФАЗА HW+, задача
 * HW+.1.4. ОКРЕМИЙ файл від `service.ts` — той самий обов'язковий поділ,
 * що CERT+.1.6 (`modules/certificates/uploadService.ts`): увесь код, що
 * транзитивно тягне Cloudinary/`fs`, живе тут, а `index.ts` реекспортує
 * цей файл ЛИШЕ через захищений `"use server"`-кордон (`actions.ts`),
 * ніколи напряму — щоб уникнути `Module not found: Can't resolve 'fs'`
 * при випадковому потраплянні в клієнтський бандл.
 */

/**
 * Дешева перевірка розміру/заявленого MIME — той самий перший UX-шар, що
 * `modules/certificates/uploadService.ts::validateCertificateFile`.
 * РЕАЛЬна перевірка вмісту файлу — всередині `saveHomeworkImage`
 * (`processUploadedImage`, IMG+.1).
 */
function validateHomeworkImageFile(file: File): void {
  if (file.size === 0) {
    throw new Error("Файл порожній");
  }

  if (
    !HOMEWORK_IMAGE_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof HOMEWORK_IMAGE_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Дозволені лише зображення у форматі JPG, PNG або WebP");
  }

  if (file.size > HOMEWORK_IMAGE_MAX_SIZE_BYTES) {
    throw new Error("Розмір файлу перевищує 5MB");
  }
}

/**
 * Завантажує зображення, вставлене адміном у текст завдання ДЗ. Повертає
 * лише `url` — `publicId` НЕ зберігається (свідома межа MVP,
 * `lib/storage/homeworkImageStorage.ts`), тому й не потрібен викликачу.
 */
export async function uploadHomeworkImageService(
  lessonId: string,
  file: File,
): Promise<{ url: string }> {
  validateHomeworkImageFile(file);

  const saved = await saveHomeworkImage(lessonId, file);

  return { url: saved.url };
}
