import { prisma } from "@/lib/prisma";

/**
 * `modules/certificates/repository.ts` — лише прямі запити до Prisma, той
 * самий поділ, що й у `modules/homework/repository.ts`.
 */

/**
 * Ідемпотентна видача — `@@unique([userId, courseId])` у схемі гарантує,
 * що повторний виклик (напр. якщо тригер у `submitQuizResultAction`
 * якимось чином спрацює вдруге для вже завершеного курсу) не впаде і не
 * заплодить дублікат: перевіряємо наявність вручну (той самий підхід, що
 * `modules/homework/repository.ts.upsert`, а не `prisma.upsert`, бо тут
 * при повторному виклику треба просто НІЧОГО не робити, не оновлювати
 * `issuedAt` — дата видачі має лишатись першою реальною датою завершення).
 */
export async function issueIfNotExists(userId: string, courseId: string): Promise<void> {
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  if (existing) return;

  await prisma.certificate.create({ data: { userId, courseId } });
}

export interface CertificateRow {
  id: string;
  courseName: string;
  issuedAt: Date;
  source: "system" | "uploaded";
  imageUrl: string | null;
}

/**
 * CERT+.1.2 (08.08.2026) — `include: { course: ... }` лишається, але
 * `course` тепер ОПЦІЙНИЙ у результаті (Prisma поверне `null` для
 * `UPLOADED`-рядків, де `courseId` — `NULL`, CERT+.0.1): `row.course?.
 * title` замість `row.course.title`. Для `UPLOADED` назва береться з
 * власного поля `title` (яке вводить сам користувач при завантаженні,
 * CERT+.1.1/CERT+.1.3); фолбек на порожній рядок — суто захист типів,
 * на практиці `title` для `UPLOADED` завжди заповнений (обов'язкове
 * поле `UploadCertificateSchema`).
 */
export async function findAllForUser(userId: string): Promise<CertificateRow[]> {
  const rows = await prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    include: { course: { select: { title: true } } },
  });

  return rows.map(
    (row: {
      id: string;
      issuedAt: Date;
      source: "SYSTEM" | "UPLOADED";
      title: string | null;
      imageUrl: string | null;
      course: { title: string } | null;
    }) => ({
      id: row.id,
      courseName: row.course?.title ?? row.title ?? "",
      issuedAt: row.issuedAt,
      source: row.source === "UPLOADED" ? ("uploaded" as const) : ("system" as const),
      imageUrl: row.imageUrl,
    }),
  );
}

/**
 * CERT+.1.2/CERT+.0.6 — лічильник ЛИШЕ `UPLOADED`-рядків (ліміт 20,
 * `MAX_UPLOADED_CERTIFICATES_PER_USER`), автоматично видані `SYSTEM`
 * НЕ рахуються (`modules/certificates/schema.ts`, коментар над
 * константою). Перевіряється в `service.ts::uploadCertificateService`
 * ПЕРШИМ кроком, ДО будь-якої роботи з файлом.
 */
export async function countUploadedForUser(userId: string): Promise<number> {
  return prisma.certificate.count({
    where: { userId, source: "UPLOADED" },
  });
}

/**
 * CERT+.1.2 — новий завантажений сертифікат, БЕЗ `courseId`
 * (`UPLOADED` не прив'язаний до курсу, CERT+.0.1). `width`/`height`/
 * `sizeBytes` — метадані вже обробленого Sharp-pipeline зображення
 * (IMG+.3.3, `SavedCertificateImage` з `lib/storage/
 * certificateStorage.ts::saveCertificateImage`) — записуються одразу,
 * а не окремим наступним запитом, оскільки модель вже має відповідні
 * поля саме для цього.
 */
export async function createUploaded(
  userId: string,
  title: string,
  imageUrl: string,
  imagePublicId: string,
  width: number,
  height: number,
  sizeBytes: number,
): Promise<CertificateRow> {
  const row = await prisma.certificate.create({
    data: {
      userId,
      source: "UPLOADED",
      title,
      imageUrl,
      imagePublicId,
      width,
      height,
      sizeBytes,
    },
  });

  return {
    id: row.id,
    courseName: row.title ?? "",
    issuedAt: row.issuedAt,
    source: "uploaded",
    imageUrl: row.imageUrl,
  };
}

/**
 * CERT+.1.2 — **ОНОВЛЕНО 08.08.2026:** БЕЗ фільтра по `userId` (на
 * відміну від початкової чернетки `findOwnedById`) — повертає рядок
 * незалежно від власника, разом із `userId`, щоб перевірку "власник чи
 * адмін" робив сервіс (`deleteUploadedCertificateService`, CERT+.1.3/
 * CERT+.3.3), а не сам запит; `userId` у відповіді потрібен ще й для
 * `revalidatePath` у `deleteCertificateAction` (CERT+.1.4), коли
 * видаляє АДМІН — інвалідувати треба сторінку ВЛАСНИКА сертифіката, не
 * адміна.
 */
export async function findById(certificateId: string): Promise<{
  id: string;
  userId: string;
  imagePublicId: string | null;
  source: "system" | "uploaded";
} | null> {
  const row = await prisma.certificate.findUnique({
    where: { id: certificateId },
    select: { id: true, userId: true, imagePublicId: true, source: true },
  });
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    imagePublicId: row.imagePublicId,
    source: row.source === "UPLOADED" ? "uploaded" : "system",
  };
}

export async function deleteById(certificateId: string): Promise<void> {
  await prisma.certificate.delete({ where: { id: certificateId } });
}

/**
 * Задача F.24/IMG+.3.6 (09.08.2026) — усі Cloudinary `public_id`
 * ЗАВАНТАЖЕНИХ (не `SYSTEM`, там `imagePublicId` завжди `NULL`)
 * сертифікатів користувача, потрібні `deleteAccountService`
 * (`modules/account/service.ts`) ПЕРЕД видаленням `User`: після
 * каскадного видалення рядків `Certificate` (`onDelete: Cascade`,
 * `prisma/schema.prisma`) ці `public_id`-и вже ніде взяти, а без явного
 * `deleteCertificateImage` для кожного файли лишились би в Cloudinary
 * НАЗАВЖДИ (той самий ризик, що вже задокументований для
 * `uploadCertificateService`, IMG+.3.4 — тут просто інший тригер
 * видалення). Навмисно ЛИШЕ прямий запит до Prisma (без
 * бізнес-логіки) — цей файл не імпортує Cloudinary, той самий поділ
 * відповідальності, що й у решті `repository.ts` проєкту.
 */
export async function findUploadedImagePublicIdsForUser(userId: string): Promise<string[]> {
  const rows = await prisma.certificate.findMany({
    where: { userId, source: "UPLOADED", imagePublicId: { not: null } },
    select: { imagePublicId: true },
  });
  return rows
    .map((row: { imagePublicId: string | null }) => row.imagePublicId)
    .filter((id: string | null): id is string => id !== null);
}
