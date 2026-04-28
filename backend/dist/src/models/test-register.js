"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("./prismaClient"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function testRegister() {
    try {
        const password = 'password123';
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prismaClient_1.default.user.create({
            data: {
                name: 'test_script',
                phone: '+380990000000',
                password: hashedPassword,
                role: 'CLIENT',
                isActiveClient: true
            }
        });
        console.log('Successfully created:', user.id);
        await prismaClient_1.default.user.delete({ where: { id: user.id } });
    }
    catch (err) {
        console.error('Registration error:', err);
    }
}
testRegister();
//# sourceMappingURL=test-register.js.map