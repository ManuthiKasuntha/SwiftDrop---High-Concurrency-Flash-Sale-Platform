import { Router } from 'express';
import { reserveStock, confirmPurchase, cancelReservation } from '../controllers/purchase.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/reserve', requireAuth, reserveStock);
router.post('/confirm', requireAuth, confirmPurchase);
router.post('/cancel', requireAuth, cancelReservation);

export default router;
