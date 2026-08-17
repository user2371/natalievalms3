"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  CreateQuestionInput,
  ReorderQuestionsInput,
  SubmitAnswerInput,
  UpdateQuestionInput,
} from "./schema";
import * as service from "./service";
import * as pointsService from "@/modules/points";
import { issueCertificateIfNotExistsService } from "@/modules/certificates";

/**
 * `modules/quizzes/actions.ts` (задачі 6.5/6.6/6.7) — Next.js server
 * actions, викликають лише `service.ts`.
 */

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Доступ заборонено: потрібна роль адміністратора");
  }
}

// --- 6.5: Admin CRUD питань/відповідей ---
// Той самий обов'язковий server-side `assertAdmin()`, що й у
// `modules/courses/actions.ts`/`modules/lessons/actions.ts` — принцип "не
// тільки в UI/middleware" з `CLAUDE.md`.

export async function createQuestionAction(input: CreateQuestionInput) {
  try {
    await assertAdmin();
    const question = await service.createQuestionService(input);
    revalidatePath("/admin/courses");
    return { success: true as const, question, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося створити питання";
    return { success: false as const, question: null, error: message };
  }
}

export async function updateQuestionAction(input: UpdateQuestionInput) {
  try {
    await assertAdmin();
    const question = await service.updateQuestionService(input);
    revalidatePath("/admin/courses");
    return { success: true as const, question, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося оновити питання";
    return { success: false as const, question: null, error: message };
  }
}

export async function deleteQuestionAction(id: string) {
  try {
    await assertAdmin();
    await service.deleteQuestionService(id);
    revalidatePath("/admin/courses");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося видалити питання";
    return { success: false as const, error: message };
  }
}

export async function reorderQuestionsAction(input: ReorderQuestionsInput) {
  try {
    await assertAdmin();
    const quiz = await service.reorderQuestionsService(input);
    revalidatePath("/admin/courses");
    return { success: true as const, quiz, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося змінити порядок питань";
    return { success: false as const, quiz: null, error: message };
  }
}

/**
 * Задача 6.6: перевірка ОДНІЄЇ відповіді (крок квізу). Доступна і гостю, і
 * залогіненому — сама перевірка не потребує сесії, це не мутація й не
 * персональні дані. Наразі клієнтський `QuizBlock.tsx` (перевикористаний
 * без змін, задача 6.10) уже вміє перевіряти відповідь локально з уже
 * завантажених `correct`-прапорців (той самий підхід, що й у демо-даних
 * `DEFAULT_QUIZ_QUESTIONS`) — ця дія існує як server-side джерело правди
 * "на майбутнє" (якщо колись приховувати `isCorrect` від клієнта до
 * відповіді, це вже готовий шлях), підключення до UI — за межами задач
 * 6.1–6.10.
 */
export async function submitQuizAnswerAction(input: SubmitAnswerInput) {
  try {
    const result = await service.checkAnswerService(input);
    return { success: true as const, ...result, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося перевірити відповідь";
    return {
      success: false as const,
      correct: false,
      correctAnswerIds: [],
      error: message,
    };
  }
}

/**
 * Задача 6.7: фінальний результат квізу — лише для ЗАЛОГІНЕНОГО
 * користувача (пише в `Progress`). Якщо сесії немає — повертає помилку;
 * гостьовий шлях збереження результату (`localStorage`) не проходить
 * через цю дію (задача 6.17, `useProgress`/`localProgress.ts`, Фаза 5).
 *
 * Задача 6.6.5: тригер нарахування балів. Виклик `awardLessonPoints`/
 * `awardCoursePoints` (`modules/points`) — публічний імпорт через
 * `modules/points/index.ts` (задача 6.6.7, з'явився пізніше за цей
 * тригер — спочатку тут був прямий імпорт з `./service`, перемкнуто
 * одразу, як індекс з'явився, за конвенцією з `CLAUDE.md`). Помилка
 * нарахування балів НЕ валить основний флоу збереження результату квізу
 * — бали тут другорядний побічний ефект, а не мета цієї дії.
 *
 * Фаза "Fixes" (02.08.2026, за прямим проханням користувача): той самий
 * тригер (`courseCheck.completed`) тепер ще й видає реальний сертифікат
 * (`issueCertificateIfNotExistsService`, `modules/certificates`) — усередині
 * того самого `try/catch`, що й бали, з тієї самої причини (другорядний
 * побічний ефект, не мета дії; ідемпотентно — `@@unique([userId, courseId])`
 * у схемі, повторний виклик нічого не зіпсує).
 *
 * Тригер перевірки досягнень (був тут для задачі 6.6.14) ПРИБРАНО —
 * модуль `modules/achievements` видалено з проєкту (рішення користувача:
 * на профілі лишаються тільки Сертифікати, без секції "Досягнення",
 * задача 6.6.15).
 */
export async function submitQuizResultAction(
  lessonId: string,
  score: number,
  total: number,
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб зберегти результат на сервері");
    }

    const progress = await service.submitQuizResultService(
      userId,
      lessonId,
      score,
      total,
    );

    try {
      await pointsService.awardLessonPoints(userId, lessonId);
      const courseCheck = await service.isCourseFullyCompletedForLessonService(
        userId,
        lessonId,
      );
      if (courseCheck.completed && courseCheck.courseId) {
        await pointsService.awardCoursePoints(userId, courseCheck.courseId);
        await issueCertificateIfNotExistsService(userId, courseCheck.courseId);
      }
    } catch (pointsErr) {
      console.error(
        "Не вдалося нарахувати бали/видати сертифікат за урок/курс:",
        pointsErr,
      );
    }

    return { success: true as const, progress, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося зберегти результат";
    return { success: false as const, progress: null, error: message };
  }
}
