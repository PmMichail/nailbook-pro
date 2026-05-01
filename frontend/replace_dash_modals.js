const fs = require('fs');
const path = 'src/screens/MasterDashboardScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
    ["'Деталі запису'", "t('dashboard.appointmentDetails', {defaultValue: 'Деталі запису'})"],
    ["'Редагувати послугу'", "t('dashboard.editService', {defaultValue: 'Редагувати послугу'})"],
    ["'Підтвердити запис'", "t('dashboard.confirmAppointment', {defaultValue: 'Підтвердити запис'})"],
    ["'Ваше посилання'", "t('dashboard.yourLink', {defaultValue: 'Ваше посилання'})"],
    [">Деталі за {", ">{t('dashboard.detailsFor', {defaultValue: 'Деталі за'})} {"],
    [">Закрити<", ">{t('dashboard.close', {defaultValue: 'Закрити'})}<"],
    [">Скасувати<", ">{t('dashboard.cancel', {defaultValue: 'Скасувати'})}<"],
    [">Підтвердити<", ">{t('dashboard.confirm', {defaultValue: 'Підтвердити'})}<"],
    [">Зберегти<", ">{t('dashboard.save', {defaultValue: 'Зберегти'})}<"],
    ["'Нова ціна (грн) - опціонально:'", "t('dashboard.newPrice', {defaultValue: 'Нова ціна (грн) - опціонально:'})"],
    ["'Примітка клієнту (необов\\'язково):'", "t('dashboard.clientNote', {defaultValue: 'Примітка клієнту (необов\\'язково):'})"],
    ["'Передоплата (PRO):'", "t('dashboard.prepayment', {defaultValue: 'Передоплата (PRO):'})"],
    ["'Назва послуги:'", "t('dashboard.serviceName', {defaultValue: 'Назва послуги:'})"],
    ["'Ціна (грн):'", "t('dashboard.price', {defaultValue: 'Ціна (грн):'})"],
    [">📷 Фото (Опц.)<", ">{t('dashboard.photoOpt', {defaultValue: '📷 Фото (Опц.)'})}<"],
    [">Надіслати як Купон<", ">{t('dashboard.sendAsCoupon', {defaultValue: 'Надіслати як Купон'})}<"],
    ["'Немає записів на цей день'", "t('dashboard.noRecordsOnThisDay', {defaultValue: 'Немає записів на цей день'})"]
];

for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Updated MasterDashboardScreen modals.');
