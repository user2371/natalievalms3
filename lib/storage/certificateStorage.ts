import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { randomUUID } from "crypto";
import { processUploadedImage } from "@/lib/images/processUploadedImage";
import { CERTIFICATE_MAX_SIZE_BYTES } from "@/modules/certificates/schema";

/**
 * `lib/storage/certificateStorage.ts` — ФАЗА CERT+, задача CERT+.0.3
 * (08.08.2026). Той самий контракт-абстракція, що вже виправдав себе в
 * `lib/storage/avatarStorage.ts` (Фаза 3+) — решта коду (майбутні
 * `modules/certificates/service.ts`, CERT+.1.3) знає лише про
 * `saveCertificateImage`/`deleteCertificateImage` нижче, а не про те,
 * що саме за ними стоїть Cloudinary.
 *
 * Головна відмінність від аватарки: там `public_id = userId`
 * (`overwrite: true` — один слот на юзера), тут — список (0..N)
 * сертифікатів, тож кожне завантаження отримує СВІЙ унікальний
 * `public_id` (`certificates/{userId}/{uuid}`, без `overwrite`).
 * Практичний наслідок: якщо `repository.createUploaded` (CERT+.1.3)
 * впаде ПІСЛЯ успішного `saveCertificateImage`, сирітський файл
 * лишиться в Cloudinary НАЗАВЖДИ без явного `deleteCertificateImage`
 * (на відміну від аватарки, де наступне завантаження й так перезаписало
 * б сирітський файл через `overwrite`) — тому orphan-safety
 * (IMG+.3.4) тут КРИТИЧНА, а не просто "для повноти", як у
 * `modules/account/actions.ts::updateAvatarAction` (IMG+.2.4).
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CERTIFICATE_FOLDER = "certificates";

function certificatePublicId(userId: string): string {
  return `${CERTIFICATE_FOLDER}/${userId}/${randomUUID()}`;
}

export interface SavedCertificateImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Завантажує фото завантаженого користувачем сертифіката в Cloudinary,
 * повертає публічний URL + `public_id` (обидва потрібні в БД —
 * `imageUrl`/`imagePublicId`, CERT+.0.1 — `publicId` інакше видалення
 * файлу з Cloudinary неможливе) і фінальні розміри/вагу (`width`/
 * `height`/`sizeBytes`, IMG+.3.3, ідуть у ті самі поля `Certificate`).
 *
 * Перед завантаженням буфер проганяється через спільний Sharp-pipeline
 * (`processUploadedImage`, IMG+.1) — `maxDimension: 2000` (документ
 * потребує більшої деталізації за портрет-аватарку, IMG+.3.1),
 * `maxSizeBytes: CERTIFICATE_MAX_SIZE_BYTES` (10MB, CERT+.0.4). У
 * Cloudinary йде вже готовий WebP-буфер, НЕ сирий оригінал.
 *
 * Навмисно НЕ валідує кількість/ліміт-20 тут — це відповідальність
 * `modules/certificates/service.ts` (CERT+.1.3, ще не реалізовано):
 * цей модуль — лише "як зберегти", а не "чи можна зберігати".
 */
export async function saveCertificateImage(
  userId: string,
  file: File,
): Promise<SavedCertificateImage> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  const processed = await processUploadedImage(originalBuffer, {
    maxSizeBytes: CERTIFICATE_MAX_SIZE_BYTES,
    maxDimension: 2000,
    quality: 80,
  });

  const publicId = certificatePublicId(userId);

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(
            error ?? new Error("Cloudinary: порожня відповідь при завантаженні сертифіката"),
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
 * Видаляє фото завантаженого сертифіката з Cloudinary — виклик і при
 * явному видаленні власником/адміном (CERT+.1.3), і при orphan-cleanup
 * (IMG+.3.4). Якщо файлу з таким `public_id` не існує, Cloudinary
 * повертає `result: "not found"` — НЕ помилку, тому тут це навмисно не
 * кидає виняток (той самий принцип, що вже в `avatarStorage.ts::
 * deleteAvatar`).
 */
export async function deleteCertificateImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
