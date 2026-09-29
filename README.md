# Coach Hub

Platforma pro osobní trenéry: správa klientů, tréninkové plány, rezervace, zprávy, balíčky a platby, partnerský program. Trenér a klient mají každý vlastní rozhraní (`/dashboard`, `/klient`).

- Produkce: https://coach-hub-pro-22.vercel.app
- Stack: Vite + React + TypeScript, shadcn-ui + Tailwind, TanStack Query, Supabase (Postgres, Auth, Storage, Edge Functions), PWA
- Projekt je synchronizovaný s [Lovable](https://lovable.dev) — commity do `main` se propisují tam a naopak.

## Lokální vývoj

```sh
npm install
cp .env.example .env   # doplňte hodnoty Supabase projektu
npm run dev            # http://localhost:8080
```

| Příkaz | Co dělá |
| --- | --- |
| `npm run build` | produkční build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |

## Databáze

Migrace jsou v `supabase/migrations/`. Databáze běží v Lovable Cloud, takže nové migrace spouští Lovable (v chatu projektu požádat o aplikaci čekající migrace). Po aplikaci Lovable přegeneruje `src/integrations/supabase/types.ts`.

Tabulky, které zatím v generovaných typech nejsou, se volají přes helper `from()` v `src/lib/db.ts`.

## Struktura

- `src/App.tsx` — všechny routy; trenérské a klientské stránky hlídá `RoleGuard`
- `src/pages/` — trenérské stránky, `src/pages/client/` — klientské, `src/pages/admin/` — administrace partnerského programu
- `src/lib/partner-engine.ts` — vyhodnocování pravidel kampaní
- `supabase/functions/send-invite` — e-mail s pozvánkou klienta (Resend)

Podrobnosti pro vývoj s Claude Code jsou v `CLAUDE.md`.
