"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const token = jsonwebtoken_1.default.sign({ id: '031a1e76-1921-442e-ba7d-955ee2e87b18', role: 'MASTER' }, 'nailbook_pro_super_secret_jwt_key_2026', { expiresIn: '1h' });
console.log(token);
//# sourceMappingURL=get_token.js.map