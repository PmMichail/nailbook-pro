const fs = require('fs');

const manualTranslations = {
    de: {
        "dashboard.pendingRequestsTitle": "⚠️ Bestätigungsanfragen",
        "dashboard.noRecords": "Keine Termine",
        "dashboard.noRecordsToday": "Heute keine Termine",
        "dashboard.myPrices": "Meine Preise (Preisliste)",
        "dashboard.addService": "+ Service hinzufügen",
        "profile.phonePlaceholder": "Telefon",
        "profile.saveChangesBtn": "Änderungen speichern",
        "gallery.addedToFav": "Zu Favoriten hinzugefügt ❤️",
        "gallery.favorites": "Favoriten ❤️",
        "clientCalendar.masterPrefix": "MEISTER ",
        "clientCalendar.salonPrefix": "SALON "
    },
    en: {
        "dashboard.pendingRequestsTitle": "⚠️ Pending Requests",
        "dashboard.noRecords": "No records",
        "dashboard.noRecordsToday": "No records today",
        "dashboard.myPrices": "My Prices",
        "dashboard.addService": "+ Add Service",
        "profile.phonePlaceholder": "Phone",
        "profile.saveChangesBtn": "Save Changes",
        "gallery.addedToFav": "Added to Favorites ❤️",
        "gallery.favorites": "Favorites ❤️",
        "clientCalendar.masterPrefix": "MASTER ",
        "clientCalendar.salonPrefix": "SALON "
    },
    pl: {
        "dashboard.pendingRequestsTitle": "⚠️ Prośby o potwierdzenie",
        "dashboard.noRecords": "Brak zapisów",
        "dashboard.noRecordsToday": "Brak zapisów na dziś",
        "dashboard.myPrices": "Moje ceny (Cennik)",
        "dashboard.addService": "+ Dodaj usługę",
        "profile.phonePlaceholder": "Telefon",
        "profile.saveChangesBtn": "Zapisz zmiany",
        "gallery.addedToFav": "Dodano do ulubionych ❤️",
        "gallery.favorites": "Ulubione ❤️",
        "clientCalendar.masterPrefix": "MISTRZ ",
        "clientCalendar.salonPrefix": "SALON "
    },
    uk: {
        "dashboard.pendingRequestsTitle": "⚠️ Запити на підтвердження",
        "dashboard.noRecords": "Немає записів",
        "dashboard.noRecordsToday": "Немає записів на цей день",
        "dashboard.myPrices": "Мої ціни (Прайс-лист)",
        "dashboard.addService": "+ Додати послугу",
        "profile.phonePlaceholder": "Телефон",
        "profile.saveChangesBtn": "Зберегти зміни",
        "gallery.addedToFav": "Додано в обране ❤️",
        "gallery.favorites": "Обране ❤️",
        "clientCalendar.masterPrefix": "МАЙСТЕР ",
        "clientCalendar.salonPrefix": "САЛОН "
    }
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

const locales = ['de', 'en', 'pl', 'uk'];

for (const loc of locales) {
    const filePath = `src/locales/${loc}.json`;
    let data = {};
    if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    for (const [key, value] of Object.entries(manualTranslations[loc])) {
        assignDeep(data, key, value);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

console.log("Updated locale files manually.");
