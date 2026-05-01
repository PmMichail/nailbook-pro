import json
import os

new_locales = {
    'uk': {
        'dashboard': {
            'salon': 'Салон',
            'dashboardTitle': 'Дашборд'
        },
        'clients': {
            'inviteMore': 'Запросити ще',
            'myClients': 'Мої клієнти',
            'selectAll': 'Вибрати всіх',
            'broadcast': 'Розсилка',
            'searchClients': 'Пошук клієнтів...'
        },
        'chats': {
            'messages': 'Повідомлення',
            'noMessages': 'Немає повідомлень',
            'typeMessage': 'Введіть повідомлення...'
        },
        'gallery': {
            'galleryTitle': 'Галерея',
            'allWorks': 'Всі роботи',
            'myPortfolio': 'Моє портфоліо',
            'favorites': 'Обране',
            'uploadPhoto': 'Завантажити фото'
        },
        'profile': {
            'dataSecurity': 'Дані та безпека',
            'avatar': 'Аватар',
            'logo': 'Логотип',
            'phone': 'Телефон',
            'salonName': 'Назва салону',
            'facebook': 'Обліковий запис Facebook',
            'newPassword': 'Новий пароль',
            'saveChanges': 'Зберегти зміни',
            'currentTariff': 'Поточний тариф:',
            'settings': 'Налаштування'
        },
        'client': {
            'appointments': 'Мої записи',
            'calendar': 'Календар',
            'noAppointments': 'Немає записів',
            'bookAppointment': 'Записатися',
            'selectMaster': 'Оберіть майстра',
            'selectService': 'Оберіть послугу',
            'selectTime': 'Оберіть час'
        }
    },
    'en': {
        'dashboard': {
            'salon': 'Salon',
            'dashboardTitle': 'Dashboard'
        },
        'clients': {
            'inviteMore': 'Invite more',
            'myClients': 'My clients',
            'selectAll': 'Select all',
            'broadcast': 'Broadcast',
            'searchClients': 'Search clients...'
        },
        'chats': {
            'messages': 'Messages',
            'noMessages': 'No messages',
            'typeMessage': 'Type a message...'
        },
        'gallery': {
            'galleryTitle': 'Gallery',
            'allWorks': 'All works',
            'myPortfolio': 'My portfolio',
            'favorites': 'Favorites',
            'uploadPhoto': 'Upload photo'
        },
        'profile': {
            'dataSecurity': 'Data & Security',
            'avatar': 'Avatar',
            'logo': 'Logo',
            'phone': 'Phone',
            'salonName': 'Salon name',
            'facebook': 'Facebook account',
            'newPassword': 'New password',
            'saveChanges': 'Save changes',
            'currentTariff': 'Current tariff:',
            'settings': 'Settings'
        },
        'client': {
            'appointments': 'My Appointments',
            'calendar': 'Calendar',
            'noAppointments': 'No appointments',
            'bookAppointment': 'Book Appointment',
            'selectMaster': 'Select Master',
            'selectService': 'Select Service',
            'selectTime': 'Select Time'
        }
    },
    'pl': {
         'dashboard': {
            'salon': 'Salon',
            'dashboardTitle': 'Pulpit'
        },
        'clients': {
            'inviteMore': 'Zaproś więcej',
            'myClients': 'Moi klienci',
            'selectAll': 'Zaznacz wszystko',
            'broadcast': 'Wiadomość masowa',
            'searchClients': 'Szukaj klientów...'
        },
        'chats': {
            'messages': 'Wiadomości',
            'noMessages': 'Brak wiadomości',
            'typeMessage': 'Wpisz wiadomość...'
        },
        'gallery': {
            'galleryTitle': 'Galeria',
            'allWorks': 'Wszystkie prace',
            'myPortfolio': 'Moje portfolio',
            'favorites': 'Ulubione',
            'uploadPhoto': 'Prześlij zdjęcie'
        },
        'profile': {
            'dataSecurity': 'Dane i bezpieczeństwo',
            'avatar': 'Awatar',
            'logo': 'Logo',
            'phone': 'Telefon',
            'salonName': 'Nazwa salonu',
            'facebook': 'Konto Facebook',
            'newPassword': 'Nowe hasło',
            'saveChanges': 'Zapisz zmiany',
            'currentTariff': 'Obecna taryfa:',
            'settings': 'Ustawienia'
        },
        'client': {
            'appointments': 'Moje wizyty',
            'calendar': 'Kalendarz',
            'noAppointments': 'Brak wizyt',
            'bookAppointment': 'Zarezerwuj wizytę',
            'selectMaster': 'Wybierz mistrza',
            'selectService': 'Wybierz usługę',
            'selectTime': 'Wybierz czas'
        }
    },
    'de': {
        'dashboard': {
            'salon': 'Salon',
            'dashboardTitle': 'Kabinett'
        },
        'clients': {
            'inviteMore': 'Mehr einladen',
            'myClients': 'Meine Kunden',
            'selectAll': 'Alle auswählen',
            'broadcast': 'Rundsendung',
            'searchClients': 'Kunden suchen...'
        },
        'chats': {
            'messages': 'Nachrichten',
            'noMessages': 'Keine Nachrichten',
            'typeMessage': 'Nachricht eingeben...'
        },
        'gallery': {
            'galleryTitle': 'Galerie',
            'allWorks': 'Alle Arbeiten',
            'myPortfolio': 'Mein Portfolio',
            'favorites': 'Favoriten',
            'uploadPhoto': 'Foto hochladen'
        },
        'profile': {
            'dataSecurity': 'Daten & Sicherheit',
            'avatar': 'Avatar',
            'logo': 'Logo',
            'phone': 'Telefon',
            'salonName': 'Salonname',
            'facebook': 'Facebook-Konto',
            'newPassword': 'Neues Passwort',
            'saveChanges': 'Änderungen speichern',
            'currentTariff': 'Aktueller Tarif:',
            'settings': 'Einstellungen'
        },
        'client': {
            'appointments': 'Meine Termine',
            'calendar': 'Kalender',
            'noAppointments': 'Keine Termine',
            'bookAppointment': 'Termin buchen',
            'selectMaster': 'Meister auswählen',
            'selectService': 'Service auswählen',
            'selectTime': 'Zeit auswählen'
        }
    }
}

for lang, data in new_locales.items():
    filepath = f"src/locales/{lang}.json"
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = {}
    
    # deep merge
    for k, v in data.items():
        if k in existing_data and isinstance(existing_data[k], dict) and isinstance(v, dict):
            existing_data[k].update(v)
        else:
            existing_data[k] = v
            
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)

print("Locales updated with pass 2.")
