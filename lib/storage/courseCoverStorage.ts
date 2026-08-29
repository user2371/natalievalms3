import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { processUploadedImage } from "@/lib/images/processUploadedImage";
import { COURSE_COVER_MAX_SIZE_BYTES } from "@/modules/courses/schema";

/**
 * `lib/storage/courseCoverStorage.ts` — файловий аплоад обкладинки
 * курсу (за прямим зверненням користувача: раніше в адмінці обкладинка
 * задавалась URL-рядком — `components/admin/CourseForm.tsx`, задача
 * 8.1.6 — тепер, як і аватарка, завантажується файлом).
 *
 * Той самий контракт-абстракція й ті самі правила файлу, що вже в
 * `lib/storage/avatarStorage.ts` (5MB, JPG/PNG/WebP —
 * `modules/courses/schema.ts::COURSE_COVER_MAX_SIZE_BYTES`/
 * `COURSE_COVER_ALLOWED_MIME_TYPES`, той самий Sharp-пайплайн
 * `processUploadedImage`, Cloudinary з `overwrite: true` на
 * стабільному `public_id`): решта коду (`modules/courses/actions.ts`)
 * знає лише про контракт `saveCourseCover`/`deleteCourseCover` нижче,
 * а не про те, що саме за ним стоїть Cloudinary.
 *
 * Відмінність від аватарки — лише `public_id` (`course-covers/{courseId}`
 * замість `avatars/{userId}`) і трохи більший `maxDimension` (1600 —
 * обкладинка курсу показується значно ширше за круглий аватар-портрет,
 * той самий принцип "різні ліміти для різних типів зображень", що вже
 * застосований для сертифікатів, `CERT+.3.1`, `maxDimension: 2000`).
 *
 * `courseId` для НОВОГО курсу (ще не вставленого в БД) генерується
 * заздалегідь у `actions.ts` (`crypto.randomUUID()`) — той самий
 * стабільний ідентифікатор потім передається в `service.ts::
 * createCourseService` як явний `id` запису, щоб `public_id` у
 * Cloudinary й `Course.id` у БД завжди збігались.
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Спільна папка для всіх обкладинок курсів у Cloudinary — окремо від аватарок/сертифікатів. */
const COURSE_COVER_FOLDER = "course-covers";

/**
 * `public_id` = `courseId` (без розширення) — той самий принцип, що в
 * `avatarStorage.ts::avatarPublicId`: один стабільний слот на курс,
 * повторне завантаження перезаписує попередню обкладинку через
 * `overwrite: true` у `saveCourseCover` нижче.
 */
function courseCoverPublicId(courseId: string): string {
  return `${COURSE_COVER_FOLDER}/${courseId}`;
}

/**
 * Завантажує/перезаписує обкладинку курсу в Cloudinary, повертає
 * публічний URL (`secure_url`) для збереження в `Course.coverImage`.
 *
 * Навмисно НЕ валідує тип/розмір файлу тут — те саме розділення
 * відповідальності, що вже в `avatarStorage.ts::saveAvatar`: цей
 * модуль лише "як зберегти", дешева перевірка — `modules/courses/
 * service.ts::validateCourseCoverFile` (викликається в `actions.ts`
 * ПЕРЕД цією функцією), реальна перевірка вмісту й ресайз —
 * `processUploadedImage` нижче.
 */
export async function saveCourseCover(courseId: string, file: File): Promise<string> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  const processed = await processUploadedImage(originalBuffer, {
    maxSizeBytes: COURSE_COVER_MAX_SIZE_BYTES,
    maxDimension: 1600,
    quality: 80,
  });

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: courseCoverPublicId(courseId),
        overwrite: true,
        resource_type: "image",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(
            error ??
              new Error("Cloudinary: порожня відповідь при завантаженні обкладинки курсу"),
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
 * Видаляє обкладинку курсу з Cloudinary (виклик і при явному
 * "Прибрати обкладинку" в адмінці, і для orphan-safety, якщо запис
 * курсу з новим `id` не вдалось створити ПІСЛЯ успішного завантаження
 * файлу — див. `actions.ts::createCourseAction`).
 *
 * Якщо файлу з таким `public_id` не існує, Cloudinary повертає
 * `result: "not found"` — НЕ помилку, тому тут це навмисно не кидає
 * виняток (той самий принцип, що вже в `avatarStorage.ts::deleteAvatar`).
 */
export async function deleteCourseCover(courseId: string): Promise<void> {
  await cloudinary.uploader.destroy(courseCoverPublicId(courseId));
}
