import { Router } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadCloud } from '../services/cloudinary';

const router = Router();
router.use(authenticate);

router.post('/', (req, res, next) => {
    console.error(`[UPLOAD PROD LOG] Attempting upload by user: ${req.user?.id}`);
    uploadCloud.single('photo')(req, res, (err) => {
        if (err) {
            console.error(`[UPLOAD PROD ERROR] Multer/Cloudinary error:`, err);
            return res.status(500).json({ error: 'Помилка завантаження файлу', details: err.message });
        }
        next();
    });
}, async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      console.error(`[UPLOAD PROD ERROR] No file found in request! User: ${req.user?.id}`);
      return res.status(400).json({ error: 'Файл не знайдено' });
    }
    
    console.error(`[UPLOAD PROD SUCCESS] File uploaded to: ${req.file.path}`);
    res.json({ url: req.file.path.replace(/\\/g, '/') });
  } catch (error: any) {
    console.error(`[UPLOAD PROD CATCH ERROR]`, error);
    res.status(500).json({ error: 'Помилка завантаження', details: error.message });
  }
});

export default router;
