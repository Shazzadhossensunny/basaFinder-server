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
    moveInDate: z
      .string({
        required_error: 'Move-in date is required',
      })
      .refine(
        (date) => {
          const moveInDate = new Date(date);
          const today = new Date();
          return moveInDate >= today;
        },
        {
          message: 'Move-in date must be in the future',
        },
      ),
    rentalDuration: z
      .number({
        required_error: 'Rental duration is required',
      })
      .min(1, 'Rental duration must be at least 1 month'),
    specialRequirements: z.string().optional(),
    agreedToTerms: z
      .boolean({
        required_error: 'You must agree to the terms and conditions',
      })
      .refine((value) => value === true, {
        message: 'You must agree to the terms and conditions',
      }),
  }),
});

const updateRequestStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(
      [...Object.values(REQUEST_STATUS)] as [string, ...string[]],
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
      [...Object.values(PAYMENT_STATUS)] as [string, ...string[]],
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
