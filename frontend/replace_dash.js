const fs = require('fs');

const path = 'src/screens/MasterDashboardScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace LocaleConfig setup
const oldLocaleConfig = `LocaleConfig.locales['uk'] = {
  monthNames: ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'],
  monthNamesShort: ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'],
  dayNames: ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\\'ятниця','Субота'],
  dayNamesShort: ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'],
  today: 'Сьогодні'
};
LocaleConfig.defaultLocale = 'uk';`;

const newLocaleConfig = `LocaleConfig.locales['uk'] = {
  monthNames: ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'],
  monthNamesShort: ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'],
  dayNames: ['Неділя','Понеділок','Вівторок','Середа','Четвер','П\\'ятниця','Субота'],
  dayNamesShort: ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'],
  today: 'Сьогодні'
};
LocaleConfig.locales['pl'] = {
  monthNames: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
  monthNamesShort: ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'],
  dayNames: ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'],
  dayNamesShort: ['Nd','Pn','Wt','Śr','Cz','Pt','Sb'],
  today: 'Dzisiaj'
};
LocaleConfig.locales['de'] = {
  monthNames: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  monthNamesShort: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],
  dayNames: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
  dayNamesShort: ['So','Mo','Di','Mi','Do','Fr','Sa'],
  today: 'Heute'
};
LocaleConfig.locales['en'] = {
  monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  today: 'Today'
};`;

content = content.replace(oldLocaleConfig, newLocaleConfig);

// Inside useEffect for changing locale dynamically
if (!content.includes('LocaleConfig.defaultLocale = i18n.language;')) {
    content = content.replace('useEffect(() => {\n    loadMasterData();', "useEffect(() => {\n    LocaleConfig.defaultLocale = i18n.language || 'uk';\n    loadMasterData();");
}

const DAYS_OLD = `const DAYS = [
  { id: '1', name: 'ПН' }, { id: '2', name: 'ВТ' }, { id: '3', name: 'СР' },
  { id: '4', name: 'ЧТ' }, { id: '5', name: 'ПТ' }, { id: '6', name: 'СБ' }, { id: '0', name: 'НД' }
];`;

const DAYS_NEW = `const getDaysArray = (t: any) => [
  { id: '1', name: t('days.monday', {defaultValue: 'ПН'}) }, { id: '2', name: t('days.tuesday', {defaultValue: 'ВТ'}) }, { id: '3', name: t('days.wednesday', {defaultValue: 'СР'}) },
  { id: '4', name: t('days.thursday', {defaultValue: 'ЧТ'}) }, { id: '5', name: t('days.friday', {defaultValue: 'ПТ'}) }, { id: '6', name: t('days.saturday', {defaultValue: 'СБ'}) }, { id: '0', name: t('days.sunday', {defaultValue: 'НД'}) }
];`;

content = content.replace(DAYS_OLD, DAYS_NEW);

// Replace mapping DAYS -> getDaysArray(t)
content = content.replace('DAYS.map((day, ix) =>', 'getDaysArray(t).map((day, ix) =>');
content = content.replace('const handleCopyToAllDays = async () => {', 'const handleCopyToAllDays = async () => {\n    const DAYS = getDaysArray(t);');


const replacements = [
    ["'Запити на підтвердження'", "t('dashboard.pendingRequests', {defaultValue: 'Запити на підтвердження'})"],
    ["'Немає нових запитів'", "t('dashboard.noNewRequests', {defaultValue: 'Немає нових запитів'})"],
    [">Записи на {", ">{t('dashboard.appointmentsOn', {defaultValue: 'Записи на'})} {"],
    ["'Немає записів'", "t('dashboard.noAppointments', {defaultValue: 'Немає записів'})"],
    ["'Мої ціни (Прайс-лист)'", "t('dashboard.priceList', {defaultValue: 'Мої ціни (Прайс-лист)'})"],
    ["'+ Додати послугу'", "t('dashboard.addService', {defaultValue: '+ Додати послугу'})"],
    ["'Клієнт:'", "t('dashboard.client', {defaultValue: 'Клієнт:'})"],
    ["'Дата:'", "t('dashboard.date', {defaultValue: 'Дата:'})"],
    ["'Тільки PRO'", "t('dashboard.proOnly', {defaultValue: 'Тільки PRO'})"]
];

for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Updated MasterDashboardScreen translations.');

