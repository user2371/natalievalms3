import {
  UpsertProgressEntry,
  UpsertProgressInput,
  UpsertProgressInputSchema,
} from "./schema";
import type { Progress } from "./schema";
import * as repository from "./repository";
import type { UpsertProgressData } from "./repository";
import * as pointsService from "@/modules/points";
import { issueCertificateIfNotExistsService } from "@/modules/certificates";

/**
 * `modules/progress/service.ts` (задача 7.3) — логіка мержу: для кожного
 * `lessonId` з `localStorage` порівняти з БД, взяти "кращий" результат.
 */

/**
 * Правило мержу одного уроку (задача 7.3): `completed=true` ЗАВЖДИ
 * перекриває `false` (незалежно від того, з БД воно чи з `localStorage`).
 * Для quizScore/quizTotal — беремо ПАРУ (бал+максимум) від того боку, де
 * бал ВИЩИЙ (`null` рахуємо як "гірше за будь-який реальний бал", а не
 * "0", щоб не программати учня, який ще не проходив квіз на одному з
 * пристроїв). `completedAt`: якщо в БД уже було збережено — лишаємо
 * оригінальну дату (вона достовірніша); якщо факт завершення прийшов
 * ЛИШЕ з `localStorage` — беремо `entry.updatedAt` як наближену дату
 * завершення (краще за "зараз", яке підмінило б реальний момент
 * проходження датою сесії логіну).
 *
 * Експортована окремо (не inline) — щоб можна було реально протестувати
 * саму формулу мержу без БД (задачі 7.13/7.14).
 */
export function mergeProgress(
  userId: string,
  current: Progress | undefined,
  entry: UpsertProgressEntry,
): UpsertProgressData {
  const completed = Boolean(current?.completed) || entry.completed;

  const currentScore = current?.quizScore ?? null;
  const currentTotal = current?.quizTotal ?? null;
  const currentScoreForCompare = currentScore ?? -1;
  const entryScoreForCompare = entry.quizScore ?? -1;
  const useEntryScore = entryScoreForCompare > currentScoreForCompare;

  const quizScore = useEntryScore ? (entry.quizScore ?? null) : currentScore;
  const quizTotal = useEntryScore ? (entry.quizTotal ?? null) : currentTotal;

  const completedAt = completed
    ? (current?.completedAt ?? new Date(entry.updatedAt))
    : null;

  return {
    userId,
    lessonId: entry.lessonId,
    completed,
    quizScore,
    quizTotal,
    completedAt,
  };
}

/**
 * Задача 7.9/7.10: гарантує `Enrollment` для КОЖНОГО унікального
 * `courseId` серед entries — той самий виклик закриває і автостворення
 * запису на курс (7.10), і "конфлікт enrollments" (7.9, немає конфлікту
 * фізично — `ensureEnrollment` ідемпотентний завдяки `@@unique`).
 *
 * Fixes/F.10 (points fix): це ЄДИНЕ місце, де `Progress.completed`
 * записується поза `submitQuizResultAction` (`modules/quizzes/actions.ts`)
 * — двома шляхами, обидва раніше НЕ нараховували бали взагалі:
 *  1) ручне позначення уроку БЕЗ квізу (`LessonCompleteButton`, тепер
 *     видимий лише для таких уроків — `app/courses/[slug]/lessons/[lessonId]/page.tsx`);
 *  2) гість пройшов квіз (`RealQuizBlock`, `useProgress`/`localProgress.ts`),
 *     результат осів лише в `localStorage`, і потрапляє в `Progress` щойно
 *     гість логіниться і викликається ця синхронізація.
 * Для ОБОХ випадків нижче нараховується +1 бал за урок (лише при
 * переході `completed: false/відсутньо → true`, щоб не задвоїти бал при
 * повторному sync уже завершеного уроку) і, якщо це закриває весь курс,
 * +5 балів за курс та видача сертифіката — той самий побічний ефект і той
 * самий принцип "не валить основний флоу", що й у `submitQuizResultAction`
 * (окремий try/catch навколо балів).
 *
 * ⚠️ Свідомо НЕ додано перевірку "чи лишав користувач НАПРЯМУ квіз-урок
 * заповненим без реального проходження квізу" — увесь sync і так уже
 * повністю довіряє клієнтському payload (`quizScore`/`completed` з
 * `localStorage`), той самий рівень довіри, що існував у проєкті й до
 * цього фіксу (не нова діра, а вже наявна межа архітектури — повне
 * server-side підтвердження квізу вимагало б окремого, значно більшого
 * рефакторингу й тут навмисно не робилось).
 */
export async function syncLocalProgressService(
  userId: string,
  input: UpsertProgressInput,
): Promise<Progress[]> {
  const parsed = UpsertProgressInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані прогресу");
  }

  const rawEntries = parsed.data.entries;
  const courseIds = [...new Set(rawEntries.map((entry) => entry.courseId))];
  await Promise.all(
    courseIds.map((courseId) => repository.ensureEnrollment(userId, courseId)),
  );

  // Fixes/F.10 (points fix): для уроків, що МАЮТЬ квіз, `completed: true`
  // без жодного `quizTotal` у entry — санітизуємо до `completed: false`
  // (не довіряємо голому прапорцю без ознак реального проходження квізу).
  // Легітимний шлях (гість пройшов квіз → залогінився) завжди несе
  // `quizScore`/`quizTotal` (`markQuizResult`, `localProgress.ts`), тож цю
  // перевірку не зачіпає.
  const lessonIdsWithQuiz = await repository.findLessonIdsWithQuiz(
    rawEntries.map((entry) => entry.lessonId),
  );
  const entries = rawEntries.map((entry) => {
    const hasQuiz = lessonIdsWithQuiz.has(entry.lessonId);
    const hasQuizEvidence = typeof entry.quizTotal === "number" && entry.quizTotal > 0;
    if (hasQuiz && entry.completed && !hasQuizEvidence) {
      return { ...entry, completed: false, quizScore: null, quizTotal: null };
    }
    return entry;
  });

  const existing = await repository.findByUserId(userId);
  const existingByLessonId = new Map(existing.map((row) => [row.lessonId, row]));

  const results: Progress[] = [];
  for (const entry of entries) {
    const current = existingByLessonId.get(entry.lessonId);
    const wasCompleted = current?.completed ?? false;
    const merged = mergeProgress(userId, current, entry);
    const saved = await repository.upsert(merged);
    results.push(saved);

    if (!wasCompleted && saved.completed) {
      try {
        await pointsService.awardLessonPoints(userId, saved.lessonId);
        const { total, completed } = await repository.getCourseCompletionCounts(
          userId,
          entry.courseId,
        );
        if (total > 0 && completed >= total) {
          await pointsService.awardCoursePoints(userId, entry.courseId);
          await issueCertificateIfNotExistsService(userId, entry.courseId);
        }
      } catch (pointsErr) {
        console.error(
          "Не вдалося нарахувати бали/видати сертифікат за урок/курс (sync):",
          pointsErr,
        );
      }
    }
  }

  return results;
}

/**
 * Fixes/F.11: read-шлях, якого не вистачало відколи Фаза 7 закрилась як
 * "завершена" (`findByUserAndCourse` у `repository.ts` існувала вже тоді,
 * але жоден сервіс/дія її не викликали) — реальний прогрес курсу
 * ЗАЛОГІНЕНОГО користувача з БД, у ТІЙ САМІЙ формі (`CourseProgressMap`,
 * `lessonId → { completed, quizScore, quizTotal, updatedAt }`), що вже
 * повертає `getLocalProgress` (`lib/progress/localProgress.ts`) — щоб
 * `useProgress(courseId)` (клієнт) міг підставити один результат замість
 * іншого без жодної додаткової адаптації формату на боці компонентів.
 * `updatedAt` для рядків з БД береться з `completedAt` (якщо є) або
 * `id`-незалежного "з початку часу" — поле в БД лише інформаційне для
 * порівняння з локальним прогресом при мержі на клієнті, не бізнес-критичне.
 */
export async function getCourseProgressMapService(
  userId: string,
  courseId: string,
): Promise<Record<string, { completed: boolean; quizScore: number | null; quizTotal: number | null; updatedAt: string }>> {
  const rows = await repository.findByUserAndCourse(userId, courseId);

  const map: Record<
    string,
    { completed: boolean; quizScore: number | null; quizTotal: number | null; updatedAt: string }
  > = {};
  for (const row of rows) {
    map[row.lessonId] = {
      completed: row.completed,
      quizScore: row.quizScore,
      quizTotal: row.quizTotal,
      updatedAt: (row.completedAt ?? new Date(0)).toISOString(),
    };
  }
  return map;
}
