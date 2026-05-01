const fs = require('fs');
const path = 'src/screens/ClientCalendarScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Change the state and usage
content = content.replace(
    "const [masterName, setMasterName] = useState('');",
    "const [masterName, setMasterName] = useState('');\n  const [masterType, setMasterType] = useState('');"
);

// In loadMasterId
content = content.replace(
    "setMasterName(t('clientCalendar.salonPrefix', {defaultValue: 'САЛОН '}) + masterRes.data.salonName.toUpperCase());",
    "setMasterName(masterRes.data.salonName.toUpperCase()); setMasterType('salon');"
);
content = content.replace(
    "setMasterName(t('clientCalendar.masterPrefix', {defaultValue: 'МАЙСТЕР '}) + masterRes.data.name.toUpperCase());",
    "setMasterName(masterRes.data.name.toUpperCase()); setMasterType('master');"
);

// In render
content = content.replace(
    "<Text style={[styles.overTitle, { color: colors.primary }]}>{masterName}</Text>",
    "<Text style={[styles.overTitle, { color: colors.primary }]}>{masterType === 'salon' ? t('clientCalendar.salonPrefix', {defaultValue: 'САЛОН '}) : (masterType === 'master' ? t('clientCalendar.masterPrefix', {defaultValue: 'МАЙСТЕР '}) : '')}{masterName}</Text>"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated ClientCalendarScreen.tsx");
