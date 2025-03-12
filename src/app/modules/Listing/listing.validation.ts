import { z } from 'zod';

const createListingValidationSchema = z.object({
  body: z.object({
    location: z.string({
      required_error: 'Location is required',
    }),
    description: z.string({
      required_error: 'Description is required',
    }),
    rent: z.number({
      required_error: 'Rent amount is required',
    }),
    bedrooms: z.number({
      required_error: 'Number of bedrooms is required',
    }),
    images: z.array(
      z.string().url({
        message: 'Invalid image URL',
      }),
    ),
    amenities: z.array(
      z.string({
        required_error: 'amenities is required',
      }),
    ),
    isAvailable: z.boolean().optional(),
  }),
});

const updateListingValidationSchema = z.object({
  body: z.object({
    location: z.string().optional(),
    description: z.string().optional(),
    rent: z.number().optional(),
    bedrooms: z.number().optional(),
    images: z.array(z.string().url()).optional(),
    amenities: z.array(z.string()).optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const ListingValidation = {
  createListingValidationSchema,
  updateListingValidationSchema,
};
