import { slugify } from "@/lib/utils";
import {
  CreateCourseInput,
  CreateCourseSchema,
  UpdateCourseInput,
  UpdateCourseSchema,
} from "./schema";
import * as repository from "./repository";

/**
 * `modules/courses/service.ts` (задача 3.3) — бізнес-логіка та валідація
 * поверх `repository.ts`. `actions.ts` викликає лише функції звідси, ніколи
 * не звертається до `repository.ts` напряму.
 */

/**
 * Генерує унікальний slug з назви курсу (задача 3.3, "генерація slug з
 * title, перевірка унікальності"). Якщо базовий slug вже зайнятий — додає
 * числовий суфікс (`-2`, `-3`, ...), поки не знайде вільний.
 */
async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "course";

  let candidate = base;
  let suffix = 2;
  while (await repository.findCourseBySlugExists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function listCoursesService(publishedOnly = false) {
  return repository.findAllCourses({ publishedOnly });
}

export async function getCourseBySlugService(slug: string) {
  return repository.findCourseBySlug(slug);
}

export async function getCourseByIdService(id: string) {
  return repository.findCourseById(id);
}

export async function createCourseService(input: CreateCourseInput) {
  const parsed = CreateCourseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані курсу");
  }

  const slug = await generateUniqueSlug(parsed.data.title);

  return repository.createCourse({
    slug,
    title: parsed.data.title,
    description: parsed.data.description,
    coverImage: parsed.data.coverImage,
    published: parsed.data.published,
    introVideoUrl: parsed.data.introVideoUrl,
    introDescription: parsed.data.introDescription,
    masterName: parsed.data.masterName,
    masterBio: parsed.data.masterBio,
    masterAvatarUrl: parsed.data.masterAvatarUrl,
  });
}

export async function updateCourseService(input: UpdateCourseInput) {
  const parsed = UpdateCourseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані курсу");
  }

  const existing = await repository.findCourseById(parsed.data.id);
  if (!existing) {
    throw new Error("Курс не знайдено");
  }

  // Slug навмисно НЕ перегенеровується при зміні `title` — стабільний slug
  // важливий для вже опублікованих посилань на курс (SEO, закладки).
  // Зміна slug'а курсу після публікації — окрема задача поза 3.1–3.5.
  const { id, ...rest } = parsed.data;
  return repository.updateCourse(id, rest);
}

export async function deleteCourseService(id: string) {
  const existing = await repository.findCourseById(id);
  if (!existing) {
    throw new Error("Курс не знайдено");
  }

  return repository.deleteCourse(id);
}
