const fs = require('fs');
const path = 'src/screens/ClientCalendarScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
    [">Створіть свій<", ">{t('clientCalendar.createYour', {defaultValue: 'Створіть свій'})}<"],
    [">Стиль<", ">{t('clientCalendar.style', {defaultValue: 'Стиль'})}<"],
    [">Оберіть послугу та зручний час для вашого ідеального візиту.<", ">{t('clientCalendar.heroDesc', {defaultValue: 'Оберіть послугу та зручний час для вашого ідеального візиту.'})}<"],
    [">ПОСЛУГА<", ">{t('clientCalendar.serviceType', {defaultValue: 'ПОСЛУГА'})}<"],
    [">Вибір Дати<", ">{t('clientCalendar.selectDate', {defaultValue: 'Вибір Дати'})}<"],
    [">Доступні години<", ">{t('clientCalendar.availableHours', {defaultValue: 'Доступні години'})}<"],
    [">Немає вільних віконець на цю дату.<", ">{t('clientCalendar.noSlots', {defaultValue: 'Немає вільних віконець на цю дату.'})}<"],
    [">Правила візиту:<", ">{t('clientCalendar.visitRules', {defaultValue: 'Правила візиту:'})}<"],
    [">Будь ласка, приходьте вчасно. У разі запізнення або неможливості прийти — завчасно попередьте майстра у чаті.<", ">{t('clientCalendar.visitRulesDesc', {defaultValue: 'Будь ласка, приходьте вчасно. У разі запізнення або неможливості прийти — завчасно попередьте майстра у чаті.'})}<"],
    [">ЗАБРОНЮВАТИ ВІЗИТ<", ">{t('clientCalendar.bookVisit', {defaultValue: 'ЗАБРОНЮВАТИ ВІЗИТ'})}<"]
];

for (const [s, r] of replacements) {
    content = content.split(s).join(r);
}

fs.writeFileSync(path, content, 'utf8');
