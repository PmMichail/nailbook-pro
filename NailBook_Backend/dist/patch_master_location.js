"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
let content = fs_1.default.readFileSync('src/routes/master.ts', 'utf8');
const replacement = `// PUT /salon-info
router.put('/salon-info', async (req: any, res) => {
  try {
    const { salonName, salonLogo, lat, lng } = req.body;
    const updateData: any = {};
    if (salonName !== undefined) updateData.salonName = salonName;
    if (salonLogo !== undefined) updateData.salonLogo = salonLogo;
    if (lat !== undefined) updateData.lat = parseFloat(lat);
    if (lng !== undefined) updateData.lng = parseFloat(lng);
    
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });
`;
content = content.replace(/\/\/ PUT \/salon-info\nrouter\.put\('\/salon-info', async \(req: any, res\) => \{\n  try \{\n    const \{ salonName, salonLogo \} = req\.body;\n    const updateData: any = \{\};\n    if \(salonName !== undefined\) updateData\.salonName = salonName;\n    if \(salonLogo !== undefined\) updateData\.salonLogo = salonLogo;\n    \n    const updated = await prisma\.user\.update\(\{[\s\S]*?data: updateData\n    \}\);/, replacement);
fs_1.default.writeFileSync('src/routes/master.ts', content);
console.log('patched master');
//# sourceMappingURL=patch_master_location.js.map