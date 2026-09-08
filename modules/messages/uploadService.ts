import { saveMessageImage } from "@/lib/storage/messageImageStorage";
import { MESSAGE_IMAGE_ALLOWED_MIME_TYPES, MESSAGE_IMAGE_MAX_SIZE_BYTES } from "./schema";

/**
 * `modules/messages/uploadService.ts` — ФАЗА MSG+, задача MSG+.7.8
 * (07.09.2026). ОКРЕМИЙ файл від `service.ts` — той самий обов'язковий
 * поділ, що `modules/homeworkAssignments/uploadService.ts`/
 * `modules/certificates/uploadService.ts`: увесь код, що транзитивно
 * тягне Cloudinary/`fs`, живе тут, а `index.ts` реекспортує цей файл
 * ЛИШЕ через захищений `"use server"`-кордон (`actions.ts`), ніколи
 * напряму — щоб уникнути `Module not found: Can't resolve 'fs'` при
 * випадковому потраплянні в клієнтський бандл.
 */

/**
 * Дешева перевірка розміру/заявленого MIME — той самий перший UX-шар,
 * що `validateHomeworkImageFile`. РЕАЛЬна перевірка вмісту файлу —
 * всередині `saveMessageImage` (`processUploadedImage`, IMG+.1).
 */
function validateMessageImageFile(file: File): void {
  if (file.size === 0) {
    throw new Error("Файл порожній");
  }

  if (
    !MESSAGE_IMAGE_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof MESSAGE_IMAGE_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Дозволені лише зображення у форматі JPG, PNG або WebP");
  }

  if (file.size > MESSAGE_IMAGE_MAX_SIZE_BYTES) {
    throw new Error("Розмір файлу перевищує 5MB");
  }
}

/**
 * Завантажує зображення, яке користувач прикріпив до повідомлення.
 * Повертає лише `url` — `publicId` тут викликачу не потрібен (те саме
 * рішення, що `uploadHomeworkImageService`); `sendMessageService`
 * зберігає `imageUrl` у самому повідомленні, `publicId` там наразі не
 * зберігається (див. docblock над `deleteMessageImage`).
 *
 * `conversationId`-перевірка "чи справді викликач учасник цієї
 * розмови" — ВІДПОВІДАЛЬНІСТЬ ВИКЛИКАЧА (`actions.ts`, через
 * `service.assertCanUploadMessageImage`), не цього файлу: той самий
 * поділ, що всюди в модулі ("не тільки в UI", `CLAUDE.md`) — тут лише
 * сам аплоад, без бізнес-логіки доступу.
 */
export async function uploadMessageImageService(
  conversationId: string,
  file: File,
): Promise<{ url: string }> {
  validateMessageImageFile(file);

  const saved = await saveMessageImage(conversationId, file);

  return { url: saved.url };
}
