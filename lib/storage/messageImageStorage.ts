import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { randomUUID } from "crypto";
import { processUploadedImage } from "@/lib/images/processUploadedImage";
import { MESSAGE_IMAGE_MAX_SIZE_BYTES } from "@/modules/messages/schema";

/**
 * `lib/storage/messageImageStorage.ts` — ФАЗА MSG+, задача MSG+.7.8
 * (07.09.2026, за прямим проханням користувача — "додай можливість...
 * прикріпляти зображення в чаті"). Той самий контракт-абстракція, що
 * `lib/storage/homeworkImageStorage.ts`/`certificateStorage.ts` —
 * споживач (`modules/messages/uploadService.ts`) знає лише про
 * `saveMessageImage`/`deleteMessageImage` нижче, а не про Cloudinary.
 *
 * `public_id = messages/{conversationId}/{uuid}` — контент прив'язаний
 * до РОЗМОВИ (не до конкретного повідомлення чи юзера) — той самий
 * рівень групування, що вже `homework/{lessonId}/{uuid}`, зручний для
 * ручного огляду файлів однієї переписки в Cloudinary Media Library.
 *
 * **Свідома межа MVP (той самий принцип, що вже задокументований для
 * ДЗ-зображень):** видалення повідомлень поза межами MVP цього
 * проєкту (MSG+.6), тому `deleteMessageImage` тут НЕ викликається
 * автоматично — сирітські файли в Cloudinary теоретично можливі, як і
 * для зображень у тексті статті/ДЗ.
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MESSAGE_IMAGE_FOLDER = "messages";

function messageImagePublicId(conversationId: string): string {
  return `${MESSAGE_IMAGE_FOLDER}/${conversationId}/${randomUUID()}`;
}

export interface SavedMessageImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Завантажує зображення, яке користувач прикріпив до повідомлення, у
 * Cloudinary. Той самий Sharp-пайплайн (`processUploadedImage`, IMG+.1),
 * що й для ДЗ/сертифікатів/аватарки; `maxDimension: 1600` — той самий
 * розмір, що ДЗ-зображення (контент у бульбашці чату, не повнорозмірний
 * документ-скан).
 */
export async function saveMessageImage(
  conversationId: string,
  file: File,
): Promise<SavedMessageImage> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  const processed = await processUploadedImage(originalBuffer, {
    maxSizeBytes: MESSAGE_IMAGE_MAX_SIZE_BYTES,
    maxDimension: 1600,
    quality: 80,
  });

  const publicId = messageImagePublicId(conversationId);

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(
            error ?? new Error("Cloudinary: порожня відповідь при завантаженні зображення повідомлення"),
          );
          return;
        }
        resolve(uploadResult);
      },
    );
    uploadStream.end(processed.buffer);
  });

  return {
    url: result.secure_url,
    publicId,
    width: processed.width,
    height: processed.height,
    sizeBytes: processed.sizeBytes,
  };
}

/**
 * Видаляє зображення з Cloudinary за `publicId`. Наразі НЕ викликається
 * автоматично (див. "Свідома межа MVP" у docblock вище) — визначена як
 * частина того самого контракту, що `deleteHomeworkImage`, для
 * можливого майбутнього видалення повідомлень.
 */
export async function deleteMessageImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
