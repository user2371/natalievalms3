import * as repository from "./repository";
import type { CertificateEntry } from "./schema";

/**
 * `modules/certificates/service.ts` — той самий поділ, що й у
 * `modules/homework/service.ts`.
 *
 * Багфікс CERT+.1.6 (08.08.2026): цей файл СВІДОМО не має жодної
 * залежності від Cloudinary/`fs` — він реекспортується напряму (БЕЗ
 * `"use server"`-захисту) через `index.ts`, а той, своєю чергою,
 * реально дотягується до клієнтського бандла через `modules/progress`
 * (`useProgressSync.ts` → `syncLocalProgressAction`). Увесь код
 * завантаження/видалення фото сертифіката (реально залежний від
 * Cloudinary) — окремий файл `uploadService.ts`, імпортований ЛИШЕ з
 * `actions.ts` (захищений `"use server"`-кордоном), НЕ з `index.ts`
 * напряму. Деталі — docblock на початку `uploadService.ts`.
 */

export async function issueCertificateIfNotExistsService(
  userId: string,
  courseId: string,
): Promise<void> {
  await repository.issueIfNotExists(userId, courseId);
}

export async function getCertificatesForUserService(
  userId: string,
): Promise<CertificateEntry[]> {
  const rows = await repository.findAllForUser(userId);
  return rows.map((row) => ({
    id: row.id,
    courseName: row.courseName,
    issuedAt: row.issuedAt.toISOString(),
    source: row.source,
    imageUrl: row.imageUrl,
  }));
}
