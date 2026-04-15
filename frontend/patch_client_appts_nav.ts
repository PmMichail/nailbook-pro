import fs from 'fs';

let content = fs.readFileSync('src/screens/ClientAppointmentsScreen.tsx', 'utf8');

if (!content.includes('useNavigation')) {
    content = content.replace(
        "import api from '../api/client';", 
        "import api from '../api/client';\nimport { useNavigation } from '@react-navigation/native';"
    );
    content = content.replace(
        "export const ClientAppointmentsScreen = () => {",
        "export const ClientAppointmentsScreen = () => {\n  const navigation = useNavigation();"
    );
    fs.writeFileSync('src/screens/ClientAppointmentsScreen.tsx', content);
    console.log("Patched nav");
}
