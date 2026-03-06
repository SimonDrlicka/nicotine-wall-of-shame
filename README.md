# Wall of Shame — Nikotínový tracker

Krátky, drsný a úprimný tracker relapsov + prekonaných kríz.

## Lokálne spustenie (dev)

1. Nainštaluj závislosti:

```sh
npm install
```

2. Nastav `.env.local` (lokálne SQLite):

```ini
DATABASE_URL_DEV="file:./dev.db"
```

3. Spusť migrácie a dev server:

```sh
npm run db:migrate:dev:env
npm run dev
```

Aplikácia beží na `http://localhost:3000`.

## Pridanie novej migrácie (Postgres/Neon)

Keď zmeníš `prisma/schema.prisma`, vytvor novú migráciu:

```sh
DATABASE_URL=$POSTGRES_PRISMA_URL npx prisma migrate dev --name tvoj_nazov
```

To ti vygeneruje priečinok v `prisma/migrations` a hneď to aplikuje.

## Spustenie migrácií na Neon (produkcia)

Neon vyžaduje non‑pooling URL (napr. `POSTGRES_PRISMA_URL`).

```sh
npm run db:generate
npm run db:migrate:deploy
```

Alebo použiješ naše env skripty:

```sh
npm run db:migrate:deploy:env
```

## Deploy na Vercel

Vercel automaticky spúšťa migrácie cez `vercel-build`:

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

V `Production` env nastav:

```ini
DATABASE_URL_PROD=POSTGRES_PRISMA_URL
```

## Užitočné skripty

- `npm run dev` — lokálny dev server
- `npm run db:migrate:dev:env` — migrácie pre lokálny SQLite
- `npm run db:migrate:deploy:env` — migrácie pre Neon
- `npm run db:studio` — Prisma Studio
