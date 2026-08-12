/** Profils métiers — section landing « Un expert pour chaque panne » */

export type TradeProfile = {
  slug: string;
  imageUrl: string;
  accent: "red" | "blue" | "mix";
  title: string;
  description: string;
};

export const TRADE_PROFILES: TradeProfile[] = [
  {
    slug: "mecanicien",
    imageUrl: "/trades/mecanicien.png",
    accent: "red",
    title: "Mécanicien",
    description:
      "Panne moteur, démarrage, freinage, fuites… Un mécanicien diagnostique et répare sur place ou vous remorque.",
  },
  {
    slug: "vulcanisateur",
    imageUrl: "/trades/vulcanisateur.png",
    accent: "blue",
    title: "Vulcanisateur",
    description:
      "Pneu crevé, jante voilée, pression à régler ? Le spécialiste pneus intervient vite et vous remet sur la route.",
  },
  {
    slug: "electricien-auto",
    imageUrl: "/trades/electricien-auto.png",
    accent: "mix",
    title: "Électricien auto",
    description:
      "Batterie à plat, alternateur, faisceau, démarreur… L'électricien auto remet le courant et relance votre véhicule.",
  },
];
