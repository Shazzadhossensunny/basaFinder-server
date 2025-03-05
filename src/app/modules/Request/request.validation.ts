// src/modules/Request/request.validation.ts
import { z } from 'zod';
import { REQUEST_STATUS, PAYMENT_STATUS } from './request.interface';

const createRequestValidationSchema = z.object({
  body: z.object({
    listingId: z.string({
      required_error: 'Listing ID is required',
    }),
    message: z.string({
      required_error: 'Message is required',
    }),
  }),
});

const updateRequestStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(
      [
        REQUEST_STATUS.pending,
        REQUEST_STATUS.approved,
        REQUEST_STATUS.rejected,
      ],
      {
        required_error: 'Status is required',
      },
    ),
    landlordPhoneNumber: z.string().optional(),
  }),
});

const updatePaymentStatusValidationSchema = z.object({
  body: z.object({
    paymentStatus: z.enum(
      [PAYMENT_STATUS.pending, PAYMENT_STATUS.paid, PAYMENT_STATUS.failed],
      {
        required_error: 'Payment status is required',
      },
    ),
  }),
});

export const RequestValidation = {
  createRequestValidationSchema,
  updateRequestStatusValidationSchema,
  updatePaymentStatusValidationSchema,
};
