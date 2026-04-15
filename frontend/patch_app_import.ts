import fs from 'fs';

let content = fs.readFileSync('App.tsx', 'utf8');

if (!content.includes('./src/context/UnreadContext')) {
    content = content.replace(
        "import { ThemeProvider, useTheme } from './src/context/ThemeContext';", 
        "import { ThemeProvider, useTheme } from './src/context/ThemeContext';\nimport { UnreadProvider } from './src/context/UnreadContext';"
    );
    fs.writeFileSync('App.tsx', content);
    console.log("Patched App.tsx");
}
