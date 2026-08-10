import { Router } from 'express';
import * as stockController from '../controllers/stock.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { stockAdjustmentSchema } from '../validators/product.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Get movements ledger (Admin, Warehouse, Accounts)
router.get(
  '/movements',
  authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.ACCOUNTS),
  stockController.getMovements
);

// Manual stock adjustment (Admin, Warehouse only)
router.post(
  '/movements',
  authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE),
  validateBody(stockAdjustmentSchema),
  stockController.adjustStock
);

// Get movements for a specific product
router.get(
  '/products/:productId',
  authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.ACCOUNTS),
  stockController.getProductMovements
);

export default router;
