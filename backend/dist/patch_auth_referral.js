"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
let content = fs_1.default.readFileSync('src/routes/auth.ts', 'utf8');
// The line currently reads: `if (validReferralCodeObj) {`
// Let's replace it with the logic to fetch referring client's master and set `resolvedMasterId`
const replacement = `    // Apply Referral Record
    if (validReferralCodeObj && !resolvedMasterId) {
      const owner = await prisma.user.findUnique({ where: { id: validReferralCodeObj.ownerId } });
      if (owner && owner.masterId) {
          resolvedMasterId = owner.masterId;
      }
    }

    // Now insert the new user
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        role: userRole,
        city,
        address,
        isActiveClient: userRole === 'CLIENT' ? true : false,
        linkSlug,
        defaultDuration: userRole === 'MASTER' ? 120 : null,
        masterId: resolvedMasterId
      },
    });

    if (validReferralCodeObj) {`;
content = content.replace(/const user = await prisma\.user\.create\(\{[\s\S]*?\}\);\n\n\s*?\/\/ Apply Referral Record\n\s*?if \(validReferralCodeObj\) \{/, replacement);
fs_1.default.writeFileSync('src/routes/auth.ts', content);
console.log('patched auth');
//# sourceMappingURL=patch_auth_referral.js.map