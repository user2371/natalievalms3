import { z } from "zod";

/**
 * `modules/homework/schema.ts` — новий модуль, що закриває прогалину,
 * знайдену під час трасування 9.15 (`TASKS_DETAILED.md`/
 * `IMPLEMENTATION_STATUS.md`, сесія 01.08.2026): реальна здача відео ДЗ не
 * була підключена до Prisma — Prisma-модель `HomeworkSubmission` уже
 * існувала в схемі (готувалась заздалегідь), але шару
 * repository/service/actions не було. Той самий поділ на
 * schema/repository/service/actions/index, що й у `modules/comments`.
 *
 * Валідація посилання — той самий підхід, що вже в
 * `HomeworkBlock.tsx`/`lib/youtube.ts` (легасі-версія на
 * `/lessons/[slug]`): просто непорожній URL тут, а РЕАЛЬНА перевірка "це
 * YouTube-посилання" (`isYoutubeUrl`) — у `service.ts`, щоб повідомлення
 * про помилку було змістовним ("не схоже на YouTube", а не просто
 * "невалідний URL").
 *
 * ⚠️ Свідомо БЕЗ "синхронізації localStorage при логіні" (на відміну від
 * `modules/progress`/`syncLocalProgressAction`, задача 7.6): здача ДЗ і в
 * легасі `HomeworkBlock.tsx` вже вимагала логіну (форма ховається за
 * `GuestHomeworkBanner`), тож `localStorage` там був лише кешем ДО появи
 * цього модуля, не сховищем даних гостя. До того ж технічно неможливо
 * коректно змапити легасі `lessonSlug` (`lib/data/lessons.ts`, статичний
 * демо-курс) на реальний Prisma `lessonId` — у моделі `Lesson` взагалі
 * немає поля `slug` (той самий "два непов'язані датасети курсів",
 * задокументований раніше). Реальний потік (`RealHomeworkBlock`) пише
 * напряму в БД через `submitHomeworkAction`, без проміжного localStorage.
 */

export const SubmitHomeworkSchema = z.object({
  lessonId: z.string().min(1, "Не вказано ID уроку"),
  videoUrl: z
    .string()
    .trim()
    .min(1, "Встав посилання на відео ДЗ зі свого YouTube-каналу"),
});

export type SubmitHomeworkInput = z.infer<typeof SubmitHomeworkSchema>;

/** Форма здачі ДЗ, яку повертає `repository`/`service` (дзеркалить модель Prisma `HomeworkSubmission`). */
export interface HomeworkSubmission {
  id: string;
  lessonId: string;
  userId: string;
  videoUrl: string;
  createdAt: Date;
}
