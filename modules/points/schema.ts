import { z } from "zod";

/**
 * `modules/points/schema.ts` (задача 6.6.2). Той самий підхід, що й у
 * `modules/comments/schema.ts`: Zod-схема для валідації "причини"
 * нарахування + TS-інтерфейси, що дзеркалять `PointsLedger`
 * (Prisma-модель уже є в схемі, задача 6.6.1).
 */

export const PointsReasonSchema = z.enum(["LESSON_COMPLETED", "COURSE_COMPLETED"]);
export type PointsReason = z.infer<typeof PointsReasonSchema>;

/** Один запис журналу нарахувань (дзеркалить Prisma `PointsLedger`). */
export interface PointsLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  reason: PointsReason;
  lessonId: string | null;
  courseId: string | null;
  createdAt: Date;
}

/** Сумарні бали користувача (задача 6.6.6 — action отримання суми + місця в рейтингу). */
export interface PointsSummary {
  totalPoints: number;
}

/** Один рядок рейтингу — userId + сума балів (задача 6.6.3, `findRanked`). */
export interface RankedPointsEntry {
  userId: string;
  totalPoints: number;
}
