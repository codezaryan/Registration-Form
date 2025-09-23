import { Request, Response } from 'express';
import { storage } from '../utils/storage';
import { uploadToCloudinary } from '../utils/cloudinary';

export const createRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate required files
    if (!req.files || !('photo' in req.files) || !('video' in req.files)) {
      res.status(400).json({ error: 'Photo and video are required' });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Validate file sizes
    if (!files.photo?.[0] || files.photo[0].size > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Photo size must be less than 5MB' });
      return;
    }
    if (!files.video?.[0] || files.video[0].size > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'Video size must be less than 10MB' });
      return;
    }

    // Upload files to Cloudinary
    const [photoResult, videoResult] = await Promise.all([
      uploadToCloudinary(files.photo[0].buffer, 'photos', 'image'),
      uploadToCloudinary(files.video[0].buffer, 'videos', 'video')
    ]);

    // Create registration record
    const registration = await storage.create({
      ...req.body,
      photoUrl: photoResult.secure_url,
      videoUrl: videoResult.secure_url,
    });

    res.status(201).json({
      message: 'Registration submitted successfully',
      registration
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getRegistrations = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const filters: any = {};
    if (req.query.search) filters.search = req.query.search;
    if (req.query.state) filters.state = req.query.state;
    if (req.query.city) filters.city = req.query.city;
    if (req.query.gender) filters.gender = req.query.gender;
    
    const allRegistrations = await storage.findAll(filters);
    const total = allRegistrations.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    
    const registrations = allRegistrations.slice(skip, skip + limit);
    
    res.json({
      registrations,
      pagination: {
        currentPage: page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRegistrationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: 'Registration ID is required' });
      return;
    }
    const registration = await storage.findById(parseInt(id));
    if (!registration) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }
    res.json(registration);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: 'Registration ID is required' });
      return;
    }
    const registration = await storage.update(parseInt(id), req.body);
    if (!registration) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }
    res.json({ message: 'Registration updated successfully', registration });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: 'Registration ID is required' });
      return;
    }
    const success = await storage.delete(parseInt(id));
    if (!success) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }
    res.json({ message: 'Registration deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await storage.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Admin-only endpoint to create registration without files
export const createAdminRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    // Create registration record with placeholder URLs for admin-created entries
    const registration = await storage.create({
      ...req.body,
      photoUrl: req.body.photoUrl || '/placeholder-photo.jpg',
      videoUrl: req.body.videoUrl || '/placeholder-video.mp4',
    });

    res.status(201).json({
      message: 'Registration created successfully by admin',
      registration
    });
  } catch (error: any) {
    console.error('Admin registration creation error:', error);
    res.status(400).json({ error: error.message });
  }
};
