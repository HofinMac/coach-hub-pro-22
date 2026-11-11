# Přesun z Lovable Cloud do vlastního Supabase

Stav k 31. 10. 2026. Cíl: databáze, přihlašování, soubory a funkce na serveru poběží ve vlastním projektu Supabase. Migrace a nasazení pak zvládneme bez Lovable a bez jeho kreditů.

## Shrnutí

| | Dnes (Lovable Cloud) | Po přesunu |
| --- | --- | --- |
| Databáze, přihlašování, soubory | Supabase spravovaný Lovable (`oqtxwelesrwmvvurzslj`) | Vlastní projekt Supabase (EU, Frankfurt) |
| Migrace a funkce na serveru | Přes chat Lovable (stojí kredity) | Spouštím je přímo já (Supabase CLI), s testy předem |
| Přihlášení přes Google/Apple | Přes Lovable (`@lovable.dev/cloud-auth-js`) | Přímo Supabase. Google potřebuje vlastní OAuth klient, Apple vypnout, nebo později s Apple Developer účtem |
| Hosting aplikace | Vercel | Beze změny |
| Odhad práce | | Já zhruba 1 den, ty zhruba 1 hodina |
| Cena | Kredity Lovable | Free 0 $. Pro 25 $ měsíčně, doporučeno před ostrým spuštěním (Free se po 7 dnech bez provozu uspí) |

## Na čem dnes závisíme (zjištěno z kódu)

- **Schéma databáze**: všech 18 migrací je v `supabase/migrations/` a v novém projektu je zopakujeme beze změn. Testy (`npm run test`) je ověřují.
- **Natvrdo zapsaná adresa projektu**: `supabase/migrations/20261006100000_push_notifications.sql` (adresa funkce `send-push` v `private.app_config`), `supabase/config.toml`, `.env`, skills v `.claude/`. Vyřešíme novou migrací a změnou konfigurace.
- **Rozšíření**: `pg_net` a `pg_cron` (notifikace, připomínky). Na Supabase jsou k dispozici, po přesunu ověříme, že se zapnula.
- **Funkce na serveru**: `send-invite`, `send-push`, `send-slot-invitations`.
- **Tajné klíče funkcí**: `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (máš ve správci hesel), volitelně `APP_URL` a `VAPID_SUBJECT`.
- **Úložiště souborů**: buckety `profile-assets` (fotky, videa cviků) a `certificates` (soukromý). Vytvoří je migrace, soubory se přenesou zvlášť.
- **Lovable v kódu**: `src/integrations/lovable/index.ts` (Google/Apple přihlášení), `src/integrations/supabase/previewAuthStorage.ts` a `client.ts` (generuje Lovable), drizzle kopie migrací ve složce `drizzle/`.

## Rozhodnutí (11. 11. 2026)

1. **Data: přenést všechno** (varianta B). Testeři, hlavně Vojta, si nechají účty, hesla i data.
   Export zajistí dočasná funkce `export-data` (chráněná klíčem `EXPORT_TOKEN`), kterou Lovable jen nasadí. Hned po exportu se funkce i klíč smažou.
2. **Google přihlášení ponechat.** Založíme vlastního OAuth klienta v Google Cloud Console (provedu tě). **Apple vypnout.**
3. **Tarif:** nová organizace na Supabase s tarifem Pro (zhruba 25 $ měsíčně). Free dovoluje jen 2 aktivní projekty a ty už má 1 % Better. Pro se neuspí a má denní zálohy.
4. **Lovable** po přesunu odpojíme od GitHubu.

## Postup

### Fáze 1: Příprava (bez dopadu na testery)
1. **Ty:** založíš projekt na supabase.com (organizace, název `coach-hub`, region Frankfurt, silné heslo databáze do správce hesel) a přihlásíš Supabase CLI v Terminálu: `npx supabase login`.
2. **Já:** propojím repozitář s novým projektem (`supabase link`) a přidám migraci, která nastaví novou adresu `send-push`.
3. **Já:** spustím všechny migrace (`supabase db push`) a ověřím tabulky, oprávnění, trigger, `pg_net` a `pg_cron` (úloha `push-notifications-tick`).
4. **Já:** spustím Security Advisor a Performance Advisor v novém projektu a opravím případná varování.
5. **Já:** nasadím funkce (`supabase functions deploy …`). **Ty:** vložíš secrets přes `npx supabase secrets set` nebo v dashboardu (Edge Functions → Secrets).
6. **Ty a já:** nastavení přihlašování (Authentication → URL Configuration):
   - Site URL `https://coach-hub-pro-22.vercel.app`;
   - Redirect URLs `https://coach-hub-pro-22.vercel.app/**` a `http://localhost:8080/**`;
   - vlastní SMTP přes Resend (odesílatel `Coach Hub <noreply@coach-hub.eu>`), aby potvrzovací e-maily a obnova hesla chodily z naší domény a ne s limitem pár e-mailů za hodinu;
   - české šablony e-mailů (připravím).
7. **Já:** v kódu nahradím přihlášení přes Lovable přímým `supabase.auth.signInWithOAuth` (nebo tlačítka Google/Apple skryju), vyhodím `previewAuthStorage`, přegeneruji typy (`supabase gen types`) a postupně odstraním obcházení přes `from()` v `src/lib/db.ts`.
8. **Já:** upravím CLAUDE.md, skills (`/lovable-handoff` nahradí `/db-deploy`) a hook pro pořadí migrací.

### Fáze 2: Data
9. **Ty:** dobiješ trochu kreditů Lovable a necháš Lovable nasadit funkci `export-data` a otevřít formulář na `EXPORT_TOKEN` (hodnotu vložíš jen do formuláře). Export pak stáhnu já a funkci i klíč necháme smazat.
10. **Já:** nahraju data do nového projektu, zkontroluji počty řádků tabulku po tabulce a přenesu soubory.

### Fáze 3: Přepnutí (zhruba 15 minut výpadku)
11. **Ty:** dáš testerům vědět, ideálně den předem.
12. **Já:** ve Vercelu nastavím `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` a `VITE_SUPABASE_PROJECT_ID` (Production i Preview), odstraním `.env` z repozitáře a nasadím.
13. **Já:** spustím `/verify-prod`: web, přihlášení, registraci přes pozvánku, rezervaci, zprávy v reálném čase, zkušební notifikaci a e-mail s pozvánkou na lekci.
14. **Testeři:** po aktualizaci aplikace se znovu přihlásí a znovu si zapnou upozornění. Push odběry jsou vázané na databázi.

### Fáze 4: Úklid
15. **Ty:** odpojíš Lovable od GitHubu (Lovable → projekt → GitHub → Disconnect).
16. **Já:** odstraním `src/integrations/lovable`, složku `drizzle/` a závislosti `@lovable.dev/cloud-auth-js`, `lovable-tagger` a drizzle.
17. Po 2 týdnech bez problémů smažeš projekt v Lovable Cloud.

## Rizika a jak je řešíme

- **`pg_cron` / `pg_net` se v migraci nezapnou** (migrace to jen zapíše jako varování): ověřím je zvlášť a případně je zapneme v dashboardu (Database → Extensions).
- **Push notifikace po přesunu nedorazí**: v telefonu zůstane starý odběr. Po přihlášení se zapnou znovu v Nastavení. Klíče VAPID zůstávají stejné.
- **E-maily od Supabase padají do spamu**: řeší vlastní SMTP přes Resend a ověřená doména `coach-hub.eu`.
- **Lovable po přesunu přepíše `client.ts`**: řeší odpojení Lovable od GitHubu (krok 15) a hook, který chrání `src/integrations/**`.
- **Free projekt se uspí**: během testování ho probudí každé otevření aplikace a cron každých 5 minut ho drží vzhůru. Před ostrým provozem Pro.

## Co bude potom jednodušší

- Změnu databáze napíšu, otestuji a nasadím sám. Žádné kopírování promptů do Lovable.
- Přístup k logům funkcí a databáze, takže chyby dohledám rychleji.
- Do budoucna druhý projekt pro vývoj (dev/prod), jako u 1 % Better, aby se změny nezkoušely na ostrých datech.
