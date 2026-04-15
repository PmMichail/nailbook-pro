import fs from 'fs';

let content = fs.readFileSync('app.json', 'utf8');
const data = JSON.parse(content);

data.expo.android.versionCode = 1;

fs.writeFileSync('app.json', JSON.stringify(data, null, 2));
console.log('patched android');
