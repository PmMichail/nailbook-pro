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
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
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

// Function to delete image from Cloudinary by URL
export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) return;
  
  try {
    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) return;
    
    const publicIdWithExt = urlParts.slice(uploadIndex + 1).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension
    
    console.log('[CLOUDINARY] Deleting image:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('[CLOUDINARY] Delete result:', result);
  } catch (error) {
    console.error('[CLOUDINARY] Error deleting image:', error);
  }
};

// Function to delete all images for a master
export const deleteAllMasterImages = async (masterId: string, prisma: any): Promise<void> => {
  try {
    // Get all gallery items for the master
    const galleryItems = await prisma.galleryItem.findMany({
      where: { masterId },
      select: { imageUrl: true }
    });
    
    // Get portfolio items
    const portfolioItems = await prisma.portfolio.findMany({
      where: { masterId },
      select: { imageUrl: true }
    });
    
    // Get user avatar and salon logo
    const user = await prisma.user.findUnique({
      where: { id: masterId },
      select: { avatarUrl: true, salonLogo: true }
    });
    
    // Delete all images from Cloudinary
    const allUrls = [
      ...galleryItems.map((item: any) => item.imageUrl),
      ...portfolioItems.map((item: any) => item.imageUrl),
      user?.avatarUrl,
      user?.salonLogo
    ].filter(Boolean);
    
    console.log('[CLOUDINARY] Deleting', allUrls.length, 'images for master:', masterId);
    
    for (const url of allUrls) {
      await deleteFromCloudinary(url);
    }
  } catch (error) {
    console.error('[CLOUDINARY] Error deleting master images:', error);
  }
};
