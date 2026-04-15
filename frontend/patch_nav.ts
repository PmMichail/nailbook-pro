import fs from 'fs';

let content = fs.readFileSync('src/navigation/Navigator.tsx', 'utf8');

if (!content.includes('PublicMasterGalleryScreen')) {
    content = content.replace(
        "import { SearchMastersScreen } from '../screens/SearchMastersScreen';",
        "import { SearchMastersScreen } from '../screens/SearchMastersScreen';\nimport { PublicMasterGalleryScreen } from '../screens/PublicMasterGalleryScreen';"
    );
    
    // add to ClientAppointmentsStack or root stack? Wait, SearchMastersScreen is in root Stack.
    // So let's replace <Stack.Screen name="SearchMastersScreen" ... /> with both
    content = content.replace(
        "<Stack.Screen name=\"SearchMastersScreen\" component={SearchMastersScreen} options={{ headerShown: true, title: 'Пошук майстрів', headerTintColor: '#FF69B4' }} />",
        "<Stack.Screen name=\"SearchMastersScreen\" component={SearchMastersScreen} options={{ headerShown: true, title: 'Пошук майстрів', headerTintColor: '#FF69B4' }} />\n    <Stack.Screen name=\"PublicMasterGalleryScreen\" component={PublicMasterGalleryScreen} options={{ headerShown: true, title: 'Галерея майстра', headerTintColor: '#FF69B4' }} />"
    );
    fs.writeFileSync('src/navigation/Navigator.tsx', content);
    console.log("Patched Navigator");
}
