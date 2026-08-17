import { VideoPlayer } from "@/components/lesson/VideoPlayer";
import { Avatar } from "@/components/ui/Avatar";

export interface HomeworkVideoCardProps {
  courseName: string;
  lessonNumber: number;
  lessonTitle: string;
  submittedAt: string; // ISO
  videoId: string;
  /** Автор ДЗ (опційно) — рядок аватар+нік під підписом. Задача 0.9b.1: сторінка `/homework` показує автора під кожним відео. */
  authorName?: string;
  authorHandle?: string;
  authorAvatarUrl?: string | null;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Картка зданого відео ДЗ — замість фото справжній вбудований YouTube-плеєр
 * (`VideoPlayer`, той самий компонент, що й на сторінці уроку). Використовується
 * і на профілі (`/profile`, `/users/[id]`), і на сторінці `/homework` (0.9b.1);
 * рядок автора рендериться лише коли передано `authorName`.
 */
export function HomeworkVideoCard({
  courseName,
  lessonNumber,
  lessonTitle,
  submittedAt,
  videoId,
  authorName,
  authorHandle,
  authorAvatarUrl,
}: HomeworkVideoCardProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <VideoPlayer videoId={videoId} title={lessonTitle} className="rounded-xl" />
      <div>
        <p className="text-xs text-muted">Курс: {courseName}</p>
        <p className="text-sm font-medium text-ink">
          Урок {lessonNumber}. {lessonTitle}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {DATE_FORMATTER.format(new Date(submittedAt))}
        </p>
        {authorName && (
          <div className="mt-2 flex items-center gap-1.5">
            <Avatar src={authorAvatarUrl} name={authorName} size={20} />
            <span className="text-xs text-muted">{authorHandle ?? authorName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
