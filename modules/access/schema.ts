/**
 * `modules/access/schema.ts` — ФАЗА PAID+, задача PAID+.1 (02.09.2026,
 * за прямим проханням користувача). Мінімальні типи, потрібні
 * `hasCourseAccess`/`assertCourseAccess` (`service.ts`) — навмисно НЕ
 * повний тип `Course`/`User` з `modules/courses`/`modules/users`
 * (модулі не повинні залежати одне від одного напряму, той самий
 * принцип незалежності, що вже задокументований у
 * `modules/courses/schema.ts`), лише поля, які реально потрібні для
 * рішення "доступ / немає доступу".
 */

/** Мінімум даних про курс, потрібний для перевірки доступу. */
export interface AccessCourseInput {
  id: string;
  isPaid: boolean;
}

/** Мінімум даних про юзера, потрібний для перевірки доступу (`undefined` — гість, без сесії). */
export interface AccessUserInput {
  id: string;
  role?: string;
}
