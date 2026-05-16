import { Router } from 'express';
import { 
  createEvent, 
  updateEvent, 
  forceEventStatus, 
  getAdminEvents, 
  getMarketplaceEvents, 
  getEventDetail 
} from '../controllers/event.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin Routes
router.post('/admin', requireAuth, requireAdmin, createEvent);
router.put('/admin/:id', requireAuth, requireAdmin, updateEvent);
router.patch('/admin/:id/status', requireAuth, requireAdmin, forceEventStatus);
router.get('/admin', requireAuth, requireAdmin, getAdminEvents);

// Customer / Public Routes
router.get('/', requireAuth, getMarketplaceEvents);
router.get('/:id', requireAuth, getEventDetail);

export default router;
