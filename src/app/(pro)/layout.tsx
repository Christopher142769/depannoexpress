import "@/styles/spaces.css";
import { ProTabBar } from "@/components/mobile/pro-tab-bar";
import { SpaceShell } from "@/components/layout/space-shell";
import { LANDING_ROUTES } from "@/lib/landing-routes";

const NAV = [
  { href: LANDING_ROUTES.proApp, label: "Missions", exact: true },
  { href: LANDING_ROUTES.proProfile, label: "Profil" },
];

export default function ProGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SpaceShell
        title="Espace dépanneur"
        subtitle="Missions, GPS et portefeuille"
        badge="Dépanneur"
        badgeTone="red"
        tone="pro"
        nav={NAV}
      >
        {children}
      </SpaceShell>
      <ProTabBar />
    </>
  );
}
