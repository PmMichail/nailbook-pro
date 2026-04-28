"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.uploadCloud = exports.storage = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.error('[CLOUDINARY] Initialization CHECK!');
console.error(`CLOUD_NAME present: ${!!process.env.CLOUDINARY_CLOUD_NAME}`);
console.error(`API_KEY present: ${!!process.env.CLOUDINARY_API_KEY}`);
console.error(`API_SECRET present: ${!!process.env.CLOUDINARY_API_SECRET}`);
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
exports.storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (req, file) => {
        return {
            folder: 'nailbook_pro',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
        };
    },
});
exports.uploadCloud = (0, multer_1.default)({ storage: exports.storage });
//# sourceMappingURL=cloudinary.js.map