import "@/styles/spaces.css";
import { ClientTabBar } from "@/components/mobile/client-tab-bar";
import { SpaceShell } from "@/components/layout/space-shell";
import { LANDING_ROUTES } from "@/lib/landing-routes";

const NAV = [
  { href: LANDING_ROUTES.clientApp, label: "Accueil", exact: true },
  { href: LANDING_ROUTES.clientBoutique, label: "Boutique" },
  { href: LANDING_ROUTES.clientProfile, label: "Profil" },
];

export default function ClientGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SpaceShell
        title="Espace utilisateur"
        subtitle="Assistance routière en direct"
        badge="Utilisateur"
        tone="client"
        nav={NAV}
      >
        {children}
      </SpaceShell>
      <ClientTabBar />
    </>
  );
}
