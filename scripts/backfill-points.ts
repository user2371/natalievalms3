/**
 * `scripts/backfill-points.ts` — Fixes/F.10 (points fix), крок 6.
 *
 * Одноразовий бекфіл: до F.10 бали НЕ нараховувались за (1) ручне
 * позначення уроку без квізу (`LessonCompleteButton`) і (2) синхронізацію
 * прогресу гостя, що пройшов квіз до логіну (`syncLocalProgressAction`).
 * Обидва шляхи вже могли встигнути записати `Progress.completed = true`
 * в БД ДО цього фіксу — цей скрипт донараховує бали за такі записи заднім
 * числом, не займаючи вже нараховане.
 *
 * Свідомо НЕ пише напряму в `PointsLedger` — викликає ті самі
 * ідемпотентні сервісні функції, що й основний код
 * (`awardLessonPoints`/`awardCoursePoints`/`issueCertificateIfNotExistsService`,
 * той самий принцип "findExistingAward перед створенням"), тож повторний
 * запуск скрипта абсолютно безпечний і нічого не задублює.
 *
 * Запуск: `npx tsx scripts/backfill-points.ts` (або `npm run backfill:points`)
 * ⚠️ ПЕРЕД запуском переконайтесь, що всі міграції застосовані до вашої БД —
 * `npx prisma migrate deploy` (продакшн) або `npx prisma migrate dev`
 * (розробка). Зокрема таблиця `Certificate` з'явилась лише в міграції
 * `20260802120000_certificates` (задача F.3) — без неї крок нарахування
 * балів за курс впаде на перевірці сертифіката (реальний кейс, F.10.7).
 */
import { prisma } from "../lib/prisma";
import { awardLessonPoints, awardCoursePoints } from "../modules/points/service";
import { issueCertificateIfNotExistsService } from "../modules/certificates/service";

async function main() {
  console.log("🔎 Шукаю завершені уроки без нарахованих балів...");

  const completedProgress = await prisma.progress.findMany({
    where: { completed: true },
    select: { userId: true, lessonId: true, lesson: { select: { courseId: true } } },
  });

  console.log(`Знайдено ${completedProgress.length} завершених записів Progress.`);

  let lessonAwards = 0;
  let lessonErrors = 0;
  for (const row of completedProgress) {
    try {
      const awarded = await awardLessonPoints(row.userId, row.lessonId);
      if (awarded) lessonAwards += 1;
    } catch (err) {
      lessonErrors += 1;
      console.error(
        `⚠️  Не вдалося нарахувати бал за урок ${row.lessonId} для userId=${row.userId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  console.log(`✅ Донараховано ${lessonAwards} нових балів за уроки (+1 кожен).`);
  if (lessonErrors > 0) {
    console.log(`⚠️  ${lessonErrors} записів уроків НЕ вдалося обробити (див. помилки вище).`);
  }

  // Унікальні пари (userId, courseId) серед завершених уроків — щоб
  // перевірити завершеність курсу й донарахувати +5 балів/сертифікат.
  const userCoursePairs = new Map<string, { userId: string; courseId: string }>();
  for (const row of completedProgress) {
    const key = `${row.userId}:${row.lesson.courseId}`;
    userCoursePairs.set(key, { userId: row.userId, courseId: row.lesson.courseId });
  }

  let courseAwards = 0;
  let certificatesIssued = 0;
  let courseErrors = 0;
  for (const { userId, courseId } of userCoursePairs.values()) {
    try {
      const [total, completedCount] = await Promise.all([
        prisma.lesson.count({ where: { courseId } }),
        prisma.progress.count({ where: { userId, completed: true, lesson: { courseId } } }),
      ]);

      if (total > 0 && completedCount >= total) {
        const awarded = await awardCoursePoints(userId, courseId);
        if (awarded) courseAwards += 1;

        // `issueCertificateIfNotExistsService` повертає `void` (сама
        // ідемпотентність — усередині, через `@@unique([userId, courseId])`),
        // тож рахуємо "спробу видачі" тут через окрему перевірку існування
        // ДО виклику, щоб лічильник у логах був чесним.
        const hadCertificateBefore = await prisma.certificate.findUnique({
          where: { userId_courseId: { userId, courseId } },
          select: { id: true },
        });
        await issueCertificateIfNotExistsService(userId, courseId);
        if (!hadCertificateBefore) certificatesIssued += 1;
      }
    } catch (err) {
      // Одна пара userId+courseId, що впала (наприклад, таблиця
      // `Certificate` ще не створена — міграція не застосована), більше
      // НЕ валить весь скрипт: бали за уроки (вище) вже безповоротно
      // нараховані, і решта пар courseId далі обробляються нормально.
      courseErrors += 1;
      console.error(
        `⚠️  Не вдалося обробити курс ${courseId} для userId=${userId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(`✅ Донараховано ${courseAwards} нових балів за курси (+5 кожен).`);
  console.log(`🎓 Видано ${certificatesIssued} нових сертифікатів.`);
  if (courseErrors > 0) {
    console.log(
      `⚠️  ${courseErrors} пар користувач+курс НЕ вдалося обробити (див. помилки вище) — виправте причину й перезапустіть скрипт, він ідемпотентний і безпечний для повторного запуску.`,
    );
  }
  console.log("Готово.");
}

main()
  .catch((err) => {
    console.error("❌ Помилка бекфілу:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
