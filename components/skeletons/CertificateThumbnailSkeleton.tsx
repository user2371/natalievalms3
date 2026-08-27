import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface CertificateThumbnailSkeletonProps {
  className?: string;
}

/**
 * Скелетон мініатюри сертифіката (ФАЗА SKELETON, задача SKEL.3) — той
 * самий `aspect-[3/2] rounded-lg border` контейнер, що й
 * `CertificateThumbnail.tsx`. Використовується в сітці мініатюр на
 * `/profile` (до 5 штук), `/certificates` і `/users/[id]/certificates`,
 * поки `getCertificatesForUserAction` ще не повернув результат.
 */
export function CertificateThumbnailSkeleton({
  className,
}: CertificateThumbnailSkeletonProps) {
  return (
    <Skeleton
      className={cn("aspect-[3/2] w-full rounded-lg border border-rose-line/50", className)}
    />
  );
}
