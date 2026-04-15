import fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf8');

if (!content.includes('/api/admin')) {
    content = content.replace("import webhookRoutes from './routes/webhooks';", "import webhookRoutes from './routes/webhooks';\nimport adminRoutes from './routes/admin';");
    content = content.replace("app.use('/api/webhooks', webhookRoutes);", "app.use('/api/webhooks', webhookRoutes);\napp.use('/api/admin', adminRoutes);");
    fs.writeFileSync('src/index.ts', content);
    console.log("Patched index.ts");
}
