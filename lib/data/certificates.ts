/**
 * Демо-дані сертифікатів, за мокапом `MyCertificates.png`.
 *
 * ⚠️ 02.08.2026, Фаза "Fixes": з появою реального `modules/certificates`
 * (`CertificateEntry`, автоматична видача при завершенні курсу) ЖОДНА
 * сторінка чи компонент більше НЕ імпортує `DEMO_CERTIFICATES` — усі 4
 * місця (`/certificates`, `/profile`, `/users/[id]`,
 * `/users/[id]/certificates`) переведені на реальні дані. Файл лишено
 * недоторканим (не видалено) — раптом знадобиться як довідковий приклад
 * форми даних чи для локальної розробки без БД; компоненти
 * (`CertificateCard`/`CertificateThumbnail`/`CertificatesPageContent`)
 * тепер типізовані від `CertificateEntry` (`@/modules/certificates`), не
 * від `Certificate` цього файлу — обидва інтерфейси структурно ідентичні.
 */

export interface Certificate {
  id: string;
  courseName: string;
  /** ISO-дата видачі. */
  issuedAt: string;
}

export const DEMO_CERTIFICATES: Certificate[] = [
  { id: "manikyur-z-nulya", courseName: "Манікюр з нуля", issuedAt: "2024-05-12" },
  { id: "aparatnyi-manikyur", courseName: "Апаратний манікюр", issuedAt: "2024-06-28" },
  {
    id: "pokryttya-gel-lakom",
    courseName: "Покриття гель-лаком",
    issuedAt: "2024-07-15",
  },
  { id: "dyzain-nigtiv", courseName: "Дизайн нігтів", issuedAt: "2024-09-03" },
  {
    id: "naroshuvannya-nigtiv",
    courseName: "Нарощування нігтів",
    issuedAt: "2024-10-20",
  },
];
