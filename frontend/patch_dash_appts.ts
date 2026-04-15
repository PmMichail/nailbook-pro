import fs from 'fs';

let content = fs.readFileSync('src/screens/MasterDashboardScreen.tsx', 'utf8');

content = content.replace("appointments.length === 0 &&", "currentDayAppoints.length === 0 &&");
content = content.replace("{appointments.map((app: any) => (", "{currentDayAppoints.map((app: any) => (");
content = content.replace("Майбутні записи", "Сьогоднішні записи (або обраний день)");

fs.writeFileSync('src/screens/MasterDashboardScreen.tsx', content);
console.log('patched_dash_appts');
