const fs = require('fs');
const path = 'src/screens/ClientCalendarScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("setMasterName('САЛОН ' + masterRes.data.salonName.toUpperCase());", "setMasterName(t('clientCalendar.salonPrefix', {defaultValue: 'САЛОН '}) + masterRes.data.salonName.toUpperCase());");
content = content.replace("setMasterName('МАЙСТЕР ' + masterRes.data.name.toUpperCase());", "setMasterName(t('clientCalendar.masterPrefix', {defaultValue: 'МАЙСТЕР '}) + masterRes.data.name.toUpperCase());");

fs.writeFileSync(path, content, 'utf8');
