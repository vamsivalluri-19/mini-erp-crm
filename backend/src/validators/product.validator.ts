import { z } from 'zod';

export const createProductSchema = z.object({
  productName: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU must be at least 2 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  unitPrice: z.number().min(0, 'Unit price must not be negative'),
  currentStock: z.number().int().min(0, 'Current stock must not be negative').optional().default(0),
  minimumStock: z.number().int().min(0, 'Minimum stock must not be negative').optional().default(0),
  warehouseLocation: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  movementType: z.enum(['IN', 'OUT'], {
    errorMap: () => ({ message: 'Movement type must be IN or OUT' }),
  }),
  reason: z.string().min(2, 'Reason must be at least 2 characters'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
