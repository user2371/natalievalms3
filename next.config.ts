import type { NextConfig } from "next";

// Дозволені зовнішні хости для `next/image` (обов'язково для Next.js —
// без явного дозволу зображення з чужих доменів блокуються за
// замовчуванням). `images.unsplash.com` — аватарки фейкових юзерів у
// `prisma/seed.ts`; `img.youtube.com` — мініатюри уроків
// (`youtubeThumbnail()` у `lib/data/lessons.ts`, а також
// `RealLessonCard.tsx` для реальних уроків з БД); `res.cloudinary.com` —
// реальні аватарки, завантажені через `lib/storage/avatarStorage.ts`
// (Фаза 3+, задача 3+.1.1a, 05.08.2026).
const nextConfig: NextConfig = {
  // Задача IMG+.0.4 (ФАЗА IMG+, 08.08.2026). Дефолтний ліміт розміру
  // тіла запиту для Server Actions у Next.js — 1MB, замалий для
  // завантаження фото (аватарка — до 5MB, сертифікат — до 10MB,
  // `modules/account/schema.ts`/майбутній `modules/certificates/schema.ts`).
  // "12mb" — трохи вище за найбільший наявний у плані ліміт (10MB), щоб
  // врахувати накладні витрати `multipart/form-data`, а не рівно 10MB.
  // Це ПЕРШИЙ, найдешевший рубіж захисту (IMG+.5.1) — апріорі величезний
  // запит (напр. тестовий кейс "файл ~100MB", чекліст IMG+.6) Next.js
  // відхиляє сам, ще ДО того, як код застосунку прочитає файл у пам'ять
  // чи взагалі викличе `processUploadedImage` (IMG+.1.1, другий рубіж).
  // Ключ підтверджено чинним для встановленої версії `next@15.5.20`
  // (Next.js 15 — усе ще під `experimental`, попри те що сама фіча
  // Server Actions стабільна); за потреби звірити з офіційною
  // документацією Next.js при оновленні версії.
  //
  // Багфікс IMG+.2.6 (08.08.2026): цей рубіж лишається основним
  // захистом від апріорі величезних запитів в обхід UI, але для
  // звичайного користувача через звичайну форму він більше НЕ перша
  // лінія — `lib/images/validateFileBeforeUpload.ts` ловить завеликий/
  // недозволений файл на клієнті ще ДО формування запиту, тож штатний
  // сценарій ніколи не впирається впритул у це число (раніше файл лише
  // трохи більший за реальний ліміт застосунку міг випадково
  // потрапити в проміжок між "занадто великий для сервісу" і "ще не
  // перевищує 12MB тіла запиту" й повертав сиру помилку фреймворку
  // замість українського тексту).
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Задача 9.18 (очищення dev-логів перед релізом): ручна перевірка
  // (`grep -rn "console\.\(log\|debug\|info\)"` по `app/`/`components/`/
  // `modules/`/`lib/`) не знайшла жодного — код і так чистий. Це системний
  // запобіжник на МАЙБУТНЄ: `console.log`/`debug`/`info` автоматично
  // вирізаються з production-збірки (`npm run build`), навіть якщо хтось
  // забуде прибрати їх вручну перед релізом. `error`/`warn` — виключення,
  // це легітимний production error-репортинг (напр.
  // `modules/quizzes/actions.ts`), не дебаг-сміття.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

export default nextConfig;
