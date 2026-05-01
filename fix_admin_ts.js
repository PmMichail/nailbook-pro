const fs = require('fs');
const path = 'backend/src/routes/admin.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("const last7DaysRevenue = [0,0,0,0,0,0,0];", "const last7DaysRevenue: number[] = [0,0,0,0,0,0,0];");
content = content.replace("const last7DaysRegs = [0,0,0,0,0,0,0];", "const last7DaysRegs: number[] = [0,0,0,0,0,0,0];");
content = content.replace("const getCountry = (lat, lng) => {", "const getCountry = (lat: number, lng: number) => {");

content = content.replace(/prisma\.chatMessage/g, "prisma.message");

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed TS errors in admin.ts");
