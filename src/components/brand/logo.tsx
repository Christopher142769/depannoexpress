import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const LOGO_SRC = "/logo.png";
export const LOGO_MARK_SRC = "/logo-mark.png";

type LogoProps = {
  variant?: "full" | "mark";
  className?: string;
  /** Masque le texte alternatif quand le nom de marque est déjà à côté */
  decorative?: boolean;
};

export function Logo({
  variant = "full",
  className,
  decorative = false,
}: LogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src={LOGO_MARK_SRC}
        alt={decorative ? "" : APP_NAME}
        width={80}
        height={80}
        className={cn(
          "h-10 w-10 rounded-full object-cover bg-black ring-1 ring-black/10",
          className
        )}
        priority
      />
    );
  }

  return (
    <Image
      src={LOGO_SRC}
      alt={decorative ? "" : APP_NAME}
      width={640}
      height={360}
      className={cn("h-auto w-44 rounded-2xl bg-black", className)}
      priority
    />
  );
}

type BrandLinkProps = {
  className?: string;
  markClassName?: string;
  showName?: boolean;
};

/** Lien accueil : picto + nom, pour barres de navigation. */
export function BrandLink({
  className,
  markClassName,
  showName = true,
}: BrandLinkProps) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 shrink-0 group", className)}
    >
      <Logo
        variant="mark"
        decorative={showName}
        className={cn(
          "transition-transform duration-300 group-hover:scale-105",
          markClassName
        )}
      />
      {showName && (
        <span className="font-display font-semibold text-[17px] tracking-tight text-text-primary whitespace-nowrap">
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
