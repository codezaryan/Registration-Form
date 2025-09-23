import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs/promises';

// Configure Cloudinary only if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'photo') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for photos'));
      }
    } else if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for videos'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

// Local file storage fallback when Cloudinary is not configured
const saveToLocalStorage = async (buffer: Buffer, folder: string, filename: string): Promise<any> => {
  const uploadDir = path.join(process.cwd(), 'src/uploads', folder);

  try {
    // Create directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    // Return mock response similar to Cloudinary
    return {
      secure_url: `http://localhost:5000/uploads/${folder}/${filename}`,
      public_id: filename,
      format: filename.split('.').pop(),
      bytes: buffer.length,
      width: null,
      height: null,
      url: `http://localhost:5000/uploads/${folder}/${filename}`
    };
  } catch (error) {
    throw new Error(`Failed to save file locally: ${error}`);
  }
};

export const uploadToCloudinary = async (buffer: Buffer, folder: string, resourceType: 'image' | 'video' = 'image'): Promise<any> => {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
    console.log('⚠️ Cloudinary not configured, using local storage fallback');

    // Generate filename with timestamp
    const timestamp = Date.now();
    const extension = resourceType === 'image' ? 'jpg' : 'mp4';
    const filename = `${timestamp}.${extension}`;

    return await saveToLocalStorage(buffer, folder, filename);
  }

  // Use Cloudinary if configured
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `registrations/${folder}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

export default cloudinary;