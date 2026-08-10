import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

export default router;
