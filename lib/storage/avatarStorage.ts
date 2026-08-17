import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { processUploadedImage } from "@/lib/images/processUploadedImage";
import { AVATAR_MAX_SIZE_BYTES } from "@/modules/account/schema";

/**
 * `lib/storage/avatarStorage.ts` — Фаза 3+, задача 3+.1.1.
 *
 * Абстракція сховища файлів для аватарок, той самий принцип, що вже
 * виправдав себе з `VideoPlayer`/`provider` (Фаза 4,
 * `components/lesson/VideoPlayer.tsx`): решта коду (майбутні
 * `modules/account/service.ts`/`actions.ts`, задачі 3+.1.2–3+.1.5)
 * знає лише про контракт `saveAvatar`/`deleteAvatar` нижче, а не про
 * те, що саме за ним стоїть Cloudinary — щоб підключення іншого
 * провайдера в майбутньому (якби колись знадобилось) не вимагало
 * зміни викликів у сервісі/діях.
 *
 * Провайдер — Cloudinary (free tier), рішення зафіксоване в
 * `TASKS_DETAILED.md` (Фаза 3+, 3+.0.5). Ключі — `CLOUDINARY_CLOUD_NAME`/
 * `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (`.env`, налаштовано
 * 05.08.2026). Модуль лише серверний (`cloudinary` SDK не для браузера) —
 * імпортувати тільки з server actions/services, не з клієнтських
 * компонентів.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Спільна папка для всіх аватарок у Cloudinary — окремо від майбутніх інших типів файлів. */
const AVATAR_FOLDER = "avatars";

/**
 * `public_id` = `userId` (без розширення — Cloudinary сам визначає
 * формат при завантаженні). Той самий `userId` для збереження і
 * видалення — і, найголовніше, для ПОВТОРНОГО завантаження: у
 * `saveAvatar` нижче `overwrite: true` з тим самим `public_id`
 * перезаписує попередній файл цього користувача замість накопичення
 * сміття в акаунті (важливо для безкоштовного тарифу з лімітом на
 * зберігання/трафік).
 */
function avatarPublicId(userId: string): string {
  return `${AVATAR_FOLDER}/${userId}`;
}

/**
 * Завантажує/перезаписує аватарку користувача в Cloudinary, повертає
 * публічний URL (`secure_url`) для збереження в `User.avatarUrl`.
 *
 * Приймає веб-стандартний `File` (те, що прийде з `FormData` у
 * server action — задача 3+.1.3, тут ще не реалізована) — конвертується
 * в `Buffer` і йде через `upload_stream` (не `upload(path)`, бо файл
 * ще ніде не лежить на диску, лише в пам'яті запиту).
 *
 * Навмисно НЕ валідує тип/розмір файлу тут — це відповідальність
 * `modules/account/service.ts` (задача 3+.1.2): цей модуль — лише "як
 * зберегти", а не "чи можна зберігати" (та перша, дешева перевірка).
 * РЕАЛЬна перевірка вмісту (сніфінг формату, захист від
 * decompression bomb) і сама оптимізація — нижче, через
 * `processUploadedImage` (`lib/images/processUploadedImage.ts`, ФАЗА
 * IMG+, задача IMG+.2.3, 08.08.2026): у Cloudinary завантажується вже
 * готовий WebP-буфер (максимум 1000×1000, `quality` 80 — портрету для
 * аватарки більшого не треба; менше за ліміт сертифікатів 2000px,
 * IMG+.3.1 — навмисна різниця, не одне спільне число для всіх типів
 * зображень), а НЕ сирий оригінал, який передав браузер.
 *
 * Примітка про кеш: після `overwrite` Cloudinary повертає НОВИЙ номер
 * версії у складі `secure_url` (сегмент `/v{version}/...`), тож URL
 * після кожного оновлення фото відрізняється сам по собі — окремий
 * `invalidate: true` (платна CDN-інвалідація) для коректного оновлення
 * зображення в браузері не потрібен.
 */
export async function saveAvatar(userId: string, file: File): Promise<string> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  const processed = await processUploadedImage(originalBuffer, {
    maxSizeBytes: AVATAR_MAX_SIZE_BYTES,
    maxDimension: 1000,
    quality: 80,
  });

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: avatarPublicId(userId),
        overwrite: true,
        resource_type: "image",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(
            error ?? new Error("Cloudinary: порожня відповідь при завантаженні аватарки"),
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
 * Видаляє аватарку користувача з Cloudinary (виклик при "Видалити" —
 * задача 3+.1.4, ще не реалізована — і опційно перед повторним
 * завантаженням, хоча `overwrite: true` у `saveAvatar` вище вже й так
 * робить явне видалення старого файлу зайвим для цього випадку).
 *
 * Якщо файлу з таким `public_id` не існує (користувач ще ніколи не
 * завантажував фото), Cloudinary повертає `result: "not found"` —
 * НЕ помилку, тому тут це навмисно не кидає виняток.
 */
export async function deleteAvatar(userId: string): Promise<void> {
  await cloudinary.uploader.destroy(avatarPublicId(userId));
}
