import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'gov-doc-pro-backend',
    timestamp: new Date().toISOString(),
  });
});

export default router;
