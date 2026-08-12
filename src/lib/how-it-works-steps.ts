/** Étapes « Comment ça marche » — section landing */

export type HowItWorksStep = {
  slug: string;
  step: string;
  imageUrl: string;
  title: string;
  description: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    slug: "signaler-panne",
    step: "01",
    imageUrl: "/steps/etape-signaler-panne.png",
    title: "Signalez votre panne",
    description:
      "Choisissez le type de problème, puis décrivez-le par message écrit ou vocal. Le professionnel sait s'il peut intervenir.",
  },
  {
    slug: "pro-repond",
    step: "02",
    imageUrl: "/steps/etape-pro-repond.png",
    title: "Le dépanneur le plus proche répond",
    description:
      "Grâce à la géolocalisation, le dépanneur le plus proche reçoit l'alerte, accepte la mission et prend la route.",
  },
  {
    slug: "suivi-direct",
    step: "03",
    imageUrl: "/steps/etape-suivi-direct.png",
    title: "Suivez-le en direct",
    description:
      "Position en temps réel, heure d'arrivée estimée, et un appel ou un message WhatsApp à portée de main.",
  },
];
