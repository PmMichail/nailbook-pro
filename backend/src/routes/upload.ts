import { Router } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

import { uploadCloud } from '../services/cloudinary';
// uploadCloud replaces multer({ storage })

// Завантаження фото
router.post('/', uploadCloud.single('photo'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не знайдено' });
    }
    
    // Cloudinary returns the secure url in req.file.path
    res.json({ url: req.file.path.replace(/\\/g, '/') });
  } catch (error) {
    res.status(500).json({ error: 'Помилка завантаження' });
  }
});

export default router;
