// src/modules/Listing/listing.controller.ts
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ListingServices } from './listing.service';

const createListing = catchAsync(async (req, res) => {
  const result = await ListingServices.createListing(req.body, req?.user);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Listing created successfully',
    data: result,
  });
});

const getAllListings = catchAsync(async (req, res) => {
  const result = await ListingServices.getAllListings(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Listings retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getLandlordListings = catchAsync(async (req, res) => {
  const result = await ListingServices.getLandlordListings(
    req.user.id,
    req.query,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Your listings retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getListingById = catchAsync(async (req, res) => {
  const result = await ListingServices.getListingById(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Listing retrieved successfully',
    data: result,
  });
});

const updateListing = catchAsync(async (req, res) => {
  const result = await ListingServices.updateListing(
    req.params.id,
    req.body,
    req?.user?.role,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Listing updated successfully',
    data: result,
  });
});

const deleteListing = catchAsync(async (req, res) => {
  const result = await ListingServices.deleteListing(
    req.params.id,
    req?.user?.role,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Listing deleted successfully',
    data: result,
  });
});

export const ListingControllers = {
  createListing,
  getAllListings,
  getLandlordListings,
  getListingById,
  updateListing,
  deleteListing,
};
