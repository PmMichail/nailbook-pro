import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

console.error('[CLOUDINARY] Initialization CHECK!');
console.error(`CLOUD_NAME present: ${!!process.env.CLOUDINARY_CLOUD_NAME}`);
console.error(`API_KEY present: ${!!process.env.CLOUDINARY_API_KEY}`);
console.error(`API_SECRET present: ${!!process.env.CLOUDINARY_API_SECRET}`);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'nailbook_pro',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
    };
  },
});

export const uploadCloud = multer({ storage });
export { cloudinary };
