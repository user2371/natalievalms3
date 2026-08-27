import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Дефолтна аватарка для юзерів, які не завантажили власну (`avatarUrl ===
 * null`/`undefined`). Той самий файл, що вже використовується як
 * `FALLBACK_PROFILE_PHOTO` на `/profile`, `/users/[id]` та `/settings` —
 * винесено сюди як єдине джерело правди, оскільки `Avatar` — спільний
 * компонент для лідерборду, коментарів, хедера (`AccountButton`) та
 * `MasterSection`, де раніше замість картинки показувались ініціали.
 */
export const FALLBACK_AVATAR_SRC = "/defaultProfilePhoto.svg";

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  /**
   * F.27.3: роль власника аватарки (той самий стиль типу, що вже
   * `CommentAuthor.role: string`, — рядок, а не enum-імпорт з Prisma, щоб
   * не тягнути залежність від Prisma-типів у клієнтський UI-компонент).
   * Коли `"ADMIN"` — поверх аватарки рендериться маленький бейдж "M". Це
   * ЄДИНЕ місце в кодовій базі, де малюється сам SVG бейджа — усі інші
   * компоненти (F.27.4–F.27.7) лише прокидають `role` сюди.
   */
  role?: string;
}

/**
 * F.27.3: бейдж "M" (moderator) — кружечок з літерою в правому нижньому
 * куті аватарки, той самий принцип позиціонування, що зазвичай для
 * status-індикаторів ("онлайн"-точка). Колір — `accent`/`accent-dark`, той
 * самий, що вже використовується для "Адміністратор" `Badge` в
 * `AdminUsersTable.tsx` (F.27.9.1). Розмір пропорційний `size` аватарки
 * (`size * 0.32`), з білою обвідкою, щоб бейдж не зливався з фоном під
 * аватаркою. `title` — підказка при наведенні (F.27.9.1).
 */
function AdminBadge({ size }: { size: number }) {
  const badgeSize = Math.round(size * 0.32);
  return (
    <span
      role="img"
      aria-label="Модератор"
      title="Модератор"
      className="absolute right-0 bottom-0 flex items-center justify-center rounded-full bg-accent text-white ring-2 ring-white"
      style={{
        width: badgeSize,
        height: badgeSize,
        fontSize: badgeSize * 0.62,
        lineHeight: 1,
      }}
    >
      <span className="font-semibold">M</span>
    </span>
  );
}

export function Avatar({ src, name, size = 40, className, role }: AvatarProps) {
  const isAdmin = role === "ADMIN";
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-visible",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="relative inline-flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-accent-soft text-accent-dark font-medium"
        style={{ fontSize: size * 0.4 }}
      >
        <Image
          src={src || FALLBACK_AVATAR_SRC}
          alt={name ?? "Avatar"}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </span>
      {isAdmin && <AdminBadge size={size} />}
    </span>
  );
}
