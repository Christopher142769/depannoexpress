# Dépannage Express — conventions agents

Plateforme d’assistance routière au Bénin. Stack : **Next.js 16 (App Router)**, React 19, TypeScript strict, Tailwind CSS v4, MongoDB/Mongoose, Zustand, Framer Motion.

## Architecture

- **App Router** standard (`src/app/`) — groupes de routes : `(marketing)`, `(auth)`, `(client)`, `(pro)`, `(admin)`.
- Alias **`@/*` → `src/*`** (voir `tsconfig.json`).
- TypeScript **strict** (`strict: true`).
- Design tokens et thèmes clair/sombre : `src/app/globals.css` (`--brand-blue`, `--brand-red`, rayons, glassmorphism).
- Composants UI réutilisables : `src/components/ui/`.
- Landing marketing : `src/components/marketing/` + `src/styles/landing.css` — **ne pas réécrire** sans demande explicite.
- Maquettes HTML de référence : `design-reference/` (source de vérité visuelle, pas du code app).
- Couche serveur : `src/server/` (MongoDB, modèles Mongoose, email, temps réel).
- État client : `src/stores/` (Zustand).
- Auth **email + mot de passe** (pas de SMS). Comptes démo : voir `/demo` et `DEMO_PASSWORD`.

## Règles

- Étendre le design system existant ; ne pas le refaire ni changer la charte (couleurs, typos Clash Display / Satoshi, rayons) sans demande.
- Routes API : valider les inputs avec **zod**, réponses d’erreur HTTP propres.
- Secrets : uniquement via variables d’environnement ; documenter dans `.env.example`.
- Ne pas inventer une “version Next.js inconnue” : les APIs App Router / `next/image` / `metadata` standard s’appliquent.
