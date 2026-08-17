import { extractYoutubeId } from "@/lib/youtube";
import {
  getPointsSummaryService,
  getUserRankService,
  getRankedUsersCountService,
} from "@/modules/points";
import * as repository from "./repository";
import type { ProfileUserRow } from "./repository";

/**
 * `modules/profile/service.ts` (задача 6.6.16) — агрегація публічних
 * даних профілю: базова інфа, сума балів і місце в рейтингу
 * (`modules/points`), список курсів з прогресом, ДЗ (з урахуванням
 * `homeworkVisible`-прапорця з Налаштувань).
 *
 * ⚠️ Свідомо НЕ входить у цю агрегацію:
 * - **Сертифікати** — не було в переліку задачі 6.6.16 взагалі;
 *   `modules/certificates` ще не існує (Фаза 3+/5+), той розділ на
 *   сторінці профілю й далі на демо-даних (`lib/data/certificates.ts`,
 *   не чіпали).
 * - **Досягнення** — були в переліку задачі 6.6.16, але сам модуль
 *   `modules/achievements` видалено з проєкту (рішення користувача,
 *   задача 6.6.15) ще ДО того, як дійшли до 6.6.16 — тому в
 *   агрегацію не входять.
 *
 * `homeworkVisible` тут читається з РЕАЛЬНОГО поля `User.homeworkVisible`
 * (БД, джерело правди).
 *
 * 01.08.2026 (задача 9.15, виправлення прогалини 2, знайденої під час
 * трасування фінального E2E-сценарію): перемикач у `/settings`
 * (`useHomeworkVisibility`, `lib/progress/useLocalSettings.ts`) РАНІШЕ писав
 * лише в `localStorage`/Redux, не синхронізуючись із цим полем — тепер,
 * коли реальний `userId` доступний (`useSession()` на `/settings`), він
 * ТАКОЖ викликає `updateHomeworkVisibilityAction` (`actions.ts`, нижче),
 * яка пише в `User.homeworkVisible` через `repository.updateHomeworkVisible`.
 * `localStorage`/Redux лишаються як миттєвий локальний echo для UI (без
 * зайвого round-trip на кожен рендер перемикача) — БД синхронізується
 * паралельно, best-effort (не блокує UI перемикача).
 */

export interface PublicCourseProgress {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  completedLessons: number;
  totalLessons: number;
}

export interface PublicHomeworkVideo {
  courseName: string;
  lessonNumber: number;
  lessonTitle: string;
  submittedAt: string;
  videoId: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  bio: string | null;
  joinedAt: string;
  points: number;
  rank: number;
  rankOutOf: number;
  homeworkVisible: boolean;
  completedCourses: PublicCourseProgress[];
  homeworkVideos: PublicHomeworkVideo[];
}

function displayName(user: ProfileUserRow): string {
  if (user.nickname) return user.nickname;
  return `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;
}

export async function getPublicProfileService(
  userId: string,
): Promise<PublicProfile | null> {
  const user = await repository.findUserById(userId);
  if (!user) return null;

  const [summary, rank, rankOutOf, courses, submissions] = await Promise.all([
    getPointsSummaryService(user.id),
    getUserRankService(user.id),
    getRankedUsersCountService(),
    repository.findCoursesProgressForUser(user.id),
    repository.findHomeworkSubmissionsForUser(user.id),
  ]);

  const homeworkVideos: PublicHomeworkVideo[] = submissions
    .map((submission) => {
      const videoId = extractYoutubeId(submission.videoUrl);
      if (!videoId) return null;
      return {
        courseName: submission.courseName,
        lessonNumber: submission.lessonNumber,
        lessonTitle: submission.lessonTitle,
        submittedAt: submission.submittedAt.toISOString(),
        videoId,
      };
    })
    .filter((item): item is PublicHomeworkVideo => item !== null);

  return {
    id: user.id,
    name: displayName(user),
    handle: user.nickname ? `@${user.nickname}` : "",
    avatarUrl: user.avatarUrl,
    bio: user.about,
    joinedAt: user.createdAt.toISOString(),
    points: summary.totalPoints,
    rank,
    rankOutOf,
    homeworkVisible: user.homeworkVisible,
    completedCourses: courses.map((course) => ({
      id: course.courseId,
      slug: course.slug,
      title: course.title,
      coverImage: course.coverImage,
      completedLessons: course.completedLessons,
      totalLessons: course.totalLessons,
    })),
    homeworkVideos,
  };
}

/**
 * Задача 9.15 (виправлення прогалини 2) — просте пропускання в repository,
 * без додаткової валідації (`boolean` уже гарантований типом на межі
 * action, той самий мінімалізм, що й у простих update-функціях інших
 * сервісів, напр. `modules/users/service.ts`).
 */
export async function updateHomeworkVisibilityService(
  userId: string,
  homeworkVisible: boolean,
): Promise<void> {
  await repository.updateHomeworkVisible(userId, homeworkVisible);
}

/**
 * Задача 3+.4.3 — той самий мінімалізм, що й `updateHomeworkVisibilityService`
 * вище: `about` тут уже провалідований `UpdateBioSchema.parse` в
 * `actions.ts` (3+.4.1), тому сервіс — лише прозоре передавання в
 * репозиторій.
 */
export async function updateBioService(userId: string, about: string): Promise<void> {
  await repository.updateBio(userId, about);
}
