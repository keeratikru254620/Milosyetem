import { Router } from 'express';

import { getProfile, login, register } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getProfile);

export default router;
