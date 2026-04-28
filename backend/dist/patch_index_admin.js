"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
let content = fs_1.default.readFileSync('src/index.ts', 'utf8');
if (!content.includes('/api/admin')) {
    content = content.replace("import webhookRoutes from './routes/webhooks';", "import webhookRoutes from './routes/webhooks';\nimport adminRoutes from './routes/admin';");
    content = content.replace("app.use('/api/webhooks', webhookRoutes);", "app.use('/api/webhooks', webhookRoutes);\napp.use('/api/admin', adminRoutes);");
    fs_1.default.writeFileSync('src/index.ts', content);
    console.log("Patched index.ts");
}
//# sourceMappingURL=patch_index_admin.js.map