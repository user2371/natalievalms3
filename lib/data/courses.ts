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
 * рахується динамічно з `LESSONS.length`). Макетні картки "Незабаром" (5
 * заглушок для демонстрації каталогу) прибрано за проханням користувача —
 * коли з'являться реальні наступні курси в БД (`modules/courses`, Prisma),
 * `CoursesCatalogClient` підхопить їх автоматично (`realCourses`, які не
 * збігаються зі `staticSlugs` тут, додаються в кінець сітки окремими
 * картками — дивись компонент).
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
];
