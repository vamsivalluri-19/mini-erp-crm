import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(UserRole.ADMIN));

router.get('/', userController.getUsers);
router.post('/', validateBody(createUserSchema), userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', validateBody(updateUserSchema), userController.updateUser);

export default router;
