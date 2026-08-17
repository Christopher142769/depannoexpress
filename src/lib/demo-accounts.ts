/** Comptes de démonstration — email + mot de passe */

export const DEMO_PASSWORD = "Demo123!";

export const DEMO_ACCOUNTS = [
  {
    role: "client" as const,
    label: "Utilisateur",
    email: "client.demo@depannage-express.bj",
    password: DEMO_PASSWORD,
    name: "Aïcha Demo",
    loginPath: "/login",
    appPath: "/app",
    description:
      "Signalez une panne, suivez le dépanneur sur la carte, chattez et notez l’intervention.",
  },
  {
    role: "pro" as const,
    label: "Dépanneur",
    email: "pro.demo@depannage-express.bj",
    password: DEMO_PASSWORD,
    name: "Koffi Mécano",
    loginPath: "/pro/login",
    appPath: "/pro",
    description:
      "Passez disponible, acceptez les missions, publiez votre GPS et consultez votre portefeuille.",
  },
  {
    role: "admin" as const,
    label: "Administrateur",
    email: "admin.demo@depannage-express.bj",
    password: DEMO_PASSWORD,
    name: "Admin Demo",
    loginPath: "/admin/login",
    appPath: "/admin",
    description:
      "Pilotez la plateforme : stats, utilisateurs et suivi des interventions.",
  },
] as const;
