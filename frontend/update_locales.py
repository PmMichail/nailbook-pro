import json
import os

locales = {
    'uk': {
        'tabs': {
            'dashboard': 'Кабінет',
            'clients': 'Клієнти',
            'chats': 'Чати',
            'gallery': 'Галерея',
            'profile': 'Профіль'
        },
        'dashboard': {
            'master': 'Майстер',
            'qrCode': 'QR Код',
            'stats': 'Статист.',
            'payment': 'Оплата',
            'myClients': 'Мої Клієнти',
            'scheduleSettings': 'Налаштування Графіка',
            'workDay': 'Робочий день (Натисніть щоб змінити)',
            'start': 'Початок:',
            'end': 'Кінець:',
            'breakStart': 'Поч. Перерви:',
            'breakEnd': 'Кін. Перерви:',
            'timePerClient': 'Час на клієнта (хв):',
            'copyToAllDays': 'Скопіювати на всі дні',
            'saveSchedule': 'Зберегти Розклад'
        },
        'profile': {
            'referralProgram': 'Реферальна програма 🎁',
            'referralTitle': 'Запроси подругу - отримай знижку 10%!',
            'referralDesc': 'Ваша подруга отримає знижку 10% на перший запис, а ви 10% — на ваш наступний запис за кожну подругу!',
            'share': 'Поділитися 💬',
            'copy': 'Копіювати 📄',
            'invited': 'Запрошено',
            'yourDiscount': 'Ваша знижка',
            'myMaster': 'Мій Майстер',
            'currentMaster': 'Поточний майстер',
            'message': '💬 Написати',
            'unlink': 'Відкріпитись',
            'findMaster': 'Знайти або підключити майстра 🔍',
            'searchDesc': 'Пошук за геолокацією або ввід коду',
            'preferences': 'Вподобання',
            'savedDesigns': 'Збережені дизайни (Обране)',
            'viewSaved': 'Переглянути збережені фото 💅',
            'fixLocation': '📍 Зафіксувати геолокацію салону',
            'telegramNotifications': 'Сповіщення Telegram',
            'connectTelegram': '💬 Підключити Telegram',
            'inviteClient': 'Запросити клієнта',
            'generateCode': '🔑 Згенерувати код',
            'subscription': 'Підписка',
            'manageSubscription': 'Керувати підпискою'
        }
    },
    'en': {
        'tabs': {
            'dashboard': 'Dashboard',
            'clients': 'Clients',
            'chats': 'Chats',
            'gallery': 'Gallery',
            'profile': 'Profile'
        },
        'dashboard': {
            'master': 'Master',
            'qrCode': 'QR Code',
            'stats': 'Stats',
            'payment': 'Payment',
            'myClients': 'My Clients',
            'scheduleSettings': 'Schedule Settings',
            'workDay': 'Work Day (Tap to toggle)',
            'start': 'Start:',
            'end': 'End:',
            'breakStart': 'Break Start:',
            'breakEnd': 'Break End:',
            'timePerClient': 'Time per client (min):',
            'copyToAllDays': 'Copy to all days',
            'saveSchedule': 'Save Schedule'
        },
        'profile': {
            'referralProgram': 'Referral Program 🎁',
            'referralTitle': 'Invite a friend - get 10% off!',
            'referralDesc': 'Your friend gets 10% off their first appointment, and you get 10% off your next one for each friend!',
            'share': 'Share 💬',
            'copy': 'Copy 📄',
            'invited': 'Invited',
            'yourDiscount': 'Your discount',
            'myMaster': 'My Master',
            'currentMaster': 'Current master',
            'message': '💬 Message',
            'unlink': 'Unlink',
            'findMaster': 'Find or connect a master 🔍',
            'searchDesc': 'Search by geolocation or code',
            'preferences': 'Preferences',
            'savedDesigns': 'Saved designs (Favorites)',
            'viewSaved': 'View saved photos 💅',
            'fixLocation': '📍 Fix salon location',
            'telegramNotifications': 'Telegram Notifications',
            'connectTelegram': '💬 Connect Telegram',
            'inviteClient': 'Invite a client',
            'generateCode': '🔑 Generate code',
            'subscription': 'Subscription',
            'manageSubscription': 'Manage Subscription'
        }
    },
    'pl': {
        'tabs': {
            'dashboard': 'Pulpit',
            'clients': 'Klienci',
            'chats': 'Czaty',
            'gallery': 'Galeria',
            'profile': 'Profil'
        },
        'dashboard': {
            'master': 'Mistrz',
            'qrCode': 'Kod QR',
            'stats': 'Statystyki',
            'payment': 'Płatność',
            'myClients': 'Moi Klienci',
            'scheduleSettings': 'Ustawienia Harmonogramu',
            'workDay': 'Dzień roboczy (Naciśnij, aby zmienić)',
            'start': 'Początek:',
            'end': 'Koniec:',
            'breakStart': 'Pocz. Przerwy:',
            'breakEnd': 'Koniec Przerwy:',
            'timePerClient': 'Czas na klienta (min):',
            'copyToAllDays': 'Skopiuj na wszystkie dni',
            'saveSchedule': 'Zapisz Harmonogram'
        },
        'profile': {
            'referralProgram': 'Program Poleceń 🎁',
            'referralTitle': 'Zaproś przyjaciółkę - zyskaj 10% zniżki!',
            'referralDesc': 'Twoja przyjaciółka otrzyma 10% zniżki na pierwszą wizytę, a Ty 10% na kolejną za każdą poleconą osobę!',
            'share': 'Udostępnij 💬',
            'copy': 'Kopiuj 📄',
            'invited': 'Zaproszeni',
            'yourDiscount': 'Twoja zniżka',
            'myMaster': 'Mój Mistrz',
            'currentMaster': 'Obecny mistrz',
            'message': '💬 Wiadomość',
            'unlink': 'Odłącz się',
            'findMaster': 'Znajdź lub połącz się z mistrzem 🔍',
            'searchDesc': 'Szukaj przez geolokalizację lub kod',
            'preferences': 'Preferencje',
            'savedDesigns': 'Zapisane wzory (Ulubione)',
            'viewSaved': 'Zobacz zapisane zdjęcia 💅',
            'fixLocation': '📍 Ustal lokalizację salonu',
            'telegramNotifications': 'Powiadomienia Telegram',
            'connectTelegram': '💬 Podłącz Telegram',
            'inviteClient': 'Zaproś klienta',
            'generateCode': '🔑 Wygeneruj kod',
            'subscription': 'Subskrypcja',
            'manageSubscription': 'Zarządzaj Subskrypcją'
        }
    },
    'de': {
        'tabs': {
            'dashboard': 'Kabinett',
            'clients': 'Kunden',
            'chats': 'Chats',
            'gallery': 'Galerie',
            'profile': 'Profil'
        },
        'dashboard': {
            'master': 'Meister',
            'qrCode': 'QR-Code',
            'stats': 'Statistiken',
            'payment': 'Zahlung',
            'myClients': 'Meine Kunden',
            'scheduleSettings': 'Zeitplan-Einstellungen',
            'workDay': 'Arbeitstag (Zum Ändern tippen)',
            'start': 'Start:',
            'end': 'Ende:',
            'breakStart': 'Pause Start:',
            'breakEnd': 'Pause Ende:',
            'timePerClient': 'Zeit pro Kunde (Min):',
            'copyToAllDays': 'Auf alle Tage kopieren',
            'saveSchedule': 'Zeitplan speichern'
        },
        'profile': {
            'referralProgram': 'Empfehlungsprogramm 🎁',
            'referralTitle': 'Lade eine Freundin ein - erhalte 10% Rabatt!',
            'referralDesc': 'Deine Freundin erhält 10% Rabatt auf ihren ersten Termin, und du erhältst 10% auf deinen nächsten für jede Freundin!',
            'share': 'Teilen 💬',
            'copy': 'Kopieren 📄',
            'invited': 'Eingeladen',
            'yourDiscount': 'Dein Rabatt',
            'myMaster': 'Mein Meister',
            'currentMaster': 'Aktueller Meister',
            'message': '💬 Nachricht',
            'unlink': 'Trennen',
            'findMaster': 'Finde oder verbinde einen Meister 🔍',
            'searchDesc': 'Suche nach Geolokalisierung oder Code',
            'preferences': 'Einstellungen',
            'savedDesigns': 'Gespeicherte Designs (Favoriten)',
            'viewSaved': 'Gespeicherte Fotos ansehen 💅',
            'fixLocation': '📍 Salon-Standort festlegen',
            'telegramNotifications': 'Telegram-Benachrichtigungen',
            'connectTelegram': '💬 Telegram verbinden',
            'inviteClient': 'Kunden einladen',
            'generateCode': '🔑 Code generieren',
            'subscription': 'Abonnement',
            'manageSubscription': 'Abonnement verwalten'
        }
    }
}

for lang, data in locales.items():
    filepath = f"src/locales/{lang}.json"
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = {}
    
    existing_data.update(data)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)

print("Locales updated successfully.")
