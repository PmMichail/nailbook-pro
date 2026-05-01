const fs = require('fs');

const replaceInFile = (path, replacements) => {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    
    // Check if useTranslation is imported
    if (!content.includes('useTranslation')) {
        content = content.replace("import { useTheme } from '../context/ThemeContext';", "import { useTheme } from '../context/ThemeContext';\nimport { useTranslation } from 'react-i18next';");
    }
    
    // Check if const { t } is initialized
    if (!content.includes('const { t } = useTranslation()')) {
        content = content.replace(/const { colors(.*) } = useTheme\(\);/, "const { colors$1 } = useTheme();\n  const { t } = useTranslation();");
    }

    // Apply specific text replacements
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    
    fs.writeFileSync(path, content, 'utf8');
    console.log('Updated ' + path);
};

// MasterDashboardScreen
replaceInFile('src/screens/MasterDashboardScreen.tsx', [
    ["'Дашборд'", "t('dashboard.dashboardTitle', {defaultValue: 'Дашборд'})"],
    ["Салон ${masterProfile.salonName}", "${t('dashboard.salon', {defaultValue: 'Салон'})} ${masterProfile.salonName}"],
    ["Майстер ${masterProfile.name}", "${t('dashboard.master', {defaultValue: 'Майстер'})} ${masterProfile.name}"]
]);

// MasterClientsScreen
replaceInFile('src/screens/MasterClientsScreen.tsx', [
    ["'Мої клієнти'", "t('clients.myClients', {defaultValue: 'Мої клієнти'})"],
    ["'Запросити ще'", "t('clients.inviteMore', {defaultValue: 'Запросити ще'})"],
    ["'Вибрати всіх'", "t('clients.selectAll', {defaultValue: 'Вибрати всіх'})"],
    ["'Розсилка'", "t('clients.broadcast', {defaultValue: 'Розсилка'})"],
    ['placeholder="Пошук клієнтів..."', 'placeholder={t("clients.searchClients", {defaultValue: "Пошук клієнтів..."})}']
]);

// ChatsListScreen
replaceInFile('src/screens/ChatsListScreen.tsx', [
    [">Повідомлення<", ">{t('chats.messages', {defaultValue: 'Повідомлення'})}<"],
    [">Немає повідомлень<", ">{t('chats.noMessages', {defaultValue: 'Немає повідомлень'})}<"]
]);

// ChatScreen
replaceInFile('src/screens/ChatScreen.tsx', [
    ['placeholder="Введіть повідомлення..."', 'placeholder={t("chats.typeMessage", {defaultValue: "Введіть повідомлення..."})}']
]);

// GalleryScreen
replaceInFile('src/screens/GalleryScreen.tsx', [
    [">Галерея<", ">{t('gallery.galleryTitle', {defaultValue: 'Галерея'})}<"],
    [">Всі роботи<", ">{t('gallery.allWorks', {defaultValue: 'Всі роботи'})}<"],
    [">Моє портфоліо<", ">{t('gallery.myPortfolio', {defaultValue: 'Моє портфоліо'})}<"],
    [">Обране<", ">{t('gallery.favorites', {defaultValue: 'Обране'})}<"],
    [">Завантажити фото<", ">{t('gallery.uploadPhoto', {defaultValue: 'Завантажити фото'})}<"]
]);

// MasterProfileScreen
replaceInFile('src/screens/MasterProfileScreen.tsx', [
    [">Дані та безпека<", ">{t('profile.dataSecurity', {defaultValue: 'Дані та безпека'})}<"],
    [">Аватар<", ">{t('profile.avatar', {defaultValue: 'Аватар'})}<"],
    [">Логотип<", ">{t('profile.logo', {defaultValue: 'Логотип'})}<"],
    [">Телефон<", ">{t('profile.phone', {defaultValue: 'Телефон'})}<"],
    [">Назва салону<", ">{t('profile.salonName', {defaultValue: 'Назва салону'})}<"],
    [">Обліковий запис Facebook<", ">{t('profile.facebook', {defaultValue: 'Обліковий запис Facebook'})}<"],
    [">Новий пароль<", ">{t('profile.newPassword', {defaultValue: 'Новий пароль'})}<"],
    [">Зберегти зміни<", ">{t('profile.saveChanges', {defaultValue: 'Зберегти зміни'})}<"]
]);

// ClientCalendarScreen
replaceInFile('src/screens/ClientCalendarScreen.tsx', [
    [">Записатися<", ">{t('client.bookAppointment', {defaultValue: 'Записатися'})}<"],
    [">Оберіть майстра<", ">{t('client.selectMaster', {defaultValue: 'Оберіть майстра'})}<"],
    [">Оберіть послугу<", ">{t('client.selectService', {defaultValue: 'Оберіть послугу'})}<"],
    [">Оберіть час<", ">{t('client.selectTime', {defaultValue: 'Оберіть час'})}<"]
]);

// ClientAppointmentsScreen
replaceInFile('src/screens/ClientAppointmentsScreen.tsx', [
    [">Мої записи<", ">{t('client.appointments', {defaultValue: 'Мої записи'})}<"],
    [">Немає записів<", ">{t('client.noAppointments', {defaultValue: 'Немає записів'})}<"]
]);

