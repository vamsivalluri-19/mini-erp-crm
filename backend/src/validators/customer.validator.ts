import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

const dateSchema = z.preprocess((val) => {
  if (typeof val === 'string' || val instanceof Date) {
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}, z.date().optional());

export const createCustomerSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format (e.g. 22AAAAA0000A1Z5)').optional().nullable().or(z.literal('')),
  customerType: z.nativeEnum(CustomerType, {
    errorMap: () => ({ message: 'Invalid customer type. Must be RETAIL, WHOLESALE, or DISTRIBUTOR' }),
  }),
  address: z.string().optional().nullable(),
  status: z.nativeEnum(CustomerStatus).optional().default(CustomerStatus.LEAD),
  followUpDate: dateSchema.nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  followUpDate: z.preprocess((val) => {
    if (typeof val === 'string' || val instanceof Date) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  }, z.date({ required_error: 'Follow-up date is required' })),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
