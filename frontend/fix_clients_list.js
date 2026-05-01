const fs = require('fs');
const path = 'src/screens/ClientsListScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
    ["'Немає візитів'", "t('clients.noVisits', {defaultValue: 'Немає візитів'})"],
    [">Нове повідомлення<", ">{t('clients.newMessage', {defaultValue: 'Нове повідомлення'})}<"],
    ["Буде надіслано:", "{t('clients.willBeSent', {defaultValue: 'Буде надіслано:'})}"],
    ["клієнтам", "{t('clients.clientsCount', {defaultValue: 'клієнтам'})}"],
    ["'Введіть текст розсилки...'", "t('clients.enterText', {defaultValue: 'Введіть текст розсилки...'})"],
    [">Скасувати<", ">{t('clients.cancel', {defaultValue: 'Скасувати'})}<"],
    [">Відправити<", ">{t('clients.send', {defaultValue: 'Відправити'})}<"],
    [">Дані клієнта<", ">{t('clients.clientData', {defaultValue: 'Дані клієнта'})}<"],
    ["'Ім\\'я'", "t('clients.namePlaceholder', {defaultValue: 'Ім\\'я'})"],
    ["'Телефон'", "t('clients.phonePlaceholder', {defaultValue: 'Телефон'})"],
    ["'Нотатки (лише для вас)'", "t('clients.notesPlaceholder', {defaultValue: 'Нотатки (лише для вас)'})"],
    [">Закрити<", ">{t('clients.close', {defaultValue: 'Закрити'})}<"],
    [">💬 Написати<", ">{t('clients.write', {defaultValue: '💬 Написати'})}<"],
    [">Видалити<", ">{t('clients.delete', {defaultValue: 'Видалити'})}<"],
    [">Зберегти<", ">{t('clients.save', {defaultValue: 'Зберегти'})}<"],
    ["'Видлення'", "t('clients.deleteTitle', {defaultValue: 'Видлення'})"],
    ["'Ви впевнені, що хочете видалити цього клієнта з вашої бази?'", "t('clients.deleteConfirm', {defaultValue: 'Ви впевнені, що хочете видалити цього клієнта з вашої бази?'})"],
    ["'Привіт! Записуйся до мене на манікюр через NailsBook Pro!'", "t('clients.shareMessage', {defaultValue: 'Привіт! Записуйся до мене на манікюр через NailsBook Pro!'})"]
];

for (const [s, r] of replacements) {
    content = content.split(s).join(r);
}

fs.writeFileSync(path, content, 'utf8');
