import express from 'express';
import {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
  getStats,
  createAdminRegistration
} from '../controllers/registrationController';
import { upload } from '../utils/cloudinary';

const router = express.Router();

router.get('/', getRegistrations);
router.get('/stats', getStats);
router.get('/:id', getRegistrationById);
router.post('/', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), createRegistration);
router.post('/admin', createAdminRegistration); // Admin-only endpoint without file requirements
router.put('/:id', updateRegistration);
router.delete('/:id', deleteRegistration);

export default router;