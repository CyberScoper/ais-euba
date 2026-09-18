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
3. Каждый вызов `/ais/rest/portal/*` несёт `Cookie: JSESSIONID` + заголовок `AISAuth` + `?lng=SK`.
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
| `AIS_ROZVRH_PATH` | `rozvrh/student` | путь эндпоинта расписания, см. ниже |

## Калибровка адаптеров — обязательный шаг

Пути эндпоинтов вытащены из бандла `student/main.js`, но **JSON-схемы ответов не проверены
на живой сессии** — на момент сборки рабочей сессии не было. Поэтому `normalize*` в
`aisClient.js` подбирают поля защитно (`nazov` / `nazovPredmetu` / `name` …) и всегда
кладут исходный объект в `raw`.

Порядок калибровки после первого успешного логина:

```bash
# посмотреть сырой ответ любого portal-эндпоинта
curl -s --cookie "sid=<ваш sid>" 'http://localhost:4173/api/raw/studium/list' | jq .
curl -s --cookie "sid=<ваш sid>" 'http://localhost:4173/api/raw/portal/osoba/poplatky' | jq .
```

Дальше поправить соответствующий `normalize*` под реальные имена полей.

**Расписание — главная неизвестная.** Бандл приложения `/ais/apps/rozvrh/` скачать не
удалось, поэтому путь `rozvrh/student` — предположение. Найти настоящий можно так:
открыть `https://ais2.euba.sk/ais/apps/rozvrh/sk/`, в DevTools → Network отфильтровать
`rest/portal`, посмотреть реальный путь и положить его в `AIS_ROZVRH_PATH`.
Формат, который ждёт фронтенд: `{ day: 1..5, from: "08:00", to: "09:30", subject, type, room, teacher }`.

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

## Границы

- Приложение только читает. Ничего не записывает в AIS (записи на экзамены, зápis и т.п.).
- Один пользователь на инстанс — ставьте себе, а не «для всех».
