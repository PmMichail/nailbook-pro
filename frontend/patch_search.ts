import fs from 'fs';

let content = fs.readFileSync('src/screens/SearchMastersScreen.tsx', 'utf8');

content = content.replace(
    "navigation.navigate('MasterProfileScreen', { masterId: item.id })",
    "navigation.navigate('PublicMasterGalleryScreen', { masterId: item.id, masterName: item.salonName || item.name })"
);

fs.writeFileSync('src/screens/SearchMastersScreen.tsx', content);
console.log("Patched SearchMastersScreen");
