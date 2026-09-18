# AIS PWA — удобный клиент над AIS2 EUBA

Неофициальная PWA поверх `ais2.euba.sk`: расписание, предметы и оценки, платежи, сообщения.
Backend-прокси держит сессию AIS, фронтенд — мобильный PWA без сборки.

```
server/aisClient.js   цепочка авторизации AIS + REST + нормализация ответов
server/index.js       express: сессии, чистый /api/*, раздача статики
server/mock.js        демо-данные (AIS_MOCK=1)
public/               PWA: index.html, app.js, styles.css, sw.js, manifest, icons
```

## Запуск

```bash
npm install
AIS_MOCK=1 npm start          # демо на моках, localhost:4173
npm start                     # боевой режим, вход по логину/паролю EUBA
```

## Как устроена авторизация AIS

Реверс официального Angular-SPA. Никакого публичного API/OAuth у AIS нет, поэтому:

1. `POST /ais/login.do` (форма `login`, `password`, без CSRF) → ставит cookie `JSESSIONID`.
2. `POST /ais/rest/apps/get-access-token` с константным заголовком-обфускацией,
   который SPA зашивает в бандл → возвращает токен в **response-заголовке** `AISAuth`.
3. Каждый вызов `/ais/rest/*` несёт `Cookie: JSESSIONID` + заголовок `AISAuth` + `?lng=SK`.
4. Токен обновляется через `GET /ais/rest/apps/check-session/check-light`
   (свежий токен приходит в заголовке `aisAuth`). Клиент делает это лениво, раз в ~45 сек.
5. На `401` клиент сам перелогинивается, если креды ещё в памяти.

**Пароль нигде не пишется на диск.** Он живёт только в памяти процесса, чтобы молча
переподнимать сессию. Рестарт сервера = разлогин. Сессия PWA — httpOnly-cookie `sid`.

## Переменные окружения

| Переменная | По умолчанию | Смысл |
|---|---|---|
| `PORT` | `4173` | порт |
| `AIS_MOCK` | — | `1` — демо-данные, без обращения к AIS |
| `AIS_BASE` | `https://ais2.euba.sk` | база AIS |
| `AIS_LNG` | `SK` | язык ответов (`SK` / `EN`) |
| `AIS_ROZVRH_PATH` | `apps/rozvrh/data` | эндпоинт расписания |

## Эндпоинты AIS

API разбит на два namespace, и это важно: часть путей ещё и двойная (`portal/portal/...`).

| Наше | Путь AIS |
|---|---|
| расписание | `apps/rozvrh/data` |
| учебные группы | `apps/rozvrh/studijneSkupinyStudenta` |
| академ. годы / текущий | `apps/rozvrh/akademickeRoky`, `apps/rozvrh/aktualnyAkRok` |
| предметы, штудии | `portal/studium/list` |
| платежи | `portal/portal/osoba/poplatky` |
| сообщения | `portal/messages/list2` |
| профиль | `portal/users/info` |

Ещё есть, пока не используем: `portal/studium/dotazniky`, `portal/diskusia/list`,
`portal/flash/list`, `portal/pracovne-ponuky/list`, `portal/portal/zalozky`.

## Калибровка адаптеров

Пути подтверждены по живому network-логу, но **имена полей в JSON-ответах ещё не
сверены**. Поэтому `normalize*` в `aisClient.js` подбирают поля защитно
(`nazovPredmetu` / `predmet` / `subject` …) и всегда кладут исходный объект в `raw`.

После первого успешного логина:

```bash
curl -s --cookie "sid=<ваш sid>" 'http://localhost:4173/api/raw/apps/rozvrh/data' | jq .
curl -s --cookie "sid=<ваш sid>" 'http://localhost:4173/api/raw/portal/studium/list' | jq .
curl -s --cookie "sid=<ваш sid>" 'http://localhost:4173/api/raw/portal/portal/osoba/poplatky' | jq .
```

Дальше поправить соответствующий `normalize*` под реальные имена полей.
Формат, который ждёт фронтенд для расписания:
`{ day: 1..5, from: "08:00", to: "09:30", subject, code, type, room, teacher }`.

## Деплой на VPS

За nginx, HTTPS обязателен (cookie сессии ставится `Secure` при `x-forwarded-proto: https`):

```nginx
location / {
    proxy_pass http://127.0.0.1:4173;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Service worker кэширует только оболочку приложения; `/api/*` всегда идёт в сеть —
оценки и платежи из кэша показывать нельзя. При изменении фронтенда поднять `CACHE` в `sw.js`.

## Дизайн

Тёплая «бумага», один акцент индиго, жжёно-оранжевый зарезервирован под маркер «сейчас».
Тёмная тема настоящая (не инверсия), переключатель хранится в `localStorage`,
для QA и шаринга есть `?theme=dark` / `?theme=light`. Токены — в начале `styles.css`.
Контраст вторичного текста проверен: ≥4.8:1 в обеих темах.

Мотион держится в бюджете: переход между вкладками — 140 мс (это действие повторяется
весь день, ему положено быть почти незаметным), hover-движение закрыто
`@media (hover: hover)`, кривые взяты готовые, а не подобраны на глаз.
Единственная зацикленная анимация — пульс маркера «сейчас идёт». При
`prefers-reduced-motion` движение убирается, но не всё подряд: прозрачность и цвет остаются.

## Границы

- Приложение только читает. Ничего не записывает в AIS (записи на экзамены, zápis и т.п.).
- Один пользователь на инстанс — ставьте себе, а не «для всех».
