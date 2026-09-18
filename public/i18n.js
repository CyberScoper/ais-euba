// Interface language: Slovak, Russian, Ukrainian.
//
// Three rules hold this file together:
//  1. Nothing in the UI is written in a template literal any more — every sentence
//     lives here, so a missing translation is visible as a missing key, not as a
//     Slovak sentence hiding inside a Russian screen.
//  2. Counts are arrays of three forms. Slovak and the two East Slavic languages
//     agree on the shape (one / few / many) but not on the rule, so the rule is
//     per language and the call site only passes the number.
//  3. Dates are built from tables here, not from toLocaleDateString: Russian and
//     Ukrainian need the genitive month ("18 сентября"), and every language needs
//     its own "in Monday" form, which Intl does not give.
//
// What stays Slovak on purpose: everything AIS itself sends — subject names, exam
// types, message categories, the university news feed. Translating those would mean
// guessing at the university's own wording, and the student has to recognise them in
// AIS anyway. The language menu says so out loud.

const STORE_KEY = 'lang';

export const LANGS = [
  { id: 'sk', short: 'SK', native: 'Slovenčina' },
  { id: 'ru', short: 'RU', native: 'Русский' },
  { id: 'uk', short: 'UA', native: 'Українська' },
];

const IDS = LANGS.map((l) => l.id);

// ---- dates -----------------------------------------------------------------
const CAL = {
  sk: {
    days: ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'],
    short: ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'],
    months: ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'],
    dayIn: ['v nedeľu', 'v pondelok', 'v utorok', 'v stredu', 'vo štvrtok', 'v piatok', 'v sobotu'],
    date: (d, m) => `${d}. ${m}`,
  },
  ru: {
    days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    short: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    dayIn: ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'],
    date: (d, m) => `${d} ${m}`,
  },
  uk: {
    days: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'],
    short: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    months: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
    dayIn: ['у неділю', 'у понеділок', 'у вівторок', 'у середу', 'у четвер', "у п'ятницю", 'у суботу'],
    date: (d, m) => `${d} ${m}`,
  },
};

// ---- strings ---------------------------------------------------------------
const SK = {
  'meta.title': 'Index — rozvrh a známky z AIS',
  'meta.desc': 'Rozvrh, predmety, známky, financie a správy z AIS EU v Bratislave — rýchlo a prehľadne.',

  'nav.dnes': 'Dnes',
  'nav.rozvrh': 'Rozvrh',
  'nav.predmety': 'Predmety',
  'nav.financie': 'Financie',
  'nav.spravy': 'Správy',

  'app.tagline': 'neoficiálny klient AIS',
  'app.updatedAt': 'Aktualizované o {t}',
  'app.loading': 'Načítavam…',
  'app.refresh': 'Obnoviť údaje',
  'app.theme': 'Motív',
  'app.themeToggle': 'Prepnúť motív',
  'app.logout': 'Odhlásiť',
  'app.menu': 'Nastavenia',
  'app.language': 'Jazyk',
  'app.langNote': 'Názvy predmetov, správy a novinky prichádzajú z AIS po slovensky.',
  'app.lastLogin': 'naposledy {t}',
  'app.nameday': '{name} má meniny',

  'greeting.night': 'Dobrú noc',
  'greeting.morning': 'Dobré ráno',
  'greeting.day': 'Dobrý deň',
  'greeting.evening': 'Dobrý večer',

  'login.title': 'Rozvrh, predmety a financie z AIS na jednej obrazovke',
  'login.sub': 'Prihlásite sa tými istými údajmi ako do AIS2 Ekonomickej univerzity. Vidíte presne to, čo v AIS — len rýchlejšie a v telefóne.',
  'login.user': 'Používateľ',
  'login.password': 'Heslo',
  'login.remember': 'Zostať prihlásený na tomto zariadení',
  'login.submit': 'Prihlásiť sa',
  'login.submitting': 'Prihlasujem…',
  'login.trust.notUni': '<b>Toto nie je stránka univerzity.</b> Neoficiálny klient beží na súkromnom serveri, nie na euba.sk.',
  'login.trust.direct': '<b>Údaje idú priamo do AIS2.</b>',
  'login.trust.openAis': 'Otvoriť oficiálny AIS',
  'login.pw.on': '<b>Heslo ostane na serveri zašifrované</b>, aby ste sa nemuseli prihlasovať po každom reštarte. Kľúč leží na tom istom serveri, takže to chráni pred ukradnutou zálohou, nie pred niekým, kto sa k serveru dostane. Odhlásením ho vymažete.',
  'login.pw.off': '<b>Heslo sa neukladá na disk.</b> Drží sa len v pamäti servera, takže po jeho reštarte sa prihlásite znova.',
  'login.expired': 'Prihlásenie vypršalo. Prihláste sa znova.',
  'login.err.blocked': 'Príliš veľa neúspešných pokusov. Prihlasovanie je na 15 minút pozastavené, aby sa účet v AIS nezablokoval.',
  'login.err.missing': 'Zadajte meno aj heslo.',
  'login.err.wrong': 'Nesprávne meno alebo heslo. Sú to tie isté údaje ako do AIS2.',
  'login.err.ais': 'AIS teraz neodpovedá. Skúste o chvíľu — nie je to vaším heslom.',
  'login.err.generic': 'Prihlásenie zlyhalo. Skúste to znova.',

  'today.live': 'Práve prebieha',
  'today.next': 'Ďalšia hodina',
  'today.atTime': 'o {t}',
  'today.semStarts': '{title} sa začína {when}',
  'today.inDays': ['o {n} deň', 'o {n} dni', 'o {n} dní'],
  'today.firstLesson': 'prvá hodina {dayIn} o {t}',
  'today.done': 'Dnešné hodiny máte za sebou',
  'today.none': 'Dnes žiadne hodiny',
  'today.nearest': 'Najbližšia {when} o {t}',
  'today.headingToday': 'Dnes',
  'today.headingNext': 'Najbližšia hodina',
  'today.freeDay': 'Voľný deň',
  'today.freeDaySub': 'Na dnes nemáte žiadne hodiny.',
  'today.moreThatDay': ['+ {n} ďalšia hodina v ten deň', '+ {n} ďalšie hodiny v ten deň', '+ {n} ďalších hodín v ten deň'],
  'today.news': 'Z univerzity',
  'today.oweNothing': 'Nič nedlhujete',
  'today.unpaid': ['{n} nezaplatená položka', '{n} nezaplatené položky', '{n} nezaplatených položiek'],
  'today.inbox': ['správa v schránke', 'správy v schránke', 'správ v schránke'],
  'today.inboxEmpty': 'prázdna schránka',

  'period.week': '{n}. týždeň',
  'period.left': ['zostáva {n} deň', 'zostávajú {n} dni', 'zostáva {n} dní'],

  'sched.validFrom': 'Rozvrh platí od {d}',
  'sched.freeDayFor': '{dayIn} nemáte v rozvrhu žiadnu hodinu.',
  'sched.showDay': 'Ukázať {day}',
  'sched.nextWithLessons': 'najbližší deň s hodinami',

  'subj.noGrades': 'Zatiaľ bez známok',
  'subj.noGradesSub': 'Zapísaných {subjects} za {credits}. Hodnotenia sa v AIS objavia počas skúškového obdobia.',
  'subj.subjects': ['{n} predmet', '{n} predmety', '{n} predmetov'],
  'subj.credits': ['{n} kredit', '{n} kredity', '{n} kreditov'],
  'subj.examFrom': '{title} od {d}',
  'subj.creditsEarned': 'kreditov získaných',
  'subj.gpa': 'vážený priemer',
  'subj.graded': 'ohodnotených',
  'subj.exams': 'Skúšky',
  'subj.terms': ['{n} termín', '{n} termíny', '{n} termínov'],
  'subj.exam': 'Skúška',
  'subj.seats': 'miest',
  'subj.semester': 'Semester',
  'subj.plan': 'Plán štúdia',
  'subj.none': 'Žiadne predmety',
  'subj.pending': 'zatiaľ bez hodnotenia',
  'subj.cr': 'kr.',
  'subj.planUnavailable': 'Plán nie je dostupný',
  'subj.year': '{n}. ročník',

  'pay.none': 'Žiadne poplatky',
  'pay.noneSub': 'AIS vám zatiaľ nepredpísal žiadnu platbu. Keď pribudne školné alebo poplatok za prihlášku, uvidíte ho tu aj s variabilným symbolom.',
  'pay.due': 'Na úhradu',
  'pay.allPaid': 'Všetko uhradené',
  'pay.items': ['{n} položka', '{n} položky', '{n} položiek'],
  'pay.historySettled': '{items} v histórii, všetky vyrovnané',
  'pay.item': 'Poplatok',
  'pay.paid': 'Uhradené',
  'pay.dueDate': 'Splatnosť {d}',

  'msg.title': 'Správy',
  'msg.none': 'žiadne',
  'msg.count': ['{n} správa', '{n} správy', '{n} správ'],
  'msg.emptyTitle': 'Prázdna schránka',
  'msg.emptySub': 'AIS vám zatiaľ neposlal žiadnu správu. Chodia sem oznamy o platbách, dokumentoch a termínoch.',
  'msg.notice': 'Oznam',
  'msg.noText': '(bez textu)',
  'msg.footnote': 'AIS pri správach neposiela odosielateľa ani príznak prečítania, preto ich tu nevidíte. Kliknutím sa správa otvorí priamo v AIS.',

  'err.offline': 'Ste offline',
  'err.offlineSub': 'Údaje ukážeme hneď, ako sa spojenie vráti.',
  'err.ais': 'AIS neodpovedal',
  'err.aisSub': 'Údaje sa nepodarilo načítať. Býva to dočasné — AIS býva nedostupný v noci a počas odstávok.',
  'err.retry': 'Skúsiť znova',

  'common.subject': 'Predmet',
  'common.now': 'teraz {t}',
  'common.today': 'dnes',
  'common.tomorrow': 'zajtra',
};

const RU = {
  'meta.title': 'Index — расписание и оценки из AIS',
  'meta.desc': 'Расписание, предметы, оценки, финансы и сообщения из AIS Экономического университета в Братиславе — быстро и понятно.',

  'nav.dnes': 'Сегодня',
  'nav.rozvrh': 'Расписание',
  'nav.predmety': 'Предметы',
  'nav.financie': 'Финансы',
  'nav.spravy': 'Сообщения',

  'app.tagline': 'неофициальный клиент AIS',
  'app.updatedAt': 'Обновлено в {t}',
  'app.loading': 'Загружаю…',
  'app.refresh': 'Обновить данные',
  'app.theme': 'Тема',
  'app.themeToggle': 'Переключить тему',
  'app.logout': 'Выйти',
  'app.menu': 'Настройки',
  'app.language': 'Язык',
  'app.langNote': 'Названия предметов, сообщения и новости приходят из AIS по-словацки.',
  'app.lastLogin': 'последний вход {t}',
  'app.nameday': 'именины: {name}',

  'greeting.night': 'Доброй ночи',
  'greeting.morning': 'Доброе утро',
  'greeting.day': 'Добрый день',
  'greeting.evening': 'Добрый вечер',

  'login.title': 'Расписание, предметы и финансы из AIS на одном экране',
  'login.sub': 'Вход теми же логином и паролем, что и в AIS2 Экономического университета. Видите ровно то же, что в AIS, — только быстрее и с телефона.',
  'login.user': 'Пользователь',
  'login.password': 'Пароль',
  'login.remember': 'Оставаться в системе на этом устройстве',
  'login.submit': 'Войти',
  'login.submitting': 'Вхожу…',
  'login.trust.notUni': '<b>Это не сайт университета.</b> Неофициальный клиент работает на частном сервере, а не на euba.sk.',
  'login.trust.direct': '<b>Данные уходят прямо в AIS2.</b>',
  'login.trust.openAis': 'Открыть официальный AIS',
  'login.pw.on': '<b>Пароль останется на сервере в зашифрованном виде</b>, чтобы не входить заново после каждого перезапуска. Ключ лежит на том же сервере, так что это защита от украденной резервной копии, а не от того, кто получил доступ к серверу. При выходе пароль удаляется.',
  'login.pw.off': '<b>Пароль не сохраняется на диск.</b> Он живёт только в памяти сервера, поэтому после перезапуска придётся войти заново.',
  'login.expired': 'Сессия истекла. Войдите снова.',
  'login.err.blocked': 'Слишком много неудачных попыток. Вход приостановлен на 15 минут, чтобы аккаунт в AIS не заблокировали.',
  'login.err.missing': 'Введите логин и пароль.',
  'login.err.wrong': 'Неверный логин или пароль. Это те же данные, что и для AIS2.',
  'login.err.ais': 'AIS сейчас не отвечает. Попробуйте чуть позже — дело не в пароле.',
  'login.err.generic': 'Войти не удалось. Попробуйте ещё раз.',

  'today.live': 'Сейчас идёт',
  'today.next': 'Следующая пара',
  'today.atTime': 'в {t}',
  'today.semStarts': '{title} начинается {when}',
  'today.inDays': ['через {n} день', 'через {n} дня', 'через {n} дней'],
  'today.firstLesson': 'первая пара {dayIn} в {t}',
  'today.done': 'Сегодняшние пары уже позади',
  'today.none': 'Сегодня пар нет',
  'today.nearest': 'Ближайшая {when} в {t}',
  'today.headingToday': 'Сегодня',
  'today.headingNext': 'Ближайшая пара',
  'today.freeDay': 'Свободный день',
  'today.freeDaySub': 'На сегодня пар нет.',
  'today.moreThatDay': ['+ ещё {n} пара в тот день', '+ ещё {n} пары в тот день', '+ ещё {n} пар в тот день'],
  'today.news': 'Из университета',
  'today.oweNothing': 'Задолженностей нет',
  'today.unpaid': ['{n} неоплаченная позиция', '{n} неоплаченные позиции', '{n} неоплаченных позиций'],
  'today.inbox': ['сообщение', 'сообщения', 'сообщений'],
  'today.inboxEmpty': 'входящие пусты',

  'period.week': '{n}-я неделя',
  'period.left': ['остался {n} день', 'осталось {n} дня', 'осталось {n} дней'],

  'sched.validFrom': 'Расписание действует с {d}',
  'sched.freeDayFor': '{dayIn} пар в расписании нет.',
  'sched.showDay': 'Показать {day}',
  'sched.nextWithLessons': 'ближайший день с парами',

  'subj.noGrades': 'Пока без оценок',
  'subj.noGradesSub': 'Записано {subjects} на {credits}. Оценки появятся в AIS во время экзаменационного периода.',
  'subj.subjects': ['{n} предмет', '{n} предмета', '{n} предметов'],
  'subj.credits': ['{n} кредит', '{n} кредита', '{n} кредитов'],
  'subj.examFrom': '{title} с {d}',
  'subj.creditsEarned': 'кредитов получено',
  'subj.gpa': 'средний балл',
  'subj.graded': 'с оценкой',
  'subj.exams': 'Экзамены',
  'subj.terms': ['{n} дата', '{n} даты', '{n} дат'],
  'subj.exam': 'Экзамен',
  'subj.seats': 'мест',
  'subj.semester': 'Семестр',
  'subj.plan': 'План обучения',
  'subj.none': 'Предметов нет',
  'subj.pending': 'пока без оценки',
  'subj.cr': 'кр.',
  'subj.planUnavailable': 'План недоступен',
  'subj.year': '{n}-й курс',

  'pay.none': 'Платежей нет',
  'pay.noneSub': 'AIS пока не выставил ни одного платежа. Когда появится плата за обучение или сбор за заявление, он будет здесь — вместе с переменным символом.',
  'pay.due': 'К оплате',
  'pay.allPaid': 'Всё оплачено',
  'pay.items': ['{n} позиция', '{n} позиции', '{n} позиций'],
  'pay.historySettled': '{items} в истории, все закрыты',
  'pay.item': 'Платёж',
  'pay.paid': 'Оплачено',
  'pay.dueDate': 'Срок до {d}',

  'msg.title': 'Сообщения',
  'msg.none': 'нет',
  'msg.count': ['{n} сообщение', '{n} сообщения', '{n} сообщений'],
  'msg.emptyTitle': 'Входящие пусты',
  'msg.emptySub': 'AIS пока не прислал ни одного сообщения. Сюда приходят уведомления о платежах, документах и сроках.',
  'msg.notice': 'Уведомление',
  'msg.noText': '(без текста)',
  'msg.footnote': 'AIS не передаёт ни отправителя, ни отметку о прочтении, поэтому их здесь нет. По нажатию сообщение откроется прямо в AIS.',

  'err.offline': 'Нет сети',
  'err.offlineSub': 'Покажем данные, как только связь вернётся.',
  'err.ais': 'AIS не ответил',
  'err.aisSub': 'Не удалось загрузить данные. Обычно это ненадолго — AIS бывает недоступен ночью и во время работ.',
  'err.retry': 'Попробовать снова',

  'common.subject': 'Предмет',
  'common.now': 'сейчас {t}',
  'common.today': 'сегодня',
  'common.tomorrow': 'завтра',
};

const UK = {
  'meta.title': 'Index — розклад і оцінки з AIS',
  'meta.desc': 'Розклад, предмети, оцінки, фінанси та повідомлення з AIS Економічного університету в Братиславі — швидко й зрозуміло.',

  'nav.dnes': 'Сьогодні',
  'nav.rozvrh': 'Розклад',
  'nav.predmety': 'Предмети',
  'nav.financie': 'Фінанси',
  'nav.spravy': 'Повідомлення',

  'app.tagline': 'неофіційний клієнт AIS',
  'app.updatedAt': 'Оновлено о {t}',
  'app.loading': 'Завантажую…',
  'app.refresh': 'Оновити дані',
  'app.theme': 'Тема',
  'app.themeToggle': 'Перемкнути тему',
  'app.logout': 'Вийти',
  'app.menu': 'Налаштування',
  'app.language': 'Мова',
  'app.langNote': 'Назви предметів, повідомлення та новини надходять з AIS словацькою.',
  'app.lastLogin': 'останній вхід {t}',
  'app.nameday': 'іменини: {name}',

  'greeting.night': 'Доброї ночі',
  'greeting.morning': 'Доброго ранку',
  'greeting.day': 'Добрий день',
  'greeting.evening': 'Добрий вечір',

  'login.title': 'Розклад, предмети та фінанси з AIS на одному екрані',
  'login.sub': 'Вхід тими самими логіном і паролем, що й до AIS2 Економічного університету. Бачите те саме, що в AIS, — тільки швидше й з телефона.',
  'login.user': 'Користувач',
  'login.password': 'Пароль',
  'login.remember': 'Залишатися в системі на цьому пристрої',
  'login.submit': 'Увійти',
  'login.submitting': 'Входжу…',
  'login.trust.notUni': '<b>Це не сайт університету.</b> Неофіційний клієнт працює на приватному сервері, а не на euba.sk.',
  'login.trust.direct': '<b>Дані йдуть прямо в AIS2.</b>',
  'login.trust.openAis': 'Відкрити офіційний AIS',
  'login.pw.on': '<b>Пароль залишиться на сервері зашифрованим</b>, щоб не входити заново після кожного перезапуску. Ключ лежить на тому ж сервері, тож це захист від викраденої резервної копії, а не від того, хто отримав доступ до сервера. Під час виходу пароль стирається.',
  'login.pw.off': '<b>Пароль не зберігається на диск.</b> Він живе лише в пам’яті сервера, тому після перезапуску доведеться увійти знову.',
  'login.expired': 'Сесія завершилася. Увійдіть знову.',
  'login.err.blocked': 'Забагато невдалих спроб. Вхід призупинено на 15 хвилин, щоб акаунт в AIS не заблокували.',
  'login.err.missing': 'Введіть логін і пароль.',
  'login.err.wrong': 'Неправильний логін або пароль. Це ті самі дані, що й для AIS2.',
  'login.err.ais': 'AIS зараз не відповідає. Спробуйте трохи згодом — річ не в паролі.',
  'login.err.generic': 'Увійти не вдалося. Спробуйте ще раз.',

  'today.live': 'Зараз триває',
  'today.next': 'Наступна пара',
  'today.atTime': 'о {t}',
  'today.semStarts': '{title} починається {when}',
  'today.inDays': ['через {n} день', 'через {n} дні', 'через {n} днів'],
  'today.firstLesson': 'перша пара {dayIn} о {t}',
  'today.done': 'Сьогоднішні пари вже позаду',
  'today.none': 'Сьогодні пар немає',
  'today.nearest': 'Найближча {when} о {t}',
  'today.headingToday': 'Сьогодні',
  'today.headingNext': 'Найближча пара',
  'today.freeDay': 'Вільний день',
  'today.freeDaySub': 'На сьогодні пар немає.',
  'today.moreThatDay': ['+ ще {n} пара того дня', '+ ще {n} пари того дня', '+ ще {n} пар того дня'],
  'today.news': 'З університету',
  'today.oweNothing': 'Заборгованості немає',
  'today.unpaid': ['{n} несплачена позиція', '{n} несплачені позиції', '{n} несплачених позицій'],
  'today.inbox': ['повідомлення', 'повідомлення', 'повідомлень'],
  'today.inboxEmpty': 'вхідні порожні',

  'period.week': '{n}-й тиждень',
  'period.left': ['залишився {n} день', 'залишилося {n} дні', 'залишилося {n} днів'],

  'sched.validFrom': 'Розклад діє з {d}',
  'sched.freeDayFor': '{dayIn} пар у розкладі немає.',
  'sched.showDay': 'Показати {day}',
  'sched.nextWithLessons': 'найближчий день із парами',

  'subj.noGrades': 'Поки без оцінок',
  'subj.noGradesSub': 'Записано {subjects} на {credits}. Оцінки з’являться в AIS під час екзаменаційного періоду.',
  'subj.subjects': ['{n} предмет', '{n} предмети', '{n} предметів'],
  'subj.credits': ['{n} кредит', '{n} кредити', '{n} кредитів'],
  'subj.examFrom': '{title} з {d}',
  'subj.creditsEarned': 'кредитів отримано',
  'subj.gpa': 'середній бал',
  'subj.graded': 'з оцінкою',
  'subj.exams': 'Іспити',
  'subj.terms': ['{n} дата', '{n} дати', '{n} дат'],
  'subj.exam': 'Іспит',
  'subj.seats': 'місць',
  'subj.semester': 'Семестр',
  'subj.plan': 'План навчання',
  'subj.none': 'Предметів немає',
  'subj.pending': 'поки без оцінки',
  'subj.cr': 'кр.',
  'subj.planUnavailable': 'План недоступний',
  'subj.year': '{n}-й курс',

  'pay.none': 'Платежів немає',
  'pay.noneSub': 'AIS поки не виставив жодного платежу. Коли з’явиться плата за навчання чи збір за заяву, він буде тут — разом зі змінним символом.',
  'pay.due': 'До сплати',
  'pay.allPaid': 'Усе сплачено',
  'pay.items': ['{n} позиція', '{n} позиції', '{n} позицій'],
  'pay.historySettled': '{items} в історії, усі закриті',
  'pay.item': 'Платіж',
  'pay.paid': 'Сплачено',
  'pay.dueDate': 'Термін до {d}',

  'msg.title': 'Повідомлення',
  'msg.none': 'немає',
  'msg.count': ['{n} повідомлення', '{n} повідомлення', '{n} повідомлень'],
  'msg.emptyTitle': 'Вхідні порожні',
  'msg.emptySub': 'AIS поки не надіслав жодного повідомлення. Сюди приходять сповіщення про платежі, документи та терміни.',
  'msg.notice': 'Сповіщення',
  'msg.noText': '(без тексту)',
  'msg.footnote': 'AIS не передає ні відправника, ні позначку про прочитання, тому їх тут немає. Після натискання повідомлення відкриється прямо в AIS.',

  'err.offline': 'Немає мережі',
  'err.offlineSub': 'Покажемо дані, щойно зв’язок повернеться.',
  'err.ais': 'AIS не відповів',
  'err.aisSub': 'Не вдалося завантажити дані. Зазвичай це ненадовго — AIS буває недоступний уночі та під час робіт.',
  'err.retry': 'Спробувати ще раз',

  'common.subject': 'Предмет',
  'common.now': 'зараз {t}',
  'common.today': 'сьогодні',
  'common.tomorrow': 'завтра',
};

const DICT = { sk: SK, ru: RU, uk: UK };

// ---- plurals ---------------------------------------------------------------
/**
 * Slovak: 1 / 2–4 / rest. Russian and Ukrainian: by the last digit, with the
 * teens (11–14) falling to the "many" form — 21 deň behaves like 1, 21 день too,
 * but 11 does not.
 */
function pluralIndex(lang, n) {
  const x = Math.abs(Math.trunc(Number(n) || 0));
  if (lang === 'sk') return x === 1 ? 0 : (x >= 2 && x <= 4 ? 1 : 2);
  const d = x % 10;
  const dd = x % 100;
  if (d === 1 && dd !== 11) return 0;
  if (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return 1;
  return 2;
}

// ---- current language ------------------------------------------------------
function detect() {
  const list = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (const raw of list) {
    const code = String(raw || '').toLowerCase().slice(0, 2);
    if (IDS.includes(code)) return code;
    // Belarusian and Kazakh speakers read Russian far more reliably than Slovak.
    if (code === 'be' || code === 'kk') return 'ru';
    if (code === 'cs') return 'sk';
  }
  return 'sk';
}

let current = null;

export function getLang() {
  if (current) return current;
  let saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch {}
  const forced = typeof location !== 'undefined'
    ? new URLSearchParams(location.search).get('lang')
    : null;
  current = IDS.includes(forced) ? forced : (IDS.includes(saved) ? saved : detect());
  return current;
}

export function setLang(id) {
  if (!IDS.includes(id)) return getLang();
  current = id;
  try { localStorage.setItem(STORE_KEY, id); } catch {}
  applyLangToDocument();
  return current;
}

/** html[lang], the tab title and the description, so a share or a bookmark matches. */
export function applyLangToDocument() {
  const lang = getLang();
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t('meta.desc'));
}

// ---- lookup ----------------------------------------------------------------
function interpolate(s, vars) {
  if (!vars) return s;
  return String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])));
}

/**
 * t('subj.year', { n: 2 }) — when the entry is an array it is a count, and `n`
 * picks the form. A key missing from a translation falls back to Slovak rather
 * than to the key itself, so a gap reads as untranslated, never as broken.
 */
export function t(key, vars) {
  const lang = getLang();
  const entry = (DICT[lang] && DICT[lang][key]) ?? SK[key];
  if (entry == null) return key;
  const s = Array.isArray(entry) ? entry[pluralIndex(lang, vars && vars.n)] : entry;
  return interpolate(s, vars);
}

/** The count and its noun together: "3 predmety", "3 предмета". */
export function tn(key, n, vars) {
  return t(key, { ...(vars || {}), n });
}

// ---- AIS vocabulary --------------------------------------------------------
/**
 * AIS writes its own data in Slovak and always will: subject names, exam types,
 * academic-period titles, message categories. Subject names are proper names and
 * stay as they are — a student has to find them again in AIS. But the handful of
 * recurring words around them ("prednáška", "Zimný semester") are vocabulary, not
 * names, and leaving them Slovak inside a Russian sentence is what makes a
 * translated app feel half-done. Anything not in this table passes through
 * untouched, so an unknown AIS phrase is never mangled.
 */
const AIS_TERMS = {
  ru: {
    'prednáška': 'лекция',
    'cvičenie': 'семинар',
    'seminár': 'семинар',
    'skúška': 'экзамен',
    'zápočet': 'зачёт',
    'klasifikovaný zápočet': 'зачёт с оценкой',
    'priebežné hodnotenie': 'текущий контроль',
    'zimný semester': 'зимний семестр',
    'letný semester': 'летний семестр',
    'zimné skúškové obdobie': 'зимняя сессия',
    'letné skúškové obdobie': 'летняя сессия',
    'skúškové obdobie': 'сессия',
    'prázdniny': 'каникулы',
    'rozvrh': 'расписание',
    'hodnotenie': 'оценки',
    'štúdium': 'учёба',
    'platby': 'платежи',
    'predpis platby': 'начисление платежа',
    'dokumenty': 'документы',
    'mailová správa': 'письмо',
    'oznam': 'уведомление',
    // AIS names its message groups with a preposition: "O platbách", "O dokumentoch".
    'o platbách': 'о платежах',
    'o predpisoch platieb': 'о начислениях',
    'o dokumentoch': 'о документах',
    'o rozvrhu': 'о расписании',
    'o hodnoteniach': 'об оценках',
    'o štúdiu': 'об учёбе',
    'o skúškach': 'об экзаменах',
  },
  uk: {
    'prednáška': 'лекція',
    'cvičenie': 'семінар',
    'seminár': 'семінар',
    'skúška': 'іспит',
    'zápočet': 'залік',
    'klasifikovaný zápočet': 'залік з оцінкою',
    'priebežné hodnotenie': 'поточний контроль',
    'zimný semester': 'зимовий семестр',
    'letný semester': 'літній семестр',
    'zimné skúškové obdobie': 'зимова сесія',
    'letné skúškové obdobie': 'літня сесія',
    'skúškové obdobie': 'сесія',
    'prázdniny': 'канікули',
    'rozvrh': 'розклад',
    'hodnotenie': 'оцінки',
    'štúdium': 'навчання',
    'platby': 'платежі',
    'predpis platby': 'нарахування платежу',
    'dokumenty': 'документи',
    'mailová správa': 'лист',
    'oznam': 'сповіщення',
    'o platbách': 'про платежі',
    'o predpisoch platieb': 'про нарахування',
    'o dokumentoch': 'про документи',
    'o rozvrhu': 'про розклад',
    'o hodnoteniach': 'про оцінки',
    'o štúdiu': 'про навчання',
    'o skúškach': 'про іспити',
  },
};

export function aisTerm(value) {
  const lang = getLang();
  if (lang === 'sk' || value == null) return value;
  const raw = String(value).trim();
  const hit = (AIS_TERMS[lang] || {})[raw.toLowerCase()];
  if (!hit) return value;
  // A badge writes its type in lower case, a heading in upper; keep whichever it was.
  return raw[0] === raw[0].toUpperCase() && raw[0] !== raw[0].toLowerCase() ? cap(hit) : hit;
}

// ---- date helpers ----------------------------------------------------------
function cal() { return CAL[getLang()] || CAL.sk; }

export function dayName(i) { return cal().days[i]; }
export function dayShort(i) { return cal().short[i]; }
export function dayIn(i) { return cal().dayIn[i]; }
export function monthName(i) { return cal().months[i]; }

/** "21. septembra" / "21 сентября" / "21 вересня" — the date without the weekday. */
export function fmtDate(d) {
  const c = cal();
  return c.date(d.getDate(), c.months[d.getMonth()]);
}

/** "Piatok, 18. septembra" / "Пятница, 18 сентября". */
export function fmtDateLong(d = new Date()) {
  return `${dayName(d.getDay())}, ${fmtDate(d)}`;
}

export function hhmm(d) {
  return d.toLocaleTimeString(getLang(), { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function greeting(d = new Date()) {
  const hh = d.getHours();
  if (hh < 5) return t('greeting.night');
  if (hh < 10) return t('greeting.morning');
  if (hh < 18) return t('greeting.day');
  return t('greeting.evening');
}

export function cap(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}
