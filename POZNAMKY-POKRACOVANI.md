# Poznámky k pokračování

## 2026-11-25 – oprava oprávnění bota (nasaženo na VPS)

### Příčina chyby „bot nemůže přidělit některá požadovaná oprávnění staff rolím“
1. `apps/bot/src/apply.ts` kontroloval oprávnění bota přes `permissions.bitfield`. To je surový bitfield, který se u **Administratora nerozšiřuje**, takže bot s Administratorom stejně „neměl“ `KickMembers`, `BanMembers` atd. a build zbytečně selhal. Nově se používá `permissions.has(requiredBits)`, které Administratora respektuje.
2. Instalační odkaz bota žádal jen 5 oprávnění. Discord nedovolí botovi rozdávat oprávnění, která sám nemá. `BOT_INSTALL_PERMISSIONS` teď obsahuje i všechna `STAFF_EXTRA_PERMISSIONS` (nová hodnota bitfieldu `12121904131222`).
3. Nahrazení (`replace`) už kvůli chybějícím staff oprávněním nezastaví celý job. Oprávnění se vynechají, stavba doběhne a uživatel dostane upozornění s výčtem.
4. Přidán preflight: když botovi chybí `Manage Channels` nebo `Manage Roles`, job hned selže s výčtem a odkazem na nové pozvání; kredity se vrátí.
5. `presence.ts`: při 0 serverech dělal `update` bez `where`, což Supabase odmítá. Nově filtruje `.eq("bot_present", true)`.

### Nasazení
- VPS: `ubuntu@130.162.222.219`, klíč `C:\Users\hry15\.ssh\opencode_key`, projekt `/opt/ohnivo-bot`.
- Nahrány celé `packages/shared/src/*.ts` a `apps/bot/src/*.ts` (VPS měl starší shared bez `withEmojiPrefix`), potom `docker compose -p ohnivo-bot up -d --build`.
- Zálohy na VPS: `apps/bot/src/apply.ts.bak-20261125` a `packages/shared/src/permissions.ts.bak-20261125`.
- Ověřeno: kontejner `Up`, log `Logged in as Ohnivo#7862`, žádná chyba presence.

### Stav a co dál
- Bot teď **není na žádném serveru** (`GET /users/@me/guilds` → `[]`). Je potřeba ho znovu pozvat novým odkazem:
  `https://discord.com/oauth2/authorize?client_id=1574864974038433857&scope=bot+applications.commands&permissions=12121904131222&guild_id=1574800398135336970&disable_guild_select=true`
- Admin oprávnění není potřeba, nový odkaz obsahuje všechna staff oprávnění. Kdo na serveru nemá „Spravovat server“, musí pozvání udělat majitel.
- Web, který generuje tlačítko „Znovu pozvat bota“, je potřeba po změně `packages/shared` také přenasadit, jinak tlačítko používá starý odkaz. Nový odkaz výše funguje nezávisle na webu.
- Před dalším `replace` na skutečném serveru vyzkoušet na testovacím.

### Hierarchie rolí (druhá chyba, 2026-11-25)
- Po opravě oprávnění přišla chyba `4 rolí je na stejné nebo vyšší pozici než nejvyšší role bota`. To je Discord limit, který **Administrator neobejde**.
- Stav na ValleyCube: role `Ohnivo` je na pozici 1 (nejníž), staré role `Člen` (4), `Helper` (3), `Moderátor` (2), `Stavitel` (1) jsou nad ní. Replace proto nemůže staré role smazat.
- Řešení je ruční: Discord → Nastavení serveru → Role → přetáhnout `Ohnivo` nad `Člen` (na vrchol seznamu vlastních rolí), potom replace spustit znovu.
- Bot teď v replace režimu dělá preflight hierarchie a dostupnosti kanálů **ještě před vytvářením čehokoli**; chyba vypíše názvy konkrétních rolí/kanálů a návod. Notifikace o selhání nově obsahuje i konkrétní důvod.
- Web: na stránce Server je nový hint `roleHierarchyTitle` / `roleHierarchyBody` a upravený text o oprávněních.

### NVIDIA AI (2026-11-25)
- Klíč `nvapi-...` funguje: `GET https://integrate.api.nvidia.com/v1/models` vrací 200 a 30 modelů.
- Chyba „AI teď neodpovídá“ byla kvůli modelu: `meta/llama-3.1-8b-instant` vrací 404 (neexistuje) a `meta/llama-3.1-8b-instruct` je EOL (410).
- Otestováno s reálným promptem: `nvidia/nemotron-3.5-bolt-e4b` vrátil platný JSON za ~18 s (4 kategorie, 3 role, 0 zahozených oprávnění). `nemotron-3.5-lightning-30b-a3b` spálí tokeny na `reasoning_content` a vrátí prázdný `content`; `mistral-large-4-1t-a52b` je pomalý (40 s i na triviální dotaz); `glm-5.3-flash` skončil 504 po 5 min.
- Změny: `DEFAULT_NVIDIA_MODEL = nvidia/nemotron-3.5-bolt-e4b` v `lib/env.ts`, timeout 120 s a kontrola prázdného `content` v `lib/ai/nvidia.ts`, úprava `.env.example` a admin stránky.
- Po změně je potřeba restartovat web (`npm run dev`), aby se načetl nový default. Případný `NVIDIA_MODEL` v env má přednost.

### Staff oprávnění u českých názvů rolí (2026-11-25)
- Uživatel nechal AI přidat kompletní Minecraft hierarchii od `Majitel` po `Hráč`. AI dala `Majitel`ovi `MANAGE_MESSAGES`, `KICK_MEMBERS`, `BAN_MEMBERS`, ale UI je vypsalo jako „Odebratá oprávnění“.
- Příčina: `isStaffRoleName` v `packages/shared/src/permissions.ts` znalo `owner`, `admin`, `moderátor`, `helper`, ale ne české `majitel`, `vlastník`, `zakladatel`, `šéf`, `ředitel`. Role proto spadla do běžných rolí a staff oprávnění se zahodila.
- Oprava: názvy se normalizují bez diakritiky a pattern obsahuje české i anglické varianty (`majitel|vlastnik|zakladatel|reditel|sef|owner|founder|…`). Přidány testy, celkem 24 testů prochází.
- Stejná heuristika se používá i pro `permissionOverwrites` kanálů, takže se oprava projeví i tam.
- Akce pro uživatele: restartovat web (`npm run dev`) a nechat blueprint znovu vygenerovat/upřesnit. Už vygenerovaný blueprint má oprávnění už zahozená a sám se neopraví.
- Ověřeno na reálném provozu (job `8ffa4a7f`, 2026-11-25 08:07 UTC): nový blueprint má `removed_permissions: []` a role `Founder`/`Vedení`/`Moderátor` mají `MANAGE_MESSAGES`, `KICK_MEMBERS`, `MUTE_MEMBERS`. Oprava tedy funguje; text „Odebratá oprávnění“ v UI patřil staršímu blueprintu s rolí `Majitel`.
- Replace ověřen stejným jobem: cleanup smazal 13 původních kanálů a 7 rolí (audit log Discord, reason `Ohnivo apply`) a na serveru zůstala jen nová struktura. Během stavby stará a nová struktura krátce existují vedle sebe, protože úklid běží až jako poslední krok.

### Starý server s Ultiz obsahem (2026-11-25)
- Uživatel má **dva servery pojmenované ValleyCube**:
  - `1574800398135336970` – nový testovací, bot tam staví a replace funguje.
  - `778212774789513216` – původní server (owner `643516759680221187`), obsah tam vytvořil bot **Ultiz** (`1483371551163154532`, už na serveru není).
- Na starém serveru bot roli `Ohnivo` na pozici 1. 16 rolí (`Admin`, `Moderator`, `Champion`, `Veteran`, `Active`, `Member`, `Birthday`, `PC`, `PlayStation`, `Xbox`, `Switch`, `Mobile`, `News`, `LFG`, `Events`) je na stejné pozici a `👑Majitel` na pozici 39 → preflight replace správně zastavil job **před smazáním** s hláškou o hierarchii. Na starém serveru tedy zatím nezmizelo nic.
- Zbytkové role, které nejde smazat žádným botem, jsou **managed role integrací**: `Tebex`, `Dyno`, `Ticket Tool`, `Musico`, `Server Booster`, `TFC`, `Nameless Link`, `Discohook Utils`, `Discobot`, `CrafMaga`, `Minecraft Server Status`. Řešení je odebrat dané boty/integrace v Discord → Nastavení serveru → Integrace; samotná role Ultiz tam už není.
- Postup: přetáhnout `Ohnivo` nad `👑Majitel`, znovu spustit replace. Nahrazení pak smaže i `👑Majitel` a všech 16 rolí – pokud si je chce uživatel nechat, musí je po stavbě vrátit nebo mazat ručně.
- Grafický průvodce: nová komponenta `apps/web/components/ai/role-hierarchy-guide.tsx` se zobrazí na apply stránce, když chyba obsahuje hierarchii rolí. Vizuál je záměrně ve stylu Discordu – server rail `#111214`, panel `#2b2d31`, červené role nad botem, zelená role bota, šipka „přetáhni sem“, 3 kroky a odkazy. Texty v `messages/cs.json` a `en.json` pod `ai.apply.roleGuide`. `npm run build:web` prošel.
- Animace: klon role `Ohnivo` se v mocku rozjede ze své pozice nahoru nad červené role, chvíli tam podrží, zmizí a smyčka se opakuje (4,8 s). Vzdálenost se měří v JS (`offsetTop` zdrojové a cílové řady), samotný pohyb je v `globals.css` (`@keyframes role-drag`, `role-drag-clone`, `role-drag-source`). Při `prefers-reduced-motion` se animace vypne a zůstane statický stav.
- Lokalizace chyb: bot generuje chyby podle locale guildy (`cs`), takže EN dashboard ukazoval český text. `apps/web/lib/apply-errors.ts` parsuje známé preflight chyby nahrazení v CS i EN a `apply-progress.tsx` je překládá přes `ai.apply.failure` do jazyka UI. Týká se hierarchie rolí, kanálů bez `Manage Channels` a chybějícího `Manage Roles`; neznámé chyby se zobrazí beze změny. Ověřeno `npx tsx` (parser i ICU plurály) a `npm run build:web`.

## Co se teď opravilo

- Režim `replace` před mazáním staré struktury ověří oprávnění bota ke správě všech cílových kanálů a rolí i hierarchii rolí. Když kontrola neprojde, nic starého se nesmaže, nová struktura se uklidí a job se může vrátit/refundovat.
- Pokud mazání staré struktury selže až po jeho zahájení, job už nebude označen jako úspěšný. Chyba ukáže počty a několik názvů nesmazaných objektů; nová struktura zůstane zachovaná a kredit se automaticky nevrací.
- Emoji kategorií a kanálů se ukládají v blueprintu, lze je upravit v editoru a bot je použije v názvech na Discordu. Režim `merge` pozná názvy s emoji i bez nich.
- Demo návrh pro Minecraft je rozšířen na 4 kategorie a 17 kanálů s tematickými emoji.
- V rootu není spuštěný žádný nový Discord job; uživatelský server se znovu nemazal.

## Ověření

- `npm test`: prošlo, 22 testů.
- `npm run typecheck`: prošlo.
- Build webu a bota prošel. První pokus web buildu selhal na dočasné chybě Next.js `PageNotFoundError`; opakovaný `npm run build:web` už prošel.
- `git diff --check`: bez chyb whitespace; Git pouze upozorňuje na převod LF/CRLF.

## Co zůstává

1. Nasadit aktualizovaný web; worker bota už byl znovu nasazen 2026-11-25 a ověřen. Změny nejdřív otestovat na testovacím serveru. Před novým mazacím pokusem na skutečném serveru vyžádat čerstvé potvrzení.
2. Pokud preflight zastaví nahrazení, zkontrolovat, zda má bot `Manage Channels` a `Manage Roles` a zda je jeho nejvyšší role nad rolemi určenými ke smazání. Nastavení serveru měnit jen po dohodě s uživatelem.
3. Zjistit, zda uživatel pod „obrázky“ myslí emoji u kategorií/kanálů, nebo skutečně generované ikony, banner či obrázky do zpráv. Generování obrázků a nahrání ikony/banneru zatím implementované není; v UI jsou tyto assety označené jako „Soon“.
4. Ověřit, zda má aplikace aktivního skutečného AI providera. Bez NVIDIA/Anthropic klíče nebo při `AI_PROVIDER=mock` se použije demo provider; tomu odpovídá i rozšířený Minecraft návrh.
5. Kódový snapshot je commitnutý a pushnutý na GitHub. `POZNAMKY-POKRACOVANI.md` zůstává lokální a záměrně není v GitHubu, protože obsahuje provozní informace.

## Přístup na VPS pro pokračování přes OpenCode

- Repo je lokálně `D:\discord-bot`. Ohnivo worker na VPS je oddělená Docker Compose služba/projekt `ohnivo-bot`; jeho adresář je `/opt/ohnivo-bot`. Původní Minecraft bot (`valleycube-bot`) je samostatný a nesmí se měnit.
- Užitečné kontroly na VPS:
  - `cd /opt/ohnivo-bot && docker compose -p ohnivo-bot ps`
  - `cd /opt/ohnivo-bot && docker compose -p ohnivo-bot logs --no-color --tail 30 bot`
- Na tomto Windows profilu byly nalezeny SSH soubory `C:\Users\hry15\.ssh\opencode_key` (privátní klíč) / `opencode_key.pub` a `oci_recovery` / `oci_recovery.pub`. Z poznámek není ověřeno, který klíč je autorizovaný pro VPS; před připojením ověř existující OpenCode/SSH konfiguraci a nepředpokládej klíč ani host.
- SSH privátní klíč záměrně není zkopírován do tohoto souboru ani do repozitáře. Neposílej jeho obsah, passphrase, bot tokeny ani Supabase klíče modelu/chatu; pokud OpenCode běží pod stejným Windows účtem, použij klíč lokálně přes SSH klienta. Pokud potřebuješ klíč sdílet s jiným prostředím, nejdřív domluv bezpečný způsob přístupu s uživatelem, neukládej ho do poznámek.
- Známá historie nasazení: Ohnivo už bylo nasazeno jako samostatný kontejner na VPS (ARM64, Node 22 image), bez publikovaných portů. Konfigurace s tajnými proměnnými je na VPS v `/opt/ohnivo-bot/.env` s oprávněními `600`; obsahuje Supabase URL a service-role key (`SUPABASE_SERVICE_ROLE_KEY`). Lokální web má Discord token v ignorovaném `apps/web/.env.local`. Hodnoty klíčů záměrně nejsou v poznámkách: načítej je pouze přímo z příslušného env souboru na důvěryhodném stroji a nikdy je nevypisuj do logů, chatu ani Git.
- Supabase CLI access token je uložen mimo tento repozitář v `D:\node\SUPABASE_ACCESS_TOKEN.txt`. Je to tajná hodnota: nepoužívej `type`/`Get-Content`, nevkládej obsah do promptu ani ho neposílej DeepSeeku/OpenCode chatu. Pokud bude potřeba autentizace Supabase CLI, použij token lokálně bezpečným způsobem bez jeho zobrazení; tento CLI token není totéž co runtime `SUPABASE_SERVICE_ROLE_KEY`.
- Přesná SSH adresa/uživatelské jméno/alias nejsou v těchto poznámkách ověřené. Zjisti je z existující lokální SSH/OpenCode konfigurace nebo od uživatele. Nepokoušej se o restart, redeploy ani mazací akce na Discordu bez odpovídajícího potvrzení.

## Důležité upozornění

Předchozí nahrazení uživatelského serveru bylo označeno jako dokončené, ale uživatel hlásí, že původní obsah zůstal. Příčina nebyla potvrzena. Neopakovat mazání bez nového potvrzení; nejprve nasadit opravu a zkontrolovat výsledek a oprávnění bota.

## 2026-11-25 – refundace, nasazení workeru a GitHub

### Lokalizace chyb
- Worker nyní bere jazyk uživatele z `users.locale`, aby selhání jobů odpovídalo nastavení uživatele, ne locale guildy.
- Překlady CS/EN pokrývají známé chyby preflightu (hierarchie rolí, chybějící oprávnění, nedostupný server) a upozornění na omezené přepisy oprávnění či náhradní textový announcement kanál.
- Web rozpoznává i dříve uložené české chyby a zobrazuje jejich anglické varianty v EN rozhraní.

### Atomické vrácení kreditů
- Původní refundace mohla skončit nekonzistentně, protože označení jobu jako vráceného a připsání kreditů probíhaly odděleně.
- `apps/bot/src/queue.ts` nyní používá atomickou a opakovatelnou RPC `refund_apply_job`; při chybě refundace worker chybu zaznamená. `apps/bot/src/apply.ts` oznamuje, zda refundace proběhla, selhala, nebo nebyla bezpečná po zahájení destruktivního cleanupu.
- Dashboard po dokončení jobu obnoví zobrazený zůstatek a upozorní, pokud očekávaná refundace chybí.
- Texty pro refundaci jsou doplněné v češtině i angličtině.

### Produkční migrace Supabase
- Cílový projekt `ohnivo` (`gstgrsceltgfjatqymda`, production) neměl evidovanou historii migrací, přesto už obsahoval schéma migrací 0001–0005.
- Před úpravou byly read-only ověřeny tabulky, RLS, potřebné kreditní/job funkce, realtime publikace a režim `replace`. Migrace 0001–0005 byly proto pouze doplněny do historie přes `migration repair`; jejich SQL se znovu nespouštělo.
- Dry-run potvrdil, že se bude aplikovat jen `0006_atomic_apply_refunds.sql`; migrace byla aplikována. RPC byla následně ověřena jako `SECURITY DEFINER`, spustitelná jen přes `service_role` (ne přes `anon` ani `authenticated`).

### Nasazení bota na VPS
- Před restartem nebyl žádný job ve stavu `queued` ani `running`.
- Na `/opt/ohnivo-bot` byly nahrány aktualizované zdrojové soubory bota a runtime moduly `packages/shared`, spolu s Dockerfile, bot manifestem a lockfile; `.env` na VPS zůstal nedotčený.
- Provedeno `docker compose -p ohnivo-bot build bot` a `up -d --force-recreate bot`. Kontejner zůstal `Up`, přihlášení k Discordu bylo potvrzeno a v kontrolovaném výpisu nebyly error/failed/fatal řádky.
- Stávající `valleycube-bot` nebyl měněn. Web nasazen nebyl.

### GitHub
- Vytvořen soukromý repozitář [`DeCrys/ohnivo-bot`](https://github.com/DeCrys/ohnivo-bot) a přes Git pushnut commit `313fbdb` (`feat: update Ohnivo app and atomic refunds`), 50 souborů.
- V commitu nejsou provozní poznámky, soubory `.env` ani Supabase CLI cache. Do `.gitignore` přidáno `supabase/.temp/`; sken běžných vzorů přístupových tokenů v publikovaném pracovním stromu nenašel shody.
- `POZNAMKY-POKRACOVANI.md` záměrně zůstala lokální a nebyla pushnuta.

### Ověření této aktualizace
- `npm run build:bot` prošel.
- `npm test`: 24 testů prošlo.
