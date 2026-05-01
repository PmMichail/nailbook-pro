const fs = require('fs');
const path = 'src/screens/ClientAppointmentsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("|| 't('clientAppointments.yourMaster', {defaultValue: 'Ваш Майстер'})'", "|| t('clientAppointments.yourMaster', {defaultValue: 'Ваш Майстер'})");
content = content.replace("+ ' {t('currency.uah', {defaultValue: 'грн'})}'", "+ ' ' + t('currency.uah', {defaultValue: 'грн'})");
content = content.replace(": t('clientAppointments.notSpecified', {defaultValue: 'Не вказано'})}", ": t('clientAppointments.notSpecified', {defaultValue: 'Не вказано'})}");

fs.writeFileSync(path, content, 'utf8');
