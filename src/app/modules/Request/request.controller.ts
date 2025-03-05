// src/modules/Request/request.controller.ts
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { RequestServices } from './request.service';
import { TRequest } from './request.interface';

const createRequest = catchAsync(async (req, res) => {
  const result = await RequestServices.createRequest(req.body, req?.user);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Rental request submitted successfully',
    data: result,
  });
});

const getTenantRequests = catchAsync(async (req, res) => {
  const result = await RequestServices.getTenantRequests(
    req.user.id,
    req.query,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Your rental requests retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getLandlordRequests = catchAsync(async (req, res) => {
  const result = await RequestServices.getLandlordRequests(
    req.user.id,
    req.query,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Rental requests for your properties retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getRequestById = catchAsync(async (req, res) => {
  const result = await RequestServices.getRequestById(req.params.id, req?.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Rental request retrieved successfully',
    data: result,
  });
});

const updateRequestStatus = catchAsync(async (req, res) => {
  const { status, landlordPhoneNumber } = req.body;

  const result = await RequestServices.updateRequestStatus(
    req.params.id,
    status,
    landlordPhoneNumber,
    req?.user,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Rental request ${status} successfully`,
    data: result,
  });
});

const updatePaymentStatus = catchAsync(async (req, res) => {
  const { paymentStatus } = req.body as Pick<TRequest, 'paymentStatus'>;

  const result = await RequestServices.updatePaymentStatus(
    req.params.id,
    paymentStatus,
    req?.user,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Payment status updated successfully',
    data: result,
  });
});

export const RequestControllers = {
  createRequest,
  getTenantRequests,
  getLandlordRequests,
  getRequestById,
  updateRequestStatus,
  updatePaymentStatus,
};
