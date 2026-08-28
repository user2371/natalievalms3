import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { randomUUID } from "crypto";
import { processUploadedImage } from "@/lib/images/processUploadedImage";
import { HOMEWORK_IMAGE_MAX_SIZE_BYTES } from "@/modules/homeworkAssignments/schema";

/**
 * `lib/storage/homeworkImageStorage.ts` — ФАЗА HW+, задача HW+.0.3
 * (28.08.2026). Той самий контракт-абстракція, що
 * `lib/storage/certificateStorage.ts` — споживач (`modules/
 * homeworkAssignments/uploadService.ts`, HW+.1.4) знає лише про
 * `saveHomeworkImage`/`deleteHomeworkImage` нижче, а не про Cloudinary.
 *
 * На відміну від сертифікатів (`public_id = certificates/{userId}/{uuid}`),
 * тут `public_id = homework/{lessonId}/{uuid}` — контент прив'язаний до
 * УРОКУ (один адмін редагує один опис завдання), не до списку файлів
 * конкретного користувача.
 *
 * **Свідома межа MVP (задокументована в TASKS_DETAILED.md, HW+.0.3):**
 * зображення вбудовуються ВСЕРЕДИНІ `HomeworkAssignment.contentJson`
 * (Tiptap-документ) — окремого реєстру `publicId` на кожну вставлену
 * картинку в БД немає, тому `deleteHomeworkImage` тут НЕ викликається
 * автоматично при видаленні/заміні контенту (orphan-файли в Cloudinary —
 * свідомо не вирішується зараз, той самий клас обмеження вже мовчки
 * існує для `Article`, де навіть немає й реального аплоаду).
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const HOMEWORK_IMAGE_FOLDER = "homework";

function homeworkImagePublicId(lessonId: string): string {
  return `${HOMEWORK_IMAGE_FOLDER}/${lessonId}/${randomUUID()}`;
}

export interface SavedHomeworkImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Завантажує зображення, вставлене адміном у текст завдання ДЗ, у
 * Cloudinary. Той самий Sharp-пайплайн (`processUploadedImage`, IMG+.1),
 * що й для сертифікатів/аватарки, але `maxDimension: 1600` — контент-
 * зображення всередині тексту, не повнорозмірний документ-скан.
 */
export async function saveHomeworkImage(
  lessonId: string,
  file: File,
): Promise<SavedHomeworkImage> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  const processed = await processUploadedImage(originalBuffer, {
    maxSizeBytes: HOMEWORK_IMAGE_MAX_SIZE_BYTES,
    maxDimension: 1600,
    quality: 80,
  });

  const publicId = homeworkImagePublicId(lessonId);

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(
            error ?? new Error("Cloudinary: порожня відповідь при завантаженні зображення ДЗ"),
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
 * частина того самого контракту, що `deleteCertificateImage`, для
 * майбутнього reconciliation-скрипта, якщо об'єм сирітських файлів
 * стане проблемою.
 */
export async function deleteHomeworkImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
