import { prisma } from "@/lib/prisma";

/**
 * `modules/courses/repository.ts` (задача 3.2) — лише прямі запити до
 * Prisma, без бізнес-логіки (генерація slug, валідація тощо — усе це в
 * `service.ts`). UI не повинен імпортувати цей файл напряму, лише через
 * `modules/courses/index.ts`.
 */

export interface FindAllCoursesOptions {
  /** `true` — лише опубліковані курси (публічна частина); `false`/не вказано — усі (адмінка). */
  publishedOnly?: boolean;
}

export async function findAllCourses(options: FindAllCoursesOptions = {}) {
  return prisma.course.findMany({
    where: options.publishedOnly ? { published: true } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function findCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
  });
}

export async function findCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
  });
}

/** Чи існує курс з таким `slug` (для перевірки унікальності в `service.ts`). */
export async function findCourseBySlugExists(slug: string): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true },
  });
  return course !== null;
}

export interface CreateCourseData {
  slug: string;
  title: string;
  description: string;
  coverImage?: string | null;
  published?: boolean;
  introVideoUrl?: string | null;
  introDescription?: string | null;
  masterName?: string | null;
  masterBio?: string | null;
  masterAvatarUrl?: string | null;
}

export async function createCourse(data: CreateCourseData) {
  return prisma.course.create({
    data: {
      slug: data.slug,
      title: data.title,
      description: data.description,
      coverImage: data.coverImage ?? null,
      published: data.published ?? false,
      introVideoUrl: data.introVideoUrl ?? null,
      introDescription: data.introDescription ?? null,
      masterName: data.masterName ?? null,
      masterBio: data.masterBio ?? null,
      masterAvatarUrl: data.masterAvatarUrl ?? null,
    },
  });
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  coverImage?: string | null;
  published?: boolean;
  introVideoUrl?: string | null;
  introDescription?: string | null;
  masterName?: string | null;
  masterBio?: string | null;
  masterAvatarUrl?: string | null;
}

export async function updateCourse(id: string, data: UpdateCourseData) {
  return prisma.course.update({
    where: { id },
    data,
  });
}

export async function deleteCourse(id: string) {
  return prisma.course.delete({
    where: { id },
  });
}
