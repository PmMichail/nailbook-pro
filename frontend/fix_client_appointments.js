const fs = require('fs');
const path = 'src/screens/ClientAppointmentsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
    ["'ОЧІКУЄ ПІДТВЕРДЖЕННЯ'", "t('status.pending', {defaultValue: 'ОЧІКУЄ ПІДТВЕРДЖЕННЯ'})"],
    ["'ОЧІКУЄ ПЕРЕДОПЛАТУ'", "t('status.awaitingPrepayment', {defaultValue: 'ОЧІКУЄ ПЕРЕДОПЛАТУ'})"],
    ["'ПІДТВЕРДЖЕНО'", "t('status.confirmed', {defaultValue: 'ПІДТВЕРДЖЕНО'})"],
    ["'СКАСОВАНО'", "t('status.cancelled', {defaultValue: 'СКАСОВАНО'})"],
    ["'ВИКОНАНО'", "t('status.completed', {defaultValue: 'ВИКОНАНО'})"],
    [">Мої Записи<", ">{t('clientAppointments.title', {defaultValue: 'Мої Записи'})}<"],
    [">Ви ще не маєте записів<", ">{t('clientAppointments.noAppointments', {defaultValue: 'Ви ще не маєте записів'})}<"],
    ["Майстер: ", "{t('clientAppointments.master', {defaultValue: 'Майстер:'})} "],
    ["Ваш Майстер", "t('clientAppointments.yourMaster', {defaultValue: 'Ваш Майстер'})"],
    ["До сплати: ", "{t('clientAppointments.toPay', {defaultValue: 'До сплати:'})} "],
    [" грн", " {t('currency.uah', {defaultValue: 'грн'})}"],
    [">Реквізити на Оплату<", ">{t('clientAppointments.paymentDetailsBtn', {defaultValue: 'Реквізити на Оплату'})}<"],
    [">Скасувати запис<", ">{t('clientAppointments.cancelAppointment', {defaultValue: 'Скасувати запис'})}<"],
    [">Видалити з історії 🗑️<", ">{t('clientAppointments.deleteHistory', {defaultValue: 'Видалити з історії 🗑️'})}<"],
    ["'Необхідна Передоплата'", "t('clientAppointments.prepaymentRequired', {defaultValue: 'Необхідна Передоплата'})"],
    ["'Реквізити на оплату'", "t('clientAppointments.paymentDetails', {defaultValue: 'Реквізити на оплату'})"],
    [">Увага!<", ">{t('clientAppointments.attention', {defaultValue: 'Увага!'})}<"],
    [">Сплатіть передоплату та надішліть скріншот майстру в чат.<", ">{t('clientAppointments.prepaymentInstructions', {defaultValue: 'Сплатіть передоплату та надішліть скріншот майстру в чат.'})}<"],
    ["Запис скасується автоматично до: ", "{t('clientAppointments.autoCancel', {defaultValue: 'Запис скасується автоматично до:'})} "],
    [">Відкрити посилання на оплату<", ">{t('clientAppointments.openLink', {defaultValue: 'Відкрити посилання на оплату'})}<"],
    ["Картка: ", "{t('clientAppointments.card', {defaultValue: 'Картка:'})} "],
    ["Банк: ", "{t('clientAppointments.bank', {defaultValue: 'Банк:'})} "],
    ["'Не вказано'", "t('clientAppointments.notSpecified', {defaultValue: 'Не вказано'})"],
    [">Скопіювати номер картки<", ">{t('clientAppointments.copyCard', {defaultValue: 'Скопіювати номер картки'})}<"],
    ["Сума: ", "{t('clientAppointments.amount', {defaultValue: 'Сума:'})} "],
    [">Закрити<", ">{t('clientAppointments.close', {defaultValue: 'Закрити'})}<"]
];

for (const [s, r] of replacements) {
    content = content.split(s).join(r);
}
fs.writeFileSync(path, content, 'utf8');
