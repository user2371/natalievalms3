/**
 * Точкове (не деструктивне для решти бази) видалення фейкових юзерів
 * лідерборду, яких створює `prisma/seed.ts` (цикл `for (const u of
 * fakeUsersData)`). На відміну від `prisma/seed.ts`, цей скрипт НЕ робить
 * `deleteMany()` по всій базі — він видаляє лише 10 конкретних юзерів,
 * яких однозначно можна впізнати за доменом email `@example.com`
 * (`${u.nickname.replace("@", "")}@example.com` — жоден реальний
 * зареєстрований юзер не матиме такого домену).
 *
 * `admin@natalieva.com` і `user@natalieva.com` свідомо НЕ чіпаються —
 * це реальні акаунти (адмін-логін і базовий тестовий юзер), які
 * лишаються за рішенням користувача.
 *
 * Усі зв'язані дані (коментарі, реакції, прогрес, enrollment, домашні
 * завдання, бали в pointsLedger) видаляться автоматично через
 * `onDelete: Cascade` в `prisma/schema.prisma` — видаляти їх окремо
 * не потрібно.
 *
 * Запуск: npx tsx scripts/cleanup-seed-users.ts
 * (обов'язково з тим самим DATABASE_URL, що вказує на продову базу —
 * перевірте це в .env/.env.production ПЕРЕД запуском).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const fakeUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@example.com" } },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (fakeUsers.length === 0) {
    console.log("Фейкових юзерів (@example.com) не знайдено — нічого видаляти.");
    return;
  }

  console.log(`Знайдено ${fakeUsers.length} фейкових юзерів для видалення:`);
  for (const u of fakeUsers) {
    console.log(`  - ${u.firstName} ${u.lastName} <${u.email}>`);
  }

  const result = await prisma.user.deleteMany({
    where: { email: { endsWith: "@example.com" } },
  });

  console.log(`✅ Видалено ${result.count} юзерів (і всі їхні пов'язані дані — каскадно).`);
}

main()
  .catch((e) => {
    console.error("❌ Помилка під час очищення:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
