import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createCustomerSchema, updateCustomerSchema, createFollowUpSchema } from '../validators/customer.validator';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Customers list and retrieve
router.get(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS),
  customerController.getCustomers
);

router.get(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS),
  customerController.getCustomerById
);

// Create and update customer
router.post(
  '/',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES),
  validateBody(createCustomerSchema),
  customerController.createCustomer
);

router.put(
  '/:id',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES),
  validateBody(updateCustomerSchema),
  customerController.updateCustomer
);

// Delete customer
router.delete(
  '/:id',
  authorizeRoles(UserRole.ADMIN),
  customerController.deleteCustomer
);

// Customer CRM Follow-ups
router.get(
  '/:id/followups',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS),
  customerController.getFollowUps
);

router.post(
  '/:id/followups',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES),
  validateBody(createFollowUpSchema),
  customerController.addFollowUp
);

router.put(
  '/:id/followups/:followUpId',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES),
  validateBody(createFollowUpSchema),
  customerController.updateFollowUp
);

router.delete(
  '/:id/followups/:followUpId',
  authorizeRoles(UserRole.ADMIN, UserRole.SALES),
  customerController.deleteFollowUp
);

export default router;
