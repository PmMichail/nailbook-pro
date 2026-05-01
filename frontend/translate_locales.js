const fs = require('fs');

const missingKeys = JSON.parse(fs.readFileSync('missing_keys.json', 'utf8'));

// Translation dictionary (Basic German/English fallback)
const dictDE = {
  "Реферальна програма": "Empfehlungsprogramm",
  "Запроси подругу - отримай знижку 10%!": "Laden Sie einen Freund ein - erhalten Sie 10% Rabatt!",
  "Ваша подруга отримає знижку 10% на перший запис, а ви 10% — на ваш наступний запис за кожну подругу!": "Ihre Freundin erhält 10% Rabatt auf ihren ersten Termin und Sie 10% auf Ihren nächsten Termin!",
  "Поділитися 💬": "Teilen 💬",
  "Копіювати 📄": "Kopieren 📄",
  "Запрошено": "Eingeladen",
  "Ваша знижка": "Ihr Rabatt",
  "Мій Майстер": "Mein Meister",
  "Поточний майстер": "Aktueller Meister",
  "💬 Написати": "💬 Schreiben",
  "Відкріпитись": "Loslösen",
  "Знайти або підключити майстра 🔍": "Meister finden oder verbinden 🔍",
  "Пошук за геолокацією або ввід коду": "Suche nach Standort oder Code-Eingabe",
  "Вподобання": "Präferenzen",
  "Збережені дизайни (Обране)": "Gespeicherte Designs (Favoriten)",
  "Переглянути збережені фото 💅": "Gespeicherte Fotos ansehen 💅",
  "Налаштування": "Einstellungen",
  "Темна тема": "Dunkles Thema",
  "Push-сповіщення": "Push-Benachrichtigungen",
  "Telegram-бот": "Telegram Bot",
  "Вийти з акаунту": "Abmelden",
  "Видалити мій акаунт назавжди": "Mein Konto dauerhaft löschen",
  "Мої клієнти": "Meine Kunden",
  "Запросити ще": "Mehr einladen",
  "Пошук клієнтів...": "Kunden suchen...",
  "Вибрати всіх": "Alle auswählen",
  "Розсилка": "Rundschreiben",
  "Створіть свій": "Erstellen Sie Ihren",
  "Стиль": "Stil",
  "Оберіть послугу та зручний час для вашого ідеального візиту.": "Wählen Sie den Service und die bequeme Zeit.",
  "ПОСЛУГА": "SERVICE",
  "Вибір Дати": "Datum auswählen",
  "Доступні години": "Verfügbare Zeiten",
  "Немає вільних віконець на цю дату.": "Keine freien Termine an diesem Datum.",
  "Правила візиту:": "Besuchsregeln:",
  "Будь ласка, приходьте вчасно. У разі запізнення або неможливості прийти — завчасно попередьте майстра у чаті.": "Bitte seien Sie pünktlich.",
  "ЗАБРОНЮВАТИ ВІЗИТ": "TERMIN BUCHEN",
  "ПН": "Mo", "ВТ": "Di", "СР": "Mi", "ЧТ": "Do", "ПТ": "Fr", "СБ": "Sa", "НД": "So",
  "Салон": "Salon", "Майстер": "Meister", "Дашборд": "Dashboard", "QR Код": "QR-Code", "Статист.": "Stat.", "Оплата": "Zahlung",
  "Мої Клієнти": "Meine Kunden", "Налаштування Графіка": "Zeitplaneinstellungen", "Робочий день": "Arbeitstag",
  "Початок:": "Start:", "Кінець:": "Ende:", "Поч. Перерви:": "Pause start:", "Кін. Перерви:": "Pause ende:",
  "Час на клієнта (хв):": "Zeit pro Kunde (Min):", "Скопіювати на всі дні": "Auf alle Tage kopieren",
  "Зберегти Розклад": "Zeitplan speichern", "Записи на": "Termine am", "Закрити": "Schließen",
  "📷 Фото (Опц.)": "📷 Foto (Opt.)", "Зберегти": "Speichern", "Скасувати": "Abbrechen", "Підтвердити": "Bestätigen",
  "Надіслати як Купон": "Als Gutschein senden", "Деталі за": "Details für", "Галерея": "Galerie",
  "Всі Роботи": "Alle Arbeiten", "Мої Портфоліо": "Mein Portfolio", "Повідомлення": "Nachrichten",
  "Manage Subscription": "Abonnement verwalten", "Дані та Безпека": "Daten & Sicherheit",
  "Privacy Policy": "Datenschutz", "Terms of Use": "Nutzungsbedingungen", "Support: t.me/nailbook_support": "Support: t.me/nailbook_support",
  "ОЧІКУЄ ПІДТВЕРДЖЕННЯ": "WARTET AUF BESTÄTIGUNG", "ОЧІКУЄ ПЕРЕДОПЛАТУ": "WARTET AUF VORAUSZAHLUNG",
  "ПІДТВЕРДЖЕНО": "BESTÄTIGT", "СКАСОВАНО": "STORNIERT", "ВИКОНАНО": "ABGESCHLOSSEN",
  "Мої Записи": "Meine Termine", "Ви ще не маєте записів": "Sie haben noch keine Termine",
  "Майстер:": "Meister:", "Ваш Майстер": "Ihr Meister", "До сплати:": "Zu zahlen:", "грн": "UAH",
  "Реквізити на Оплату": "Zahlungsdetails", "Скасувати запис": "Termin stornieren", "Видалити з історії 🗑️": "Aus Verlauf löschen 🗑️",
  "Необхідна Передоплата": "Vorauszahlung erforderlich", "Реквізити на оплату": "Zahlungsdetails",
  "Увага!": "Achtung!", "Сплатіть передоплату та надішліть скріншот майстру в чат.": "Bitte zahlen Sie den Vorschuss.",
  "Запис скасується автоматично до:": "Termin wird automatisch storniert bis:", "Відкрити посилання на оплату": "Zahlungslink öffnen",
  "Картка:": "Karte:", "Банк:": "Bank:", "Не вказано": "Nicht angegeben", "Скопіювати номер картки": "Kartennummer kopieren",
  "Сума:": "Betrag:", "Аватар": "Avatar", "Логотип": "Logo", "Телефон": "Telefon", "Назва салону (опц.)": "Salonname (opt.)",
  "Соціальні мережі (посилання або нікнейми)": "Soziale Netzwerke", "Instagram (без @)": "Instagram", "TikTok (без @)": "TikTok",
  "Обліковий запис Facebook": "Facebook-Konto", "Новий пароль (залиште порожнім, щоб не змінювати)": "Neues Passwort",
  "Зберегти зміни": "Änderungen speichern", "Підписка": "Abonnement", "Поточний тариф:": "Aktueller Tarif:",
  "Активних клієнтів:": "Aktive Kunden:", "Тріал закінчується:": "Test endet:", "Сплачено до:": "Bezahlt bis:",
  "⭐️ Оновити до Pro": "⭐️ Upgrade auf Pro", "💳 Керувати підпискою": "💳 Abo verwalten",
  "📍 Зафіксувати геолокацію салону": "📍 Salon-Standort festlegen", "Дозвольте новим клієнтам поблизу знаходити вас на карті.": "Lassen Sie neue Kunden Sie finden.",
  "Поточна адреса:": "Aktuelle Adresse:", "Сповіщення Telegram": "Telegram-Benachrichtigungen",
  "Отримуйте сповіщення про нові записи прямо в Telegram.": "Erhalten Sie Benachrichtigungen in Telegram.",
  "💬 Підключити Telegram": "💬 Telegram verbinden", "Запросити клієнта": "Kunden einladen",
  "Згенеруйте тимчасовий код для клієнта.": "Temporären Code generieren.", "🔑 Згенерувати код": "🔑 Code generieren",
  "Ваш код:": "Ihr Code:", "Передайте його клієнту. Дійсний 24 години.": "Für den Kunden. 24h gültig."
};

function assignDeep(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

const locales = ['uk', 'en', 'de', 'pl'];

for (const loc of locales) {
  const filePath = `src/locales/${loc}.json`;
  let data = {};
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  for (const [keyPath, defaultUkValue] of Object.entries(missingKeys)) {
    let finalVal = defaultUkValue;
    if (loc === 'de') {
      finalVal = dictDE[defaultUkValue] || defaultUkValue + ' [DE]';
    } else if (loc === 'en') {
      finalVal = defaultUkValue + ' [EN]';
    } else if (loc === 'pl') {
      finalVal = defaultUkValue + ' [PL]';
    }
    assignDeep(data, keyPath, finalVal);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${filePath}`);
}

