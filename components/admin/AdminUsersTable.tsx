"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SearchIcon, ShieldIcon } from "@/components/ui/icons";
import { updateUserRoleAction, type UserItem } from "@/modules/users";

const PAGE_SIZE = 10;

type SortOption = "date_desc" | "date_asc" | "alpha_asc" | "alpha_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date_desc", label: "Дата реєстрації (спочатку нові)" },
  { value: "date_asc", label: "Дата реєстрації (спочатку старі)" },
  { value: "alpha_asc", label: "За алфавітом (А → Я)" },
  { value: "alpha_desc", label: "За алфавітом (Я → А)" },
];

const DATETIME_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * ADMIN+.1 (09.08.2026). Дзеркало захисту з `modules/users/service.ts`
 * (`isProtectedAdminAccount`) — навмисно продубльовано тут, а не
 * імпортовано напряму, бо `service.ts` тягне за собою `repository.ts` →
 * `lib/prisma` (не для клієнтського бандла). Це ЛИШЕ для UI (задизейблена
 * кнопка й пояснювальний тултип) — реальний захист від зняття прав уже
 * стоїть на сервері (`updateUserRoleService`), навіть якщо цю клієнтську
 * перевірку хтось обійде.
 */
const PROTECTED_ADMIN_HANDLE = "adminnatalieva";

function normalizeHandle(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^@/, "").toLowerCase();
}

function isProtectedAdminAccount(user: UserItem): boolean {
  const emailLocalPart = user.email.split("@")[0];
  return (
    normalizeHandle(emailLocalPart) === PROTECTED_ADMIN_HANDLE ||
    normalizeHandle(user.nickname) === PROTECTED_ADMIN_HANDLE
  );
}

/**
 * `components/admin/AdminUsersTable.tsx` (задачі 8.6.1, 8.6.2, F.21) —
 * клієнтський "острівець" для перегляду користувачів з можливістю зміни
 * ролі (USER ⇄ ADMIN) за допомогою `updateUserRoleAction`.
 *
 * **F.21** — текстовий пошук (ім'я/прізвище/нікнейм/email), сортування
 * (за датою реєстрації або за алфавітом) і лічильник загальної кількості
 * користувачів. Усі `users` вже приходять із сервера одним масивом
 * (`listUsersService`), тому пошук/сортування/пагінація — суто клієнтські
 * похідні (`useMemo`) від `initialUsers`, без нових запитів до БД.
 *
 * **ADMIN+.1 (09.08.2026, пряме прохання користувача):**
 * 1. Адмін не може змінити роль ВЛАСНОГО акаунта — кнопка задизейблена
 *    (`isSelf`, звірка з `useSession().user.id`), тултип пояснює чому.
 *    Реальна заборона — на сервері (`updateUserRoleService`), тут лише
 *    UX (не показувати кнопку, яка все одно поверне помилку).
 * 2. З акаунта `adminnatalieva` ніхто не може зняти права адміністратора
 *    (`isProtectedAdminAccount`) — кнопка "Зробити студентом" для нього
 *    задизейблена з іншим тултипом. Так само лише UX-дзеркало серверної
 *    перевірки.
 * 3. Новий стовпець "Останню зміну виконав(ла)" — `roleChangedByLabel` +
 *    `roleChangedAt` з `UserItem` (записується в `repository.
 *    updateUserRole` при кожній зміні ролі), "—" якщо роль ще ніколи не
 *    змінювали вручну.
 */
export function AdminUsersTable({ users: initialUsers }: { users: UserItem[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function formatUserName(user: UserItem) {
    const { firstName, lastName, nickname } = user;
    if (nickname) return `${firstName} ${lastName ?? ""} (@${nickname})`.trim();
    return [firstName, lastName].filter(Boolean).join(" ");
  }

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? users.filter((user) => {
          const haystack = [user.firstName, user.lastName, user.nickname, user.email]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : users;

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      const nameA = formatUserName(a).toLowerCase();
      const nameB = formatUserName(b).toLowerCase();
      return sortBy === "alpha_asc"
        ? nameA.localeCompare(nameB, "uk")
        : nameB.localeCompare(nameA, "uk");
    });

    return sorted;
  }, [users, query, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const visible = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleSortChange(value: SortOption) {
    setSortBy(value);
    setPage(1);
  }

  async function handleToggleRole(user: UserItem) {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    setUpdatingId(user.id);
    setError(null);

    const result = await updateUserRoleAction({
      userId: user.id,
      role: newRole,
    });

    setUpdatingId(null);

    if (result.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );
      router.refresh();
    } else {
      setError(result.error ?? "Не вдалося змінити роль користувача");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-xs sm:w-64">
            <Input
              icon={<SearchIcon size={16} />}
              placeholder="Пошук за іменем, нікнеймом або email"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              aria-label="Пошук користувачів"
            />
          </div>
          <div className="w-full max-w-xs sm:w-64">
            <Select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              options={SORT_OPTIONS}
              aria-label="Сортування користувачів"
            />
          </div>
        </div>

        <div className="text-sm text-muted">
          {query.trim() ? (
            <>
              Знайдено: <span className="font-medium text-ink">{filteredUsers.length}</span> з{" "}
              {users.length}
            </>
          ) : (
            <>
              Всього користувачів: <span className="font-medium text-ink">{users.length}</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-line/60 px-6 py-14 text-center text-sm text-muted">
          {query.trim() ? "За таким запитом нікого не знайдено." : "Користувачів поки немає."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-rose-line/40 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-rose-line/30 text-xs tracking-wide text-muted uppercase">
                <th className="px-5 py-3 font-medium">Ім&apos;я</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Дата реєстрації</th>
                <th className="px-5 py-3 font-medium">Роль</th>
                <th className="px-5 py-3 font-medium">Останню зміну виконав(ла)</th>
                <th className="px-5 py-3 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => {
                const isSelf = user.id === currentUserId;
                const isProtected = user.role === "ADMIN" && isProtectedAdminAccount(user);
                const disabledReason = isSelf
                  ? "Не можна змінити роль власного облікового запису"
                  : isProtected
                    ? "З цього облікового запису не можна зняти права адміністратора"
                    : null;

                return (
                  <tr key={user.id} className="border-b border-rose-line/20 last:border-0">
                    <td className="px-5 py-4 font-medium text-ink">
                      <span className="inline-flex items-center gap-1.5">
                        {formatUserName(user)}
                        {isProtected && (
                          <ShieldIcon
                            size={13}
                            className="shrink-0 text-accent-dark"
                            aria-label="Захищений обліковий запис"
                          />
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">{user.email}</td>
                    <td className="px-5 py-4 text-muted">
                      {new Date(user.createdAt).toLocaleDateString("uk-UA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={user.role === "ADMIN" ? "solid" : "outline"}>
                        {user.role === "ADMIN" ? "Адміністратор" : "Студент"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {user.roleChangedByLabel && user.roleChangedAt ? (
                        <>
                          <span className="block text-ink">{user.roleChangedByLabel}</span>
                          <span className="text-xs">
                            {DATETIME_FORMATTER.format(new Date(user.roleChangedAt))}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={updatingId === user.id || !!disabledReason}
                        loading={updatingId === user.id}
                        onClick={() => handleToggleRole(user)}
                        title={disabledReason ?? undefined}
                      >
                        {user.role === "ADMIN" ? "Зробити студентом" : "Зробити адміном"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredUsers.length > PAGE_SIZE && (
        <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />
      )}
    </div>
  );
}
