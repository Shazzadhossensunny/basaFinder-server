import { z } from 'zod';

export const initiatePaymentValidationSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    customer: z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      phone: z.string().min(10, 'Phone number is required'),
      address: z.string().min(1, 'Address is required'),
      city: z.string().min(1, 'City is required'),
    }),
  }),
});
