/** Constantes globales de la plateforme Dépannage Express */

export const APP_NAME = "Dépannage Express";
export const APP_TAGLINE = "Assistance routière au Bénin, en un clic.";

/** Pénalité d'annulation (FCFA) */
export const CANCELLATION_PENALTY = 500;

/** Durée de validité d'un code OTP (minutes) */
export const OTP_EXPIRY_MINUTES = 10;

/** Longueur du code OTP */
export const OTP_LENGTH = 6;

/** Rôles utilisateur */
export const USER_ROLES = {
  CLIENT: "client",
  PRO: "pro",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

/** Spécialités dépanneur */
export const PRO_SPECIALTIES = {
  MECHANIC: "mecanicien",
  TIRE: "vulcanisateur",
  ELECTRICIAN: "electricien",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type ProSpecialty = (typeof PRO_SPECIALTIES)[keyof typeof PRO_SPECIALTIES];
