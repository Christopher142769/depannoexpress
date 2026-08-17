import "@/styles/spaces.css";
import { SpaceShell } from "@/components/layout/space-shell";
import { LANDING_ROUTES } from "@/lib/landing-routes";

const NAV = [
  { href: LANDING_ROUTES.adminApp, label: "Tableau de bord", exact: true },
];

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SpaceShell
      title="Back-office"
      subtitle="Pilotage de la plateforme"
      badge="Administration"
      badgeTone="amber"
      tone="admin"
      nav={NAV}
    >
      {children}
    </SpaceShell>
  );
}
