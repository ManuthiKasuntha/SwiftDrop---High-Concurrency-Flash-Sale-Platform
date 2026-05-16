import { Router } from 'express';
import { register, login, logout, getProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/profile', requireAuth, getProfile);

export default router;
