const fs = require('fs');
const path = 'backend/src/routes/gallery.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("where: { masterId: masterId, isPublic: false }", "where: { masterId: masterId }");

fs.writeFileSync(path, content, 'utf8');
