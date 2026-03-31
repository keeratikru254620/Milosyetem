import { Router } from 'express';

import {
  createDocument,
  deleteDocument,
  getDocumentById,
  listDocuments,
  streamDocumentFile,
  updateDocument,
} from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { documentUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/files/:fileId', streamDocumentFile);
router.use(protect);
router.route('/').get(listDocuments).post(documentUpload.array('files', 10), createDocument);
router
  .route('/:id')
  .get(getDocumentById)
  .put(documentUpload.array('files', 10), updateDocument)
  .delete(deleteDocument);

export default router;
