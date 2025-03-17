import { z } from 'zod';
const userValidationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['landlord', 'tenant', 'admin']).optional(),
});

const updateProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email').optional(),
    phoneNumber: z.string().min(1, 'Phone number is required').optional(),
  }),
});
const changePasswordValidation = z.object({
  body: z.object({
    currentPassword: z.string().min(6, 'Old password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
  }),
});
const toggleStatusValidation = z.object({
  body: z.object({
    id: z.string(),
  }),
});
export const UserValidation = {
  userValidationSchema,
  updateProfileValidationSchema,
  changePasswordValidation,
  toggleStatusValidation,
};
