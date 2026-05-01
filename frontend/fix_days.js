const fs = require('fs');
const path = 'src/screens/MasterDashboardScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const getDaysArrayDef = `const getDaysArray = (t: any) => [
  { id: '1', name: t('days.monday', {defaultValue: 'ПН'}) }, { id: '2', name: t('days.tuesday', {defaultValue: 'ВТ'}) }, { id: '3', name: t('days.wednesday', {defaultValue: 'СР'}) },
  { id: '4', name: t('days.thursday', {defaultValue: 'ЧТ'}) }, { id: '5', name: t('days.friday', {defaultValue: 'ПТ'}) }, { id: '6', name: t('days.saturday', {defaultValue: 'СБ'}) }, { id: '0', name: t('days.sunday', {defaultValue: 'НД'}) }
];`;

if (!content.includes('const getDaysArray =')) {
    content = content.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from 'react-i18next';\n" + getDaysArrayDef);
    fs.writeFileSync(path, content, 'utf8');
}
