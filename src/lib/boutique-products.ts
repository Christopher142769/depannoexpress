/** Catalogue boutique — landing + seed (images dans /public/products/) */

export type BoutiqueProduct = {
  slug: string;
  imageUrl: string;
  category: "pneu" | "piece" | "accessoire";
  categoryLabel: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string;
  stock: number;
};

export const BOUTIQUE_PRODUCTS: BoutiqueProduct[] = [
  {
    slug: "pneu-tourisme",
    imageUrl: "/products/pneu-tourisme.png",
    category: "pneu",
    categoryLabel: "Pneus",
    name: "Pneu tourisme 185/65 R15",
    description: "Pneu neuf, livraison Cotonou",
    price: 35000,
    priceUnit: "unité",
    stock: 12,
  },
  {
    slug: "plaquettes-frein",
    imageUrl: "/products/plaquettes-frein.png",
    category: "piece",
    categoryLabel: "Freinage",
    name: "Plaquettes de frein",
    description: "Jeu avant universel",
    price: 18500,
    priceUnit: "jeu",
    stock: 20,
  },
  {
    slug: "batterie-12v",
    imageUrl: "/products/batterie-12v.png",
    category: "piece",
    categoryLabel: "Électrique",
    name: "Batterie 12V",
    description: "Batterie automobile 12V, pose possible",
    price: 62000,
    priceUnit: "unité",
    stock: 8,
  },
  {
    slug: "kit-urgence-route",
    imageUrl: "/products/kit-urgence-route.png",
    category: "accessoire",
    categoryLabel: "Accessoires",
    name: "Kit d'urgence route",
    description: "Triangle, gilet, câbles",
    price: 9900,
    priceUnit: "pack",
    stock: 40,
  },
];
