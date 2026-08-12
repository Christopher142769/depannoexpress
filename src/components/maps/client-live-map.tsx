"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/maps/live-map";

const LiveMap = dynamic(
  () => import("@/components/maps/live-map").then((m) => m.LiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full rounded-card border border-border bg-bg-elevated animate-pulse" />
    ),
  }
);

export function ClientLiveMap(props: { points: MapPoint[]; className?: string }) {
  return <LiveMap {...props} />;
}
