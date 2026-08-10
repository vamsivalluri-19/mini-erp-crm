import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Get list and details (accessible by all roles to support sales challan build and dashboard charts)
router.get(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.SALES, UserRole.ACCOUNTS),
  productController.getProducts
);

router.get(
  '/categories',
  authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.SALES, UserRole.ACCOUNTS),
  productController.getCategories
);

router.get(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.SALES, UserRole.ACCOUNTS),
  productController.getProductById
);

// Create and update (Admin & Warehouse only)
router.post(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE),
  validateBody(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.WAREHOUSE),
  validateBody(updateProductSchema),
  productController.updateProduct
);

// Delete (Admin only)
router.delete(
  '/:id',
  authorizeRoles(UserRole.ADMIN),
  productController.deleteProduct
);

export default router;
