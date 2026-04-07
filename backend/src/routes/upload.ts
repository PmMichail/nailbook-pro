import { Router } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Доки у нас немає ключів Cloudinary, збережемо локально для тестування
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp'); // Зберігаємо в tmp 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Завантаження фото
router.post('/', upload.single('photo'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не знайдено' });
    }
    
    // В реальності тут ми б завантажили файл у Cloudinary (streamUpload)
    // const result = await cloudinary.uploader.upload(req.file.path);
    // return res.json({ url: result.secure_url });

    // Для зараз - повертаємо "фейкове" або локальне посилання
    const fakeUrl = `https://via.placeholder.com/600x400.png?text=Photo+Upload+Stub`;
    
    res.json({ url: fakeUrl });
  } catch (error) {
    res.status(500).json({ error: 'Помилка завантаження' });
  }
});

export default router;
