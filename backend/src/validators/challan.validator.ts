import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  items: z.array(challanItemSchema).min(1, 'Challan must contain at least 1 item'),
  status: z.nativeEnum(ChallanStatus).optional().default(ChallanStatus.DRAFT),
}).refine(
  (data) => {
    const ids = data.items.map((item) => item.productId);
    return ids.length === new Set(ids).size;
  },
  {
    message: 'Duplicate products in items list are not allowed',
    path: ['items'],
  }
);

export const updateChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID').optional(),
  items: z.array(challanItemSchema).min(1, 'Challan must contain at least 1 item').optional(),
}).refine(
  (data) => {
    if (!data.items) return true;
    const ids = data.items.map((item) => item.productId);
    return ids.length === new Set(ids).size;
  },
  {
    message: 'Duplicate products in items list are not allowed',
    path: ['items'],
  }
);

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
