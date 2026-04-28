"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'admin@nailbook.pro';
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
        console.log('Admin already exists.');
        return;
    }
    const hashedPassword = await bcrypt_1.default.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            name: 'NailBook Admin',
            email,
            password: hashedPassword,
            role: 'ADMIN' // Type-checked by Prisma
        }
    });
    console.log('Admin created successfully:', admin.id);
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=seed_admin.js.map