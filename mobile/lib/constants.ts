export const APP_NAME = "Dépannage Express";

export const BRAND = {
  blue: "#1e73be",
  blueDark: "#155a98",
  red: "#e0231c",
  gray100: "#f4f6f8",
  gray200: "#e8ecf0",
  gray500: "#6b7280",
  gray900: "#111827",
  white: "#ffffff",
} as const;

export const USER_ROLES = {
  CLIENT: "client",
  PRO: "pro",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  en_route: "En route",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

export const ACTIVE_STATUSES = ["pending", "accepted", "en_route", "in_progress"] as const;
