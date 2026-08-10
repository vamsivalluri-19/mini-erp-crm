import { Router } from 'express';
import * as challanController from '../controllers/challan.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createChallanSchema, updateChallanSchema } from '../validators/challan.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Get list and details (Admin, Sales, Accounts)
router.get(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS),
  challanController.getChallans
);

router.get(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS),
  challanController.getChallanById
);

// Create challan (Admin, Sales)
router.post(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES),
  validateBody(createChallanSchema),
  challanController.createChallan
);

// Update challan (Admin, Sales)
router.put(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES),
  validateBody(updateChallanSchema),
  challanController.updateChallan
);

// Confirm and Cancel actions
router.post(
  '/:id/confirm',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES),
  challanController.confirmChallan
);

router.post(
  '/:id/cancel',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES),
  challanController.cancelChallan
);

export default router;
