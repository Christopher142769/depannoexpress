# Dépannage Express

Plateforme d’assistance routière au Bénin : le conducteur signale une panne, le dépanneur le plus proche est alerté, suivi live sur carte + chat.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4
- MongoDB / Mongoose · Zustand · Framer Motion · Leaflet
- Auth e-mail OTP (jamais SMS) · JWT cookie `de-session` (`jose`)
- Temps réel : **Supabase Realtime** (`NEXT_PUBLIC_REALTIME_PROVIDER=supabase`)

## Démarrage local

```bash
cp .env.example .env.local
# Renseigner au minimum : MONGODB_URI, SESSION_SECRET
# Optionnel realtime : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# MongoDB local (Docker)
docker compose up -d

npm install
npm run seed          # données de démo
npm run dev           # http://localhost:3000
```

Avec `EMAIL_PROVIDER=console`, le code OTP s’affiche dans le terminal du serveur (jamais dans la réponse HTTP).

### Comptes seed

| Rôle   | E-mail                              |
|--------|-------------------------------------|
| Client | `client.demo@depannage-express.bj`  |
| Pro    | `pro.demo@depannage-express.bj`     |
| Admin  | `admin.demo@depannage-express.bj`   |

## Variables d’environnement

Voir [`.env.example`](./.env.example) pour la liste complète.

Principales :

- `MONGODB_URI` — base Mongo
- `SESSION_SECRET` — secret JWT (≥ 16 caractères)
- `EMAIL_PROVIDER` — `console` | `nodemailer` | `resend`
- `NEXT_PUBLIC_REALTIME_PROVIDER=supabase`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` / `start` | Build & prod |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (unitaires) |
| `npm run test:e2e` | Playwright (parcours critiques) |
| `npm run mongo` | Démarre Mongo via Docker Compose |
| `npm run seed` | Peuple Mongo avec données démo |

## Architecture utile

- Landing : `src/components/marketing/` (ne pas réécrire sans besoin)
- UI : `src/components/ui/`
- API : `src/app/api/`
- Modèles : `src/server/db/models/`
- Maquettes HTML : `design-reference/`

## Temps réel (Option B)

Les canaux `intervention:{id}` transportent GPS, chat et changements de statut. L’abonnement est autorisé via `/api/realtime/authorize` ; les publications sensibles passent par `/api/realtime/publish` (service role). Sans clés Supabase, l’UI reste en polling.

## Tests

```bash
npm run test
npm run test:e2e   # nécessite Mongo + app (webServer Playwright)
```
