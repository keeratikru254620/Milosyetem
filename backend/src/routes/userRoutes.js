import { Router } from 'express';

import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.route('/').get(listUsers).post(createUser);
router.route('/:id').put(updateUser).delete(deleteUser);

export default router;
