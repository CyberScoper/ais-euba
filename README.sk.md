<p align="center">
  <img src="docs/readme/banner.svg" alt="Index — neoficiálny klient pre AIS2 Ekonomickej univerzity v Bratislave" width="100%">
</p>

<p align="center">
  <img alt="PWA, dá sa nainštalovať" src="https://img.shields.io/badge/PWA-installable-3a35a8?style=flat-square">
  <img alt="Node 20 a novší" src="https://img.shields.io/badge/Node-20%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white">
  <img alt="Express 4" src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white">
  <img alt="Čisté JavaScript, bez buildu" src="https://img.shields.io/badge/front--end-vanilla%20JS%2C%20no%20build-F7DF1E?style=flat-square&logo=javascript&logoColor=black">
  <img alt="Jazyky sk, ru, uk, en" src="https://img.shields.io/badge/i18n-sk%20%C2%B7%20ru%20%C2%B7%20uk%20%C2%B7%20en-0d6b64?style=flat-square">
  <img alt="Vlastný hosting" src="https://img.shields.io/badge/deploy-self--hosted-c2410c?style=flat-square">
  <img alt="Licencia MIT" src="https://img.shields.io/badge/licence-MIT-524d40?style=flat-square">
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <b>Slovenčina</b> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.uk.md">Українська</a> ·
  <a href="SECURITY.md">Bezpečnosť</a> ·
  <a href="deploy/">Nasadenie</a>
</p>

# Index

Neoficiálny klient pre **AIS2 Ekonomickej univerzity v Bratislave** (`ais2.euba.sk`): rozvrh, predmety
a známky, poplatky a správy na jednej obrazovke, ktorá sa v telefóne otvorí za sekundu. PWA s malým
Node serverom za ňou, stavaná na to, aby si ju človek hostoval sám — jedna inštancia pre jedného
človeka alebo pre skupinu ľudí, ktorí si dôverujú.

<p align="center">
  <img src="docs/readme/devices.png" alt="Týždenná mriežka na počítači s farebne oddelenými prednáškami a cvičeniami a ten istý účet v telefóne" width="100%">
</p>

## Čo to vie

- **Dnes** — hodina, ktorá práve prebieha, alebo tá najbližšia, koľko dlhujete a čo máte v schránke.
  Pred začiatkom semestra povie, kedy sa začína, namiesto prázdnej obrazovky.
- **Rozvrh** — na počítači celý týždeň v mriežke, v telefóne deň po dni. Prednášky a cvičenia majú
  každé svoju farbu; voľný deň ukáže najbližší deň, ktorý voľný nie je.
- **Predmety** — zapísané predmety, kredity, známky a vážený priemer, plus plán štúdia.
- **Financie a správy** — poplatky aj s variabilným symbolom a vedľa nich správy z AIS, pretože
  väčšina z nich je aj tak o platbách.
- **Univerzita** — praktické veci, ktoré v AIS nenájdete: doprava z internátov, jedálne, knižnica,
  predĺženie ISIC, školský e-mail.
- **Štyri jazyky** — slovenčina, ruština, ukrajinčina a angličtina, každý s vlastnými tvarmi
  čísloviek a dátumov. To, čo posiela samotný AIS (názvy predmetov, kategórie správ), zostáva po
  slovensky a aplikácia to povie nahlas.
- **Dá sa nainštalovať** — je to skutočná PWA: sama ponúkne inštaláciu, obal funguje aj offline a
  údaje zámerne nie, lebo známka z cache je nesprávna známka.

<p align="center">
  <img src="docs/readme/screens.png" alt="Dnes, rozvrh, univerzitná príručka a tmavý motív v telefóne" width="100%">
</p>

## Ako to funguje

AIS nemá verejné API a jeho CORS politika vylučuje volať ho priamo z prehliadača. Toto je preto
**proxy na serveri** — nie rozšírenie do prehliadača a nie nástroj typu „vlož sem svoju cookie“:

<p align="center">
  <img src="docs/readme/flow.svg" alt="PWA hovorí s týmto Node serverom, ktorý drží AIS session a číta ais2.euba.sk" width="100%">
</p>

Prihlasovacia reťaz je tá istá, akú používa oficiálna Angular SPA: POST na `/ais/login.do` pre
`JSESSIONID`, token z `/ais/rest/apps/get-access-token` a potom každé REST volanie s oboma. Server si
token obnoví, keď zostarne, a prihlási sa znova najviac raz za minútu.

Vaše heslo do AIS slúži na prihlásenie a potom žije **v pamäti servera**. Ak zaškrtnete „zostať
prihlásený“, uloží sa navyše zašifrované cez AES-256-GCM do stavového adresára, s kľúčom v súbore
`0600` vedľa neho. To chráni pred ukradnutou zálohou, nie pred niekým, kto sa k stroju dostal — a
prihlasovacia obrazovka to povie presne takto, skôr než začnete písať.

### Slušný klient

Všetko, čo ide hore, prechádza jedným regulátorom: minimálny odstup medzi volaniami, strop za minútu,
jitter, zlúčenie identických súbežných čítaní do jedného a cache s vlastnou životnosťou pre každý
endpoint (rozvrh vydrží pätnásť minút). Opakované neúspešné prihlásenia zastaví poistka vedená pre
každý účet zvlášť, pretože práve mlátenie do zlého hesla je to, čo účet v AIS zablokuje.

## Spustenie

```bash
npm install
AIS_MOCK=1 npm start     # demo údaje, AIS účet netreba — http://localhost:4173
npm start                # naostro, prihlásenie údajmi do AIS2
```

Na serveri spraví všetko `deploy/deploy.sh` — systemd unit, nginx vhost, Let's Encrypt:

```bash
DOMAIN=ais.example.com LE_EMAIL=vy@example.com deploy/deploy.sh
```

Aplikácia počúva len na localhoste; TLS ukončite pred ňou.

| Premenná | Predvolené | Čo to je |
| --- | --- | --- |
| `PORT` | `4173` | port, na ktorom počúva |
| `AIS_BASE` | `https://ais2.euba.sk` | AIS, na ktorý sa chodí |
| `AIS_LNG` | `SK` | jazyk, v ktorom AIS odpovedá |
| `AIS_SECRET` | — | kľúč na zapečatenie zapamätaných hesiel (64 hex znakov alebo heslo); inak sa vygeneruje súbor s kľúčom |
| `AIS_STATE_DIR` | `/var/lib/ais-pwa` | kde žijú session a ten kľúč |
| `AIS_SESSION_DAYS` | `30` | ako dlho vydrží zapamätaná session |
| `AIS_GA_ID` | — | id analytiky pre túto inštanciu, ak ju vôbec chcete |
| `AIS_MOCK` | — | `1` beží na demo údajoch a AIS sa nedotkne |
| `AIS_RAW` | — | `1` zapne read-only passthrough na kalibráciu adaptérov; nechajte vypnuté |

## Čo kde je

```
server/aisClient.js     prihlasovacia reťaz AIS, REST a normalizácia odpovedí
server/security.js      hlavičky, limity, kontrola pôvodu, bezpečnosť ciest
server/guard.js         regulátor, zlučovanie volaní, cache, poistka na prihlasovanie
server/sessionStore.js  session na disku a zapečatené heslo za „zostať prihlásený“
server/index.js         express: session, čisté /api/*, statické súbory
public/                 samotná PWA — bez buildu, bez frameworku, bez bundlera
public/i18n.js          každá veta v štyroch jazykoch, s pravidlami pre čísla
scripts/handbook/       zdroje pre obrazovku Univerzita; public/handbook.js sa generuje
```

## Bezpečnosť

- session cookie je `HttpOnly`, `SameSite=Lax`, `Secure`, 192 bitov entropie, posúvajúca sa platnosť;
  požiadavky z iného pôvodu, ktoré menia stav, sú odmietnuté rovno;
- prísna Content-Security-Policy s `frame-ancestors 'none'` a bez jediného inline skriptu;
- `Cache-Control: no-store` na každej odpovedi API;
- limity podľa IP pred API a prísnejší pred prihlasovacím formulárom;
- passthrough povoľuje cesty do AIS **po jednej** a odmietne čokoľvek s `..` — AIS má deštruktívne
  operácie dostupné cez obyčajný `GET`, takže zakázať sloveso by nestačilo;
- zachytené reálne odpovede z AIS (na offline QA) sú v `.gitignore` a nikdy neboli commitnuté.

Našli ste dieru? Pozri [SECURITY.md](SECURITY.md).

## Čo to nie je

**Nie je to projekt univerzity, nie je ňou schválený ani s ňou nijako spojený.** Číta tie isté údaje
ako oficiálny klient AIS2, vašimi prihlasovacími údajmi, na serveri, ktorý ovládate vy, a nikdy do
AIS nič nezapisuje: každé volanie je čítanie.

Obrazovka Univerzita je snímka verejných stránok Študentského parlamentu prepísaná vlastnými slovami,
s odkazom na zdroj a dátumom poslednej kontroly na každej karte. Nie je to zrkadlo textu univerzity a
ak sa oboje rozchádza, platia stránky univerzity.

Ak server neprevádzkujete sami, zverujete svoje univerzitné heslo tomu, kto ho prevádzkuje. To je
reálna cena a poctivá rada znie: hostujte si to sami.

## Licencia

MIT — pozri [LICENSE](LICENSE). Snímky obrazoviek a obrázky v `public/photos/` vznikli pre tento
projekt a platí pre ne tá istá licencia.
