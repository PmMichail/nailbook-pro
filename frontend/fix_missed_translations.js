const fs = require('fs');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [s, r] of replacements) {
        content = content.split(s).join(r);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

replaceInFile('src/screens/MasterDashboardScreen.tsx', [
    ['⚠️ Запити на підтвердження', "{t('dashboard.pendingRequestsTitle', {defaultValue: '⚠️ Запити на підтвердження'})}"],
    ['>Немає записів<', ">{t('dashboard.noRecords', {defaultValue: 'Немає записів'})}<"],
    ['>Немає записів на цей день<', ">{t('dashboard.noRecordsToday', {defaultValue: 'Немає записів на цей день'})}<"],
    ['>Мої ціни (Прайс-лист)<', ">{t('dashboard.myPrices', {defaultValue: 'Мої ціни (Прайс-лист)'})}<"],
    ['>+ Додати послугу<', ">{t('dashboard.addService', {defaultValue: '+ Додати послугу'})}<"]
]);

replaceInFile('src/screens/ClientProfileScreen.tsx', [
    ['placeholder="Телефон"', "placeholder={t('profile.phonePlaceholder', {defaultValue: 'Телефон'})}"],
    ['>Зберегти зміни<', ">{t('profile.saveChangesBtn', {defaultValue: 'Зберегти зміни'})}<"]
]);

replaceInFile('src/screens/GalleryScreen.tsx', [
    ["'Додано в обране ❤️'", "t('gallery.addedToFav', {defaultValue: 'Додано в обране ❤️'})"],
    ['>Обране ❤️<', ">{t('gallery.favorites', {defaultValue: 'Обране ❤️'})}<"]
]);

replaceInFile('src/screens/MasterCalendarScreen.tsx', [
    ['>Немає записів на цей день<', ">{t('dashboard.noRecordsToday', {defaultValue: 'Немає записів на цей день'})}<"]
]);

replaceInFile('src/screens/MasterClientsScreen.tsx', [
    ['>Немає записів<', ">{t('dashboard.noRecords', {defaultValue: 'Немає записів'})}<"]
]);

console.log("Replaced strings with t() calls.");
