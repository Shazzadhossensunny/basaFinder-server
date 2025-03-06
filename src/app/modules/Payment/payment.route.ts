import express from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { PaymentValidation } from './payment.validation';

const router = express.Router();

// Callback route (no auth required)
router.get('/callback', PaymentController.handlePaymentCallback);

// Routes requiring tenant authentication
router.post(
  '/initiate/:requestId',
  auth(USER_ROLE.tenant),
  PaymentController.initiatePayment,
);

router.get(
  '/tenant',
  auth(USER_ROLE.tenant),
  PaymentController.getAllPaymentsByUser,
);

// Routes requiring landlord authentication
router.get(
  '/landlord',
  auth(USER_ROLE.landlord),
  PaymentController.getAllPaymentsByUser,
);

// Verification route
router.post(
  '/verify',
  auth(USER_ROLE.tenant, USER_ROLE.landlord, USER_ROLE.admin),
  validateRequest(PaymentValidation.verifyPaymentValidationSchema),
  PaymentController.verifyPayment,
);

// Common routes
router.get(
  '/:requestId',
  auth(USER_ROLE.tenant, USER_ROLE.landlord, USER_ROLE.admin),
  PaymentController.getPaymentByRequestId,
);

export const PaymentRoutes = router;
