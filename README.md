# Saumya Enterprises – export website

Angular 20 (prerendered for SEO) + Cloudflare Worker API (Hono) + D1 database + R2 image storage.

## Run locally
```powershell
npm install
npm run db:init     # creates local database and loads the starting content
npx ng build        # builds the public site and admin into dist/
npm run api         # http://localhost:8787 (site + API + /admin)
```
For live-reload while developing the front end, run `npm run api` in one terminal and `npm start` in another (proxies /api to 8787).

Local admin login: see `.dev.vars` (never used in production).

## Deploy
See `worker/README.md` (create D1 + R2, set secrets, migrate, seed, `npm run deploy`).

## Content
Starting content lives in `seed/seed.json`. After the first deploy the owner edits everything from `/admin`.
