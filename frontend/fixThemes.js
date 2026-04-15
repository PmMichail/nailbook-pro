const fs = require('fs');
const path = require('path');

const dir = './src/screens';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove backgroundColor: '#FFF0F5'
        content = content.replace(/backgroundColor:\s*['"]#FFF0F5['"]\s*,?/g, '');
        
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
console.log('Fixed container backgrounds!');
