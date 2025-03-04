import express from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { initiatePaymentValidationSchema } from './payment.validation';

const router = express.Router();
router.get('/callback', PaymentController.handlePaymentCallback);

router.post(
  '/initiate/:orderId',
  auth(USER_ROLE.customer),
  validateRequest(initiatePaymentValidationSchema),
  PaymentController.initiatePayment,
);
export const paymentRoute = router;
