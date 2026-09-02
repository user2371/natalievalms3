import * as repository from "./repository";
import type { AccessCourseInput, AccessUserInput } from "./schema";

/**
 * `modules/access/service.ts` — ФАЗА PAID+, задача PAID+.1.1 (02.09.2026,
 * за прямим проханням користувача). Єдине місце в проєкті, що відповідає
 * на питання "чи має цей юзер доступ до контенту цього курсу" — сторінки
 * курсу/уроку (задача PAID+.3) і server actions прогресу/ДЗ/квізу
 * викликають ЛИШЕ це, а не перевіряють `course.isPaid` кожна по-своєму.
 *
 * Правила (у порядку перевірки):
 * 1. `course.isPaid === false` — доступ ЗАВЖДИ є, включно з гостем без
 *    сесії. Точнісінько та сама поведінка, що й зараз, до цієї фази —
 *    безкоштовні курси цією зміною НЕ зачіпаються.
 * 2. Роль `ADMIN` — доступ ЗАВЖДИ є, навіть до платного курсу без
 *    покупки (потрібно для перегляду/редагування контенту в адмінці й
 *    попереднього перегляду публічної сторінки курсу).
 * 3. Інакше — доступ лише якщо є `COMPLETED`-запис `CoursePurchase`
 *    (`repository.hasCompletedPurchase`). Гість (`user` — `undefined`)
 *    доступу до платного курсу НЕМАЄ НІКОЛИ — покупку неможливо
 *    прив'язати без `userId`, тому платний курс, на відміну від
 *    безкоштовного, вимагає авторизації.
 *
 * До підключення платіжного провайдера (ФАЗА PAID+.4) крок 3 завжди
 * повертає `false` для будь-кого не-ADMIN (у `CoursePurchase` ще
 * ніколи не з'являється жодного рядка) — це і є задумана поведінка
 * "платний курс за замовчуванням недоступний" з прямого прохання
 * користувача.
 */
export async function hasCourseAccessService(
  course: AccessCourseInput,
  user: AccessUserInput | undefined,
): Promise<boolean> {
  if (!course.isPaid) {
    return true;
  }

  if (user?.role === "ADMIN") {
    return true;
  }

  if (!user) {
    return false;
  }

  return repository.hasCompletedPurchase(user.id, course.id);
}

/**
 * Серверна версія для server actions (прогрес/ДЗ/квіз/коментарі
 * конкретного уроку) — той самий принцип подвійної перевірки, що вже
 * `assertAdmin` у `modules/courses/actions.ts`: сторінка вже показує
 * `PaywallNotice` замість контенту (задача PAID+.3), але сам server
 * action теж не повинен довіряти тому, що клієнт не намагається
 * викликати його напряму для уроку платного курсу без доступу.
 */
export async function assertCourseAccessService(
  course: AccessCourseInput,
  user: AccessUserInput | undefined,
): Promise<void> {
  const allowed = await hasCourseAccessService(course, user);
  if (!allowed) {
    throw new Error("Доступ заборонено: курс платний");
  }
}
