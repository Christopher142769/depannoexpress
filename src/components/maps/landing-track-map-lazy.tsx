"use client";

import dynamic from "next/dynamic";

export const LandingTrackMapLazy = dynamic(
  () =>
    import("@/components/maps/landing-track-map").then((m) => m.LandingTrackMap),
  {
    ssr: false,
    loading: () => (
      <div className="landing-map-skeleton" aria-hidden="true">
        <span className="landing-map-skeleton-pulse" />
      </div>
    ),
  }
);
