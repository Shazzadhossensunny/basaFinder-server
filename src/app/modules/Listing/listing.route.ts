// src/modules/Listing/listing.routes.ts
import express from 'express';
import { ListingControllers } from './listing.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { ListingValidation } from './listing.validation';

const router = express.Router();

// Landlord routes
router.post(
  '/',
  auth(USER_ROLE.landlord),
  validateRequest(ListingValidation.createListingValidationSchema),
  ListingControllers.createListing,
);

router.get(
  '/landlord/my-listings',
  auth(USER_ROLE.landlord),
  ListingControllers.getLandlordListings,
);

router.put(
  '/:id',
  auth(USER_ROLE.landlord, USER_ROLE.admin),
  validateRequest(ListingValidation.updateListingValidationSchema),
  ListingControllers.updateListing,
);

router.delete(
  '/:id',
  auth(USER_ROLE.landlord, USER_ROLE.admin),
  ListingControllers.deleteListing,
);

// Public routes
router.get('/:id', ListingControllers.getListingById);
router.get('/', ListingControllers.getAllListings);
export const ListingRoutes = router;
