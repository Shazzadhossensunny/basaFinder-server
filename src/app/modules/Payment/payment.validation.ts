import { z } from 'zod';
import { PAYMENT_STATUS } from './payment.interface';

const initiatePaymentValidationSchema = z.object({
  body: z.object({
    requestId: z.string({
      required_error: 'Request ID is required',
    }),
    customerInfo: z.object({
      name: z.string({
        required_error: 'Customer name is required',
      }),
      email: z
        .string({
          required_error: 'Customer email is required',
        })
        .email('Invalid email format'),
      phone: z.string({
        required_error: 'Customer phone is required',
      }),
      address: z.string({
        required_error: 'Customer address is required',
      }),
      city: z.string({
        required_error: 'Customer city is required',
      }),
      postalCode: z.string({
        required_error: 'Customer postal code is required',
      }),
    }),
  }),
});

const verifyPaymentValidationSchema = z.object({
  body: z.object({
    paymentOrderId: z.string({
      required_error: 'Payment order ID is required',
    }),
  }),
});

export const PaymentValidation = {
  initiatePaymentValidationSchema,
  verifyPaymentValidationSchema,
};
