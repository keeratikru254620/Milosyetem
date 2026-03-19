import { Router } from 'express';

import {
  createDocType,
  deleteDocType,
  listDocTypes,
  updateDocType,
} from '../controllers/docTypeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.route('/').get(listDocTypes).post(createDocType);
router.route('/:id').put(updateDocType).delete(deleteDocType);

export default router;
