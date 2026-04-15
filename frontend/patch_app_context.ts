import fs from 'fs';

let content = fs.readFileSync('App.tsx', 'utf8');

if (!content.includes('UnreadProvider')) {
   content = content.replace("import { ThemeProvider } from './src/context/ThemeContext';", "import { ThemeProvider } from './src/context/ThemeContext';\nimport { UnreadProvider } from './src/context/UnreadContext';");
   
   content = content.replace("<ThemeProvider>", "<ThemeProvider>\n        <UnreadProvider>");
   content = content.replace("</ThemeProvider>", "        </UnreadProvider>\n      </ThemeProvider>");
   
   fs.writeFileSync('App.tsx', content);
   console.log("Patched App.tsx");
}
