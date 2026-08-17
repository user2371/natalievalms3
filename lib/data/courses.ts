import { LESSONS } from "@/lib/data/lessons";

export type CourseCategory = "novachky" | "dyzain" | "materialy" | "prosunutyy";

export interface CourseFilter {
  value: CourseCategory | "all";
  label: string;
}

export const COURSE_FILTERS: CourseFilter[] = [
  { value: "all", label: "Усі курси" },
  { value: "novachky", label: "Для новачків" },
  { value: "dyzain", label: "Дизайн нігтів" },
  { value: "materialy", label: "Матеріали й інструменти" },
  { value: "prosunutyy", label: "Просунутий рівень" },
];

export type CourseLevel = "Новачок" | "Середній" | "Просунутий";

export interface Course {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  category: CourseCategory;
  level: CourseLevel;
  free: boolean;
  lessonsCount: number;
  studentsCount: number;
  /** Якщо `false` — курс ще не запущено, картка показується, але не клікабельна. */
  available: boolean;
}

/**
 * Каталог курсів (`/courses`). Наразі реально існує лише перший курс —
 * "Гель-лак для новачків" (веде на вже готовий `/lessons`, `lessonsCount`
 * рахується динамічно з `LESSONS.length`). Решта — макетні картки
 * "Незабаром" для демонстрації каталогу; наповняться реальним контентом і
 * `modules/courses` (Prisma) у Фазі 3+.
 */
export const COURSES: Course[] = [
  {
    slug: "gel-lak-dlya-novachkiv",
    title: "Гель-лак для новачків",
    description:
      "Базовий курс: будова нігтя, інструменти, покриття гель-лаком з нуля до впевненого результату.",
    coverImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80",
    category: "novachky",
    level: "Новачок",
    free: true,
    lessonsCount: LESSONS.length,
    studentsCount: 1000,
    available: true,
  },
  {
    slug: "dyzain-nigtiv-prosunutyi",
    title: "Дизайн нігтів: просунутий рівень",
    description:
      "Френч, омбре, втирка, декор — 20 авторських технік дизайну для роботи з клієнтами.",
    coverImage: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80",
    category: "dyzain",
    level: "Середній",
    free: false,
    lessonsCount: 20,
    studentsCount: 640,
    available: false,
  },
  {
    slug: "materialy-ta-instrumenty-profi",
    title: "Матеріали та інструменти профі",
    description:
      "Як обрати базу, топ, лампу та інструменти — і не перевитрачати бюджет на старті.",
    coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80",
    category: "materialy",
    level: "Новачок",
    free: false,
    lessonsCount: 8,
    studentsCount: 410,
    available: false,
  },
  {
    slug: "znyattya-ta-korekciya-pokryttya",
    title: "Зняття та корекція покриття",
    description:
      "Безпечні техніки зняття гель-лаку, ремонт та корекція без шкоди нігтьовій пластині.",
    coverImage: "https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=500&q=80",
    category: "materialy",
    level: "Середній",
    free: false,
    lessonsCount: 6,
    studentsCount: 295,
    available: false,
  },
  {
    slug: "naroshuvannya-akryl-i-gel",
    title: "Нарощування: акрил і гель",
    description:
      "Архітектура форми, типси й форми, вирівнювання — крок за кроком до ідеальної довжини.",
    coverImage: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=500&q=80",
    category: "prosunutyy",
    level: "Просунутий",
    free: false,
    lessonsCount: 18,
    studentsCount: 380,
    available: false,
  },
  {
    slug: "hvoroby-nigtiv-diagnostyka",
    title: "Хвороби нігтів: діагностика",
    description:
      "Як розпізнати грибок, оніхолізис і зелену бактерію та коли відмовити клієнту в послузі.",
    coverImage: "https://images.unsplash.com/photo-1595406722896-e9fac4d5e10a?w=500&q=80",
    category: "novachky",
    level: "Новачок",
    free: false,
    lessonsCount: 5,
    studentsCount: 512,
    available: false,
  },
];
