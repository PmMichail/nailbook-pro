"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const cloudinary_1 = require("../services/cloudinary");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (req, res, next) => {
    console.error(`[UPLOAD PROD LOG] Attempting upload by user: ${req.user?.id}`);
    cloudinary_1.uploadCloud.single('photo')(req, res, (err) => {
        if (err) {
            console.error(`[UPLOAD PROD ERROR] Multer/Cloudinary error:`, err);
            return res.status(500).json({ error: 'Помилка завантаження файлу', details: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            console.error(`[UPLOAD PROD ERROR] No file found in request! User: ${req.user?.id}`);
            return res.status(400).json({ error: 'Файл не знайдено' });
        }
        console.error(`[UPLOAD PROD SUCCESS] File uploaded to: ${req.file.path}`);
        res.json({ url: req.file.path.replace(/\\/g, '/') });
    }
    catch (error) {
        console.error(`[UPLOAD PROD CATCH ERROR]`, error);
        res.status(500).json({ error: 'Помилка завантаження', details: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map