import { PrismaClient } from "@prisma/client";
import {
  Role,
  VideoProvider,
  QuestionType,
  ReactionType,
  PointsReason,
} from "../lib/enums";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

// Спільний тестовий пароль для всіх seed-юзерів (Фаза 2, задача 2.25/2.26).
// РЕАЛЬНІ bcrypt-хеші (раніше тут були рядки-заглушки на кшталт
// '$2b$10$e8YkYxH5G.p7b9...hashedpasswordadmin', з якими логін фізично не
// міг спрацювати через verifyPassword/bcrypt.compare) — задокументовано
// в CLAUDE.md разом з тестовими обліковими записами.
const SEED_PASSWORD = "password123";

async function main() {
  console.log("🌱 Starting database seed...");

  const [adminPasswordHash, userPasswordHash] = await Promise.all([
    hashPassword(SEED_PASSWORD),
    hashPassword(SEED_PASSWORD),
  ]);

  // Clear existing data in reverse order of dependencies
  await prisma.homeworkSubmission.deleteMany();
  await prisma.pointsLedger.deleteMany();
  await prisma.commentReaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.article.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing database records.");

  // 1. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@natalieva.com",
      passwordHash: adminPasswordHash,
      firstName: "Анастасія",
      lastName: "Наталієва",
      nickname: "@natalieva_master",
      // `avatarUrl: null` (F.28) — за прямим проханням користувача:
      // раніше тут стояло hardcoded Unsplash-фото "засновниці", через яке
      // на /profile та /my-learning показувалось воно замість нового
      // мінімалістичного дефолту з `components/ui/Avatar.tsx`. Тепер admin
      // (як і testUser нижче, і фейкові юзери лідерборду вище) без
      // власного фото — фолбек підставляється в UI.
      avatarUrl: null,
      about:
        "Засновниця онлайн-академії манікюру NATALIEVA. 5+ років досвіду, 1000+ випускниць.",
      role: Role.ADMIN,
      homeworkVisible: true,
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: "user@natalieva.com",
      passwordHash: userPasswordHash,
      firstName: "Олена",
      lastName: "Павлюк",
      nickname: "@elena_nails",
      // `avatarUrl: null` — той самий фікс, що й для adminUser вище.
      avatarUrl: null,
      about: 'Початківниця у світі манікюру. Проходжу курс "Гель-лак для новачків".',
      role: Role.USER,
      homeworkVisible: true,
    },
  });

  // Fake Users for Leaderboard
  const fakeUsersData = [
    {
      firstName: "Ольга",
      lastName: "Марченко",
      nickname: "@olga_nails_kyiv",
      points: 42,
    },
    {
      firstName: "Катерина",
      lastName: "Ковальчук",
      nickname: "@kate_nailart",
      points: 38,
    },
    { firstName: "Ірина", lastName: "Шевченко", nickname: "@ira_beauty", points: 35 },
    { firstName: "Анна", lastName: "Бойко", nickname: "@anna_manicure", points: 29 },
    {
      firstName: "Вікторія",
      lastName: "Ткаченко",
      nickname: "@viktoria_nails",
      points: 25,
    },
    { firstName: "Юлія", lastName: "Кравченко", nickname: "@yulia_polish", points: 22 },
    { firstName: "Марія", lastName: "Олійник", nickname: "@maria_studio", points: 19 },
    { firstName: "Тетяна", lastName: "Поліщук", nickname: "@tanya_nails_ua", points: 15 },
    {
      firstName: "Наталія",
      lastName: "Лисенко",
      nickname: "@natali_beauty_room",
      points: 12,
    },
    { firstName: "Софія", lastName: "Савченко", nickname: "@sonya_nail_lab", points: 8 },
  ];

  const fakeUsers = [];
  for (const u of fakeUsersData) {
    const createdUser = await prisma.user.create({
      data: {
        email: `${u.nickname.replace("@", "")}@example.com`,
        passwordHash: userPasswordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        nickname: u.nickname,
        // `avatarUrl: null` — без власного фото, тому в UI (`components/ui/Avatar.tsx`)
        // для них рендериться дефолтна аватарка `/defaultProfilePhoto.svg`.
        // Раніше тут стояло одне й те саме stock-фото з Unsplash для всіх
        // 10 фейкових юзерів лідерборду — саме тому на /leaderboard і в
        // коментарях замість нового мінімалістичного плейсхолдера було
        // видно чуже фото.
        avatarUrl: null,
        role: Role.USER,
      },
    });
    fakeUsers.push(createdUser);

    // Add points to PointsLedger
    await prisma.pointsLedger.create({
      data: {
        userId: createdUser.id,
        amount: u.points,
        reason: PointsReason.LESSON_COMPLETED,
      },
    });
  }

  console.log(`👤 Created ${2 + fakeUsers.length} users.`);

  // 2. Create Course
  const course = await prisma.course.create({
    data: {
      slug: "gel-lak-dlya-novachkiv",
      title: "Гель-лак для новачків",
      description:
        "Повний безкоштовний базовий відеокурс з манікюру та покриття гель-лаком від Анастасії Наталієвої. 14 практичних уроків.",
      coverImage: "/heroBlockWide.png",
      published: true,
      introVideoUrl: "https://www.youtube.com/watch?v=itF3EZOozUE",
      introDescription:
        "Трейлер та опис курсу: усе про матеріали, техніку безпеки, правильну підготовку нігтьової пластини та ідеальне покриття гель-лаком під кутикулу.",
      // Поля майстра (задача 3.11, доповнення 24.07.2026). Ім'я узгоджене з
      // двома вже наявними в проєкті джерелами: короткою формою "Наталія"
      // (статичний фолбек у `components/landing/MasterSection.tsx`) і
      // повним "Анастасії Наталієвої" з `description` курсу вище (родовий
      // відмінок) — нових фактів не вигадувалось.
      masterName: "Наталія Наталієва",
      masterBio:
        "Майстер манікюру з понад 5-річним досвідом у індустрії краси. Створила цей курс, щоб зробити якісну освіту доступною для кожної — з акцентом на практичні навички, які знадобляться з перших робіт.",
      masterAvatarUrl: null,
    },
  });

  console.log(`📚 Created course: ${course.title}`);

  // 3. Create Lessons
  const lessonsData = [
    {
      order: 1,
      title: "Знайомство. Список відтворення для новачка",
      duration: "12 хв",
      videoUrl: "https://www.youtube.com/watch?v=gQsqH8k-V-Q",
    },
    {
      order: 2,
      title: "Історія виникнення гель-лаку. Історія манікюру",
      duration: "15 хв",
      videoUrl: "https://www.youtube.com/watch?v=BJxa3RQPgrA",
    },
    {
      order: 3,
      title: "Будова нігтьової пластини. Що таке гіпоніхій? Матрикс. Лунула",
      duration: "18 хв",
      videoUrl: "https://www.youtube.com/watch?v=CH_QJ5m571M",
    },
    {
      order: 4,
      title: "Хвороби нігтьової пластини. Оніхолізис. Оніхомікоз. Зелена бактерія",
      duration: "22 хв",
      videoUrl: "https://www.youtube.com/watch?v=8DQcVUqXnDo",
    },
    {
      order: 5,
      title: "Інструменти. Дезінфекція. Стерилізація",
      duration: "20 хв",
      videoUrl: "https://www.youtube.com/watch?v=EGEVlIHCClY",
    },
    {
      order: 6,
      title: "Матеріали для манікюру mini та maxi",
      duration: "16 хв",
      videoUrl: "https://www.youtube.com/watch?v=_vz6s78eJbs",
    },
    {
      order: 7,
      title: "Види зняття гель-лаку",
      duration: "14 хв",
      videoUrl: "https://www.youtube.com/watch?v=d6eykcNJ4Qo",
    },
    {
      order: 8,
      title: "Опил нігтів",
      duration: "19 хв",
      videoUrl: "https://www.youtube.com/watch?v=Hc0B8bpBxo0",
    },
    {
      order: 9,
      title: "Манікюр для новачка. Класичний манікюр. Обрізний манікюр",
      duration: "25 хв",
      videoUrl: "https://www.youtube.com/watch?v=UotYcQQ0KzI",
    },
    {
      order: 10,
      title: "Комбінований манікюр",
      duration: "28 хв",
      videoUrl: "https://www.youtube.com/watch?v=wIEv7QTt8g4",
    },
    {
      order: 11,
      title: "Манікюр з ремувером",
      duration: "17 хв",
      videoUrl: "https://www.youtube.com/watch?v=aMWxpyPFVqs",
    },
    {
      order: 12,
      title: "Етапи покриття нігтів гель-лаком",
      duration: "30 хв",
      videoUrl: "https://www.youtube.com/watch?v=mSFZU2TWkD4",
    },
    {
      order: 13,
      title: "Легкий дизайн нігтів",
      duration: "21 хв",
      videoUrl: "https://www.youtube.com/watch?v=WRsNIlLus68",
    },
    {
      order: 14,
      title: "Френч. Манікюр для новачка",
      duration: "24 хв",
      videoUrl: "https://www.youtube.com/watch?v=2nF0Fj1kQqI",
    },
  ];

  const createdLessons = [];
  for (const l of lessonsData) {
    const lesson = await prisma.lesson.create({
      data: {
        courseId: course.id,
        order: l.order,
        title: l.title,
        duration: l.duration,
        videoProvider: VideoProvider.YOUTUBE,
        videoUrl: l.videoUrl,
      },
    });
    createdLessons.push(lesson);
  }

  console.log(`🎬 Created ${createdLessons.length} lessons.`);

  // 4. Create Articles for Lesson 1 and Lesson 2
  await prisma.article.create({
    data: {
      lessonId: createdLessons[0].id,
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Конспект уроку: Знайомство з курсом" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Вітаємо на першому уроці курсу! У цьому відео ми розберемо базові поняття та підготуємо робоче місце до навчання.",
              },
            ],
          },
        ],
      }),
    },
  });

  await prisma.article.create({
    data: {
      lessonId: createdLessons[1].id,
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Конспект: Історія манікюру та гель-лаку" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Манікюр має багатовікову історію, яка починається ще з Стародавнього Єгипту та Китаю...",
              },
            ],
          },
        ],
      }),
    },
  });

  console.log("📝 Created sample articles.");

  // 5. Create Quizzes for Lesson 1 and Lesson 2
  const quiz1 = await prisma.quiz.create({
    data: {
      lessonId: createdLessons[0].id,
    },
  });

  const q1 = await prisma.question.create({
    data: {
      quizId: quiz1.id,
      order: 1,
      type: QuestionType.TEXT,
      text: "Який головний принцип безпечної роботи майстра манікюру?",
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        questionId: q1.id,
        order: 1,
        text: "Використання дезінфекції та стерилізації",
        isCorrect: true,
      },
      {
        questionId: q1.id,
        order: 2,
        text: "Швидкість виконання роботи",
        isCorrect: false,
      },
      {
        questionId: q1.id,
        order: 3,
        text: "Використання будь-якого пилозбірника",
        isCorrect: false,
      },
    ],
  });

  const quiz2 = await prisma.quiz.create({
    data: {
      lessonId: createdLessons[1].id,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      quizId: quiz2.id,
      order: 1,
      type: QuestionType.TEXT,
      text: "В якому році з’явилося перше світлозатверджуване покриття (гель-лак)?",
    },
  });

  await prisma.answer.createMany({
    data: [
      { questionId: q2.id, order: 1, text: "На початку 2000-х років", isCorrect: true },
      { questionId: q2.id, order: 2, text: "У 1950 році", isCorrect: false },
      { questionId: q2.id, order: 3, text: "У 1920 році", isCorrect: false },
    ],
  });

  console.log("❓ Created sample quizzes.");

  // 6. Create Comments and Reactions
  const comment1 = await prisma.comment.create({
    data: {
      lessonId: createdLessons[0].id,
      userId: testUser.id,
      content: "Чудовий вступний урок! Усе зрозуміло пояснено, дякую!",
    },
  });

  await prisma.commentReaction.create({
    data: {
      commentId: comment1.id,
      userId: adminUser.id,
      type: ReactionType.LIKE,
    },
  });

  console.log("💬 Created sample comments.");

  // 7. Create Homework Submissions
  await prisma.homeworkSubmission.create({
    data: {
      userId: testUser.id,
      lessonId: createdLessons[0].id,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
  });

  console.log("📹 Created sample homework submission.");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
