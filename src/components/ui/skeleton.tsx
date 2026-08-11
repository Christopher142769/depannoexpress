import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active l'animation shimmer */
  shimmer?: boolean;
}

/** Placeholder animé pendant le chargement des données */
function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-input bg-bg-surface",
        shimmer && "skeleton-shimmer",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
