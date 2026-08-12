import type { UserRole } from "@/lib/constants";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
};

export type GeoPoint = {
  lat: number;
  lng: number;
  address?: string;
};

export type Intervention = {
  id: string;
  status: string;
  problem: string;
  clientLocation: GeoPoint | null;
  proLocation: GeoPoint | null;
  pro?: {
    id?: string;
    name?: string;
    phone?: string;
    specialty?: string;
  } | null;
  estimatedPrice?: number;
  finalPrice?: number;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: "pneu" | "piece" | "accessoire";
  price: number;
  stock: number;
  imageUrl?: string;
};
