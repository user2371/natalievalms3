import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { processUploadedImage } from "@/lib/images/processUploadedImage";
import { COURSE_CERTIFICATE_MAX_SIZE_BYTES } from "@/modules/courses/schema";

/**
 * `lib/storage/certificateTemplateStorage.ts` — ФАЗА CERTTPL+ (30.08.2026,
 * за прямим проханням користувача: "зроби щоб в адмінці після
 * створення курсу можна було додавати завантажити зображення
 * сертифікату").
 *
 * Той самий контракт-абстракція й той самий принцип, що вже в
 * `lib/storage/courseCoverStorage.ts` (стабільний `public_id` =
 * `{courseId}`, `overwrite: true`, Sharp-пайплайн
 * `processUploadedImage` перед завантаженням) — решта коду
 * (`modules/courses/actions.ts`) знає лише про контракт
 * `saveCertificateTemplate`/`deleteCertificateTemplate` нижче, не про
 * те, що саме за ним стоїть Cloudinary.
 *
 * Відмінності від `courseCoverStorage.ts` — лише окрема Cloudinary-папка
 * (`certificate-templates` замість `course-covers`, не змішувати з
 * обкладинками курсів у списку/на лендінгу) і `maxDimension: 2000`
 * (той самий ліміт, що вже для завантажених користувачами сертифікатів,
 * `CERT+.3.1`, `lib/storage/certificateStorage.ts` — це так само фото/скан
 * готового документа-макета, а не звичайна обкладинка-скріншот).
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Спільна папка для всіх макетів сертифікатів курсів у Cloudinary — окремо від обкладинок/аватарок/завантажених сертифікатів користувачів. */
const CERTIFICATE_TEMPLATE_FOLDER = "certificate-templates";

/**
 * `public_id` = `courseId` (без розширення) — той самий принцип, що в
 * `courseCoverStorage.ts::courseCoverPublicId`: один стабільний слот
 * на курс, повторне завантаження перезаписує попередній макет через
 * `overwrite: true` у `saveCertificateTemplate` нижче.
 */
function certificateTemplatePublicId(courseId: string): string {
  return `${CERTIFICATE_TEMPLATE_FOLDER}/${courseId}`;
}

/**
 * Завантажує/перезаписує макет сертифіката курсу в Cloudinary, повертає
 * публічний URL (`secure_url`) для збереження в `Course.certificateImage`.
 *
 * Навмисно НЕ валідує тип/розмір файлу тут — те саме розділення
 * відповідальності, що вже в `courseCoverStorage.ts::saveCourseCover`:
 * цей модуль лише "як зберегти", дешева перевірка —
 * `modules/courses/service.ts::validateCertificateTemplateFile`
 * (викликається в `actions.ts` ПЕРЕД цією функцією), реальна перевірка
 * вмісту й ресайз — `processUploadedImage` нижче.
 */
export async function saveCertificateTemplate(courseId: string, file: File): Promise<string> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  const processed = await processUploadedImage(originalBuffer, {
    maxSizeBytes: COURSE_CERTIFICATE_MAX_SIZE_BYTES,
    maxDimension: 2000,
    quality: 85,
  });

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: certificateTemplatePublicId(courseId),
        overwrite: true,
        resource_type: "image",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(
            error ??
              new Error("Cloudinary: порожня відповідь при завантаженні макета сертифіката"),
          );
          return;
        }
        resolve(uploadResult);
      },
    );
    uploadStream.end(processed.buffer);
  });

  return result.secure_url;
}

/**
 * Видаляє макет сертифіката курсу з Cloudinary (виклик і при явному
 * "Прибрати зображення" в адмінці, і для orphan-safety, якщо запис
 * курсу з новим `id` не вдалось створити ПІСЛЯ успішного завантаження
 * файлу — див. `actions.ts::createCourseAction`).
 *
 * Якщо файлу з таким `public_id` не існує, Cloudinary повертає
 * `result: "not found"` — НЕ помилку, тому тут це навмисно не кидає
 * виняток (той самий принцип, що вже в `courseCoverStorage.ts::deleteCourseCover`).
 */
export async function deleteCertificateTemplate(courseId: string): Promise<void> {
  await cloudinary.uploader.destroy(certificateTemplatePublicId(courseId));
}
