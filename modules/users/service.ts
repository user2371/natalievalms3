import { UpdateUserRoleInput, UpdateUserRoleSchema } from "./schema";
import * as repository from "./repository";

/**
 * ADMIN+.1 (09.08.2026, пряме прохання користувача). Обліковий запис,
 * з якого НІХТО (навіть інший адмін) не може зняти права адміністратора
 * через `/admin/users` — головний акаунт власниці платформи. Звірка йде
 * і проти локальної частини email (до "@"), і проти нікнейма (без "@"),
 * без урахування регістру — навмисно ширше за один конкретний email, щоб
 * захист не "мовчки" зламався від майбутньої зміни email/нікнейма цього
 * акаунту (F.2, зміна email вже реалізована для звичайних юзерів).
 */
const PROTECTED_ADMIN_HANDLE = "adminnatalieva";

function normalizeHandle(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^@/, "").toLowerCase();
}

function isProtectedAdminAccount(user: { email: string; nickname: string | null }): boolean {
  const emailLocalPart = user.email.split("@")[0];
  return (
    normalizeHandle(emailLocalPart) === PROTECTED_ADMIN_HANDLE ||
    normalizeHandle(user.nickname) === PROTECTED_ADMIN_HANDLE
  );
}

/** Хто виконує зміну ролі — приходить із сесії (`actions.ts`), потрібно для самозахисту й для аудиту (ADMIN+.1). */
export interface RoleChangeActor {
  userId: string;
  name: string;
  email: string;
  nickname: string | null;
}

function formatActorLabel(actor: RoleChangeActor): string {
  const name = actor.name.trim();
  if (name && actor.email) return `${name} (${actor.email})`;
  return name || actor.email || "Невідомий адміністратор";
}

export async function listUsersService() {
  return repository.findAllUsers();
}

export async function updateUserRoleService(input: UpdateUserRoleInput, actor: RoleChangeActor) {
  const parsed = UpdateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані користувача");
  }

  const existing = await repository.findUserById(parsed.data.userId);
  if (!existing) {
    throw new Error("Користувача не знайдено");
  }

  // ADMIN+.1: адмін не може змінити роль ВЛАСНОГО акаунта (ні понизити
  // себе, ні — хоч це й безглуздо — "підвищити" себе вдруге). Захищає від
  // випадкового самопозбавлення прав через єдину кнопку-перемикач в
  // `AdminUsersTable`.
  if (parsed.data.userId === actor.userId) {
    throw new Error("Не можна змінити роль власного облікового запису");
  }

  // ADMIN+.1: з захищеного акаунта не можна зняти ADMIN, хто б не намагався.
  if (parsed.data.role !== "ADMIN" && isProtectedAdminAccount(existing)) {
    throw new Error("З цього облікового запису не можна зняти права адміністратора");
  }

  return repository.updateUserRole(parsed.data.userId, parsed.data.role, formatActorLabel(actor));
}
