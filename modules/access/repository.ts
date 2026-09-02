import { prisma } from "@/lib/prisma";

/**
 * `modules/access/repository.ts` — ФАЗА PAID+, задача PAID+.1. Лише
 * прямі запити до Prisma, без бізнес-логіки (той самий поділ, що вже
 * `modules/courses/repository.ts`).
 */

/**
 * Чи є в юзера завершена (`COMPLETED`) покупка цього курсу. Єдине
 * місце в проєкті, що читає `CoursePurchase` — до підключення
 * платіжного провайдера (ФАЗА PAID+.4) в цій таблиці ніколи не
 * з'являється жодного рядка, тому функція завжди повертає `false` для
 * будь-кого, крім `ADMIN` (перевірка ролі — рівнем вище, у
 * `service.ts::hasCourseAccess`), що і є задуманою поведінкою "платний
 * курс за замовчуванням недоступний".
 */
export async function hasCompletedPurchase(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const purchase = await prisma.coursePurchase.findFirst({
    where: { userId, courseId, status: "COMPLETED" },
    select: { id: true },
  });
  return purchase !== null;
}
