// src/modules/Request/request.routes.ts
import express from 'express';
import { RequestControllers } from './request.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { RequestValidation } from './request.validation';

const router = express.Router();

// Tenant routes
router.post(
  '/',
  auth(USER_ROLE.tenant),
  validateRequest(RequestValidation.createRequestValidationSchema),
  RequestControllers.createRequest,
);

router.get(
  '/tenant',
  auth(USER_ROLE.tenant),
  RequestControllers.getTenantRequests,
);

router.patch(
  '/:id/payment',
  auth(USER_ROLE.tenant),
  validateRequest(RequestValidation.updatePaymentStatusValidationSchema),
  RequestControllers.updatePaymentStatus,
);

// Landlord routes
router.get(
  '/landlord',
  auth(USER_ROLE.landlord),
  RequestControllers.getLandlordRequests,
);

router.patch(
  '/:id/status',
  auth(USER_ROLE.landlord),
  validateRequest(RequestValidation.updateRequestStatusValidationSchema),
  RequestControllers.updateRequestStatus,
);

// Common routes
router.get(
  '/:id',
  auth(USER_ROLE.tenant, USER_ROLE.landlord, USER_ROLE.admin),
  RequestControllers.getRequestById,
);

export const RequestRoutes = router;
