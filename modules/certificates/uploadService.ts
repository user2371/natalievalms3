import * as repository from "./repository";
import { saveCertificateImage, deleteCertificateImage } from "@/lib/storage/certificateStorage";
import {
  CERTIFICATE_ALLOWED_MIME_TYPES,
  CERTIFICATE_MAX_SIZE_BYTES,
  MAX_UPLOADED_CERTIFICATES_PER_USER,
  type CertificateEntry,
} from "./schema";

/**
 * `modules/certificates/uploadService.ts` — Багфікс CERT+.1.6
 * (08.08.2026, за реальним виводом користувача — `npm run dev` падав
 * на `/settings` (і будь-якій сторінці з `LoginScreen`) з
 * `Module not found: Can't resolve 'fs'`).
 *
 * ПРИЧИНА: `uploadCertificateService`/`deleteUploadedCertificateService`
 * (раніше в `service.ts`) статично імпортують
 * `lib/storage/certificateStorage.ts` → пакет `cloudinary` → вимагає
 * Node-вбудований `fs` (недоступний у браузері). `modules/certificates/
 * index.ts` — звичайний barrel-файл (`export {...} from "./service"`),
 * БЕЗ директиви `"use server"` — на відміну від `actions.ts`, де Next.js
 * спеціально "вирізає" реальний код із клієнтського бандла й лишає
 * лише RPC-заглушку, звичайний реекспорт з `service.ts` такого захисту
 * НЕ має: webpack мусить резолвити ВЕСЬ файл `service.ts` цілком, щойно
 * ДО НЬОГО дотягується клієнтський граф — а він дотягується:
 * `lib/progress/useProgressSync.ts` (`"use client"`) → `@/modules/
 * progress` (barrel) → `modules/progress/service.ts` (легітимно
 * викликає `issueCertificateIfNotExistsService` на сервері) → `@/modules/
 * certificates` (barrel) → раніше й `service.ts` цілком, разом із щойно
 * доданим Cloudinary-кодом.
 *
 * Це саме те, чому `lib/storage/avatarStorage.ts` (теж Cloudinary)
 * НІКОЛИ не спричиняв цю помилку: `modules/account` взагалі НЕ має
 * barrel-файлу — `app/settings/page.tsx` імпортує НАПРЯМУ з
 * `modules/account/actions.ts` (з `"use server"`), а `modules/account/
 * service.ts` (де й живе виклик `saveAvatar`) ніколи не реекспортується
 * "як є" через незахищений файл, тому webpack ніколи не бачить сирий
 * `avatarStorage.ts` у клієнтському графі.
 *
 * ВИПРАВЛЕННЯ: увесь код, що торкається Cloudinary/`fs`, переїхав у цей
 * ОКРЕМИЙ файл, який імпортує (і, відповідно, транзитивно "тягне" за
 * собою) ЛИШЕ `actions.ts` (`"use server"` — захищений кордон). `index.ts`
 * НІКОЛИ не реекспортує нічого з цього файлу напряму — лише
 * `uploadCertificateAction`/`deleteCertificateAction` з `actions.ts`,
 * той самий захищений шлях, що вже безпечно працює для аватарки.
 * `service.ts` лишився "чистим" (без Cloudinary), тому й далі безпечно
 * реекспортується напряму з `index.ts`, як і раніше.
 */

/**
 * CERT+.1.3 (08.08.2026). "Дешева" перевірка розміру/заявленого MIME —
 * ЛОКАЛЬНА копія того самого підходу, що `modules/account/
 * service.ts::validateAvatarFile`, НЕ переюзана напряму звідти
 * (окремий модуль, окремі константи). Це лише ПЕРШИЙ, дешевий UX-шар
 * (як і в аватарки) — РЕАЛЬна перевірка вмісту файлу відбувається
 * всередині `saveCertificateImage` (`processUploadedImage`, IMG+.1),
 * викликаного нижче.
 */
function validateCertificateFile(file: File): void {
  if (file.size === 0) {
    throw new Error("Файл порожній");
  }

  if (
    !CERTIFICATE_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof CERTIFICATE_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Дозволені лише зображення у форматі JPG, PNG або WebP");
  }

  if (file.size > CERTIFICATE_MAX_SIZE_BYTES) {
    throw new Error("Розмір файлу перевищує 10MB");
  }
}

/**
 * CERT+.1.3 — **ОНОВЛЕНО 08.08.2026 (IMG+.3.5), порядок перевірок:**
 * 1. `countUploadedForUser` — якщо ≥ `MAX_UPLOADED_CERTIFICATES_PER_USER`
 *    (20, CERT+.0.6), відмова ДО будь-якої роботи з файлом.
 * 2. `validateCertificateFile` — дешева перевірка розміру/заявленого
 *    типу (CERT+.0.4), без CPU-витрат на Sharp.
 * 3. `saveCertificateImage` (CERT+.0.3) — усередині вже реальна Sharp-
 *    перевірка вмісту й оптимізація (IMG+.1).
 * 4. `repository.createUploaded` — якщо впаде ПІСЛЯ успішного (3),
 *    orphan cleanup (`deleteCertificateImage`, IMG+.3.4) ПЕРЕД тим, як
 *    первинна помилка піде далі користувачу.
 */
export async function uploadCertificateService(
  userId: string,
  title: string,
  file: File,
): Promise<CertificateEntry> {
  const uploadedCount = await repository.countUploadedForUser(userId);
  if (uploadedCount >= MAX_UPLOADED_CERTIFICATES_PER_USER) {
    throw new Error(
      `Досягнуто ліміту завантажених сертифікатів (${MAX_UPLOADED_CERTIFICATES_PER_USER})`,
    );
  }

  validateCertificateFile(file);

  const saved = await saveCertificateImage(userId, file);

  try {
    const row = await repository.createUploaded(
      userId,
      title,
      saved.url,
      saved.publicId,
      saved.width,
      saved.height,
      saved.sizeBytes,
    );

    return {
      id: row.id,
      courseName: row.courseName,
      issuedAt: row.issuedAt.toISOString(),
      source: row.source,
      imageUrl: row.imageUrl,
    };
  } catch (dbErr) {
    // Orphan-safety (IMG+.3.4) — див. пояснення в docblock вище.
    // Помилку самого cleanup ігноруємо, щоб не приховати первинну
    // помилку БД.
    try {
      await deleteCertificateImage(saved.publicId);
    } catch {
      // ігноруємо
    }
    throw dbErr;
  }
}

/**
 * CERT+.1.3 — **ОНОВЛЕНО 08.08.2026 (CERT+.3.3): "автор АБО адмін"**,
 * 1в1 патерн, що вже готовий у проєкті —
 * `modules/comments/service.ts::deleteCommentService`.
 */
export async function deleteUploadedCertificateService(
  requesterId: string,
  requesterRole: string,
  certificateId: string,
): Promise<{ userId: string }> {
  const cert = await repository.findById(certificateId);
  if (!cert) {
    throw new Error("Сертифікат не знайдено");
  }

  const isOwner = cert.userId === requesterId;
  const isAdmin = requesterRole === "ADMIN";
  if (!isOwner && !isAdmin) {
    throw new Error("Доступ заборонено: можна видаляти лише власні сертифікати");
  }

  if (cert.source !== "uploaded") {
    throw new Error("Цей сертифікат не можна видалити");
  }

  if (cert.imagePublicId) {
    await deleteCertificateImage(cert.imagePublicId);
  }
  await repository.deleteById(certificateId);

  return { userId: cert.userId };
}
