"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClient = exports.requireMaster = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Немає доступу. Токен відсутній.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Недійсний токен авторизації' });
    }
};
exports.authenticate = authenticate;
const requireMaster = (req, res, next) => {
    if (req.user?.role !== 'MASTER') {
        return res.status(403).json({ error: 'Доступ заборонено. Потрібні права майстра.' });
    }
    next();
};
exports.requireMaster = requireMaster;
const requireClient = (req, res, next) => {
    if (req.user?.role !== 'CLIENT') {
        return res.status(403).json({ error: 'Доступ заборонено.' });
    }
    next();
};
exports.requireClient = requireClient;
//# sourceMappingURL=auth.js.map