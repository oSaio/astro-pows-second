# Astro-Paws: Captain Pixel's Code Odyssey

React 18 + Vite + Tailwind frontend, Express + SQLite backend, JWT auth, bcrypt (bcryptjs) password hashing.

## Setup
```bash
npm install
cp .env.example .env     # set JWT_SECRET (long random string), ADMIN_USERNAME, ADMIN_PASSWORD
npm test                 # runs every level's solution through the interpreter
npm run dev:server       # API on :3001
npm run dev              # Vite on :5173 (proxies /api)
```
The admin account is seeded from `ADMIN_USERNAME`/`ADMIN_PASSWORD` at server start. Sign-up always creates a regular user.

## Deploy
```bash
npm ci && npm run build
NODE_ENV=production npm start     # Express serves dist/ and /api on one origin
```
Put it behind HTTPS (Render, Fly.io, Railway, or a VPS with Caddy/nginx). Keep `DB_FILE` on a persistent volume and back it up. Set `JWT_SECRET` as a host secret, never in the repo.

## Security notes
- Passwords: bcrypt cost 12. Usernames limited to `[A-Za-z0-9_]`, and React escapes all output.
- All SQL uses prepared statements. Auth endpoints are rate-limited; helmet headers are on.
- Stars and credits are computed server-side by re-running the submitted program with the shared engine (`src/engine.js`); the client cannot grant itself progress or skip locked levels.
- The JWT is kept in localStorage; for stricter setups switch to an httpOnly cookie.
