"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthVehicleCarousel } from "@/components/auth/auth-vehicle-carousel";
import { APP_NAME } from "@/lib/constants";
import { LOGO_MARK_SRC } from "@/components/brand/logo";

export function AuthVisualPanel({
  accent = "client",
}: {
  accent?: "client" | "pro" | "admin";
}) {
  return <AuthVehicleCarousel accent={accent === "admin" ? "client" : accent} />;
}

export function AuthBrandHeader() {
  return (
    <Link href="/" className="auth-brand">
      <Image
        src={LOGO_MARK_SRC}
        alt=""
        width={40}
        height={40}
        className="auth-brand__mark"
        priority
      />
      <span className="auth-brand__name">{APP_NAME}</span>
    </Link>
  );
}
