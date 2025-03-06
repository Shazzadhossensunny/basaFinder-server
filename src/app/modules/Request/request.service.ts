import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Request } from './request.model';
import { TRequest, REQUEST_STATUS, PAYMENT_STATUS } from './request.interface';
import { RequestSearchableFields } from './request.constant';
import { USER_ROLE } from '../User/user.constant';
import { Listing } from '../Listing/listing.model';
import mongoose from 'mongoose';
import { User } from '../User/user.model';
import { sendEmail } from '../../utils/sendMail';
import { PaymentService } from '../Payment/payment.service';
// import { PaymentService } from '../Payment/payment.service';

const createRequest = async (payload: TRequest, user: any) => {
  // Ensure the user is a tenant
  if (user.role !== USER_ROLE.tenant) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only tenants can create rental requests',
    );
  }

  // Verify the listing exists
  const listing = await Listing.findById(payload.listingId);
  if (!listing) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Listing not found');
  }

  // Verify the listing is available
  if (!listing.isAvailable) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This property is no longer available for rent',
    );
  }

  // Check if the tenant already has a pending request for this listing
  const existingRequest = await Request.findOne({
    listingId: payload.listingId,
    tenantId: user.id,
    status: REQUEST_STATUS.pending,
  });

  if (existingRequest) {
    throw new AppError(
      StatusCodes.CONFLICT,
      'You already have a pending request for this property',
    );
  }

  // Set the tenantId to the current user's ID
  payload.tenantId = new mongoose.Types.ObjectId(user.id);

  const result = await Request.create(payload);

  // Send email notification to landlord
  try {
    const landlord = await User.findById(listing.landlordId);
    if (landlord && landlord.email) {
      await sendEmail(
        landlord.email,
        'New Rental Request',
        `You have received a new rental request for your property at ${listing.location}.`,
      );
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }

  return result;
};

const getTenantRequests = async (
  tenantId: string,
  query: Record<string, unknown>,
) => {
  const requestQuery = new QueryBuilder(
    Request.find({ tenantId }).populate([
      {
        path: 'listingId',
        select: 'location rent bedrooms images',
      },
      {
        path: 'tenantId',
        select: 'name email',
      },
    ]),
    query,
  )
    .search(RequestSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await requestQuery.modelQuery;
  const meta = await requestQuery.countTotal();

  return {
    result,
    meta,
  };
};

const getLandlordRequests = async (
  landlordId: string,
  query: Record<string, unknown>,
) => {
  // Get all listings by this landlord
  const listings = await Listing.find({ landlordId });
  const listingIds = listings.map((listing) => listing._id);

  // Find all requests for these listings
  const requestQuery = new QueryBuilder(
    Request.find({ listingId: { $in: listingIds } }).populate([
      {
        path: 'listingId',
        select: 'location rent bedrooms images',
      },
      {
        path: 'tenantId',
        select: 'name email phoneNumber',
      },
    ]),
    query,
  )
    .search(RequestSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await requestQuery.modelQuery;
  const meta = await requestQuery.countTotal();

  return {
    result,
    meta,
  };
};

const getRequestById = async (id: string, user: any) => {
  const request = await Request.findById(id).populate([
    {
      path: 'listingId',
      select: 'location rent bedrooms images landlordId',
      populate: {
        path: 'landlordId',
        select: 'name email',
      },
    },
    {
      path: 'tenantId',
      select: 'name email phoneNumber',
    },
  ]);

  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Request not found');
  }

  // Check authorization based on user role
  if (user.role === USER_ROLE.tenant) {
    // Tenants can only view their own requests
    if (request?.tenantId?._id.toString() !== user?.id.toString()) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to view this request',
      );
    }
  } else if (user.role === USER_ROLE.landlord) {
    // Landlords can only view requests for their own listings
    const listing = await Listing.findById(request.listingId);
    if (!listing || listing.landlordId.toString() !== user?.id.toString()) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to view this request',
      );
    }
  }

  return request;
};

const updateRequestStatus = async (
  id: string,
  status: TRequest['status'],
  landlordPhoneNumber: string | undefined,
  user: any,
) => {
  const request = await Request.findById(id);

  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Request not found');
  }

  // Get the listing to check ownership
  const listing = await Listing.findById(request.listingId);

  if (!listing) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Associated listing not found');
  }

  // Only the landlord of the listing or an admin can update request status
  if (
    user.role !== USER_ROLE.admin &&
    (user.role !== USER_ROLE.landlord ||
      listing.landlordId.toString() !== user.id.toString())
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to update this request',
    );
  }

  // Update the request
  const updateData: Partial<TRequest> = { status };
  console.log(user);

  if (status === REQUEST_STATUS.approved) {
    if (landlordPhoneNumber) {
      updateData.landlordPhoneNumber = landlordPhoneNumber;
    } else {
      // Get the landlord's phone number from their profile
      const landlord = await User.findById(user.id);
      if (landlord && landlord.phoneNumber) {
        updateData.landlordPhoneNumber = landlord.phoneNumber;
      }
    }
  }

  const updatedRequest = await Request.findByIdAndUpdate(id, updateData, {
    new: true,
  }).populate([
    {
      path: 'listingId',
      select: 'location rent bedrooms images',
    },
    {
      path: 'tenantId',
      select: 'name email',
    },
  ]);

  // Send email notification to tenant
  try {
    const tenant = await User.findById(request.tenantId);
    if (tenant && tenant.email) {
      const statusMessage =
        status === REQUEST_STATUS.approved
          ? 'Your rental request has been approved. You can now proceed with payment.'
          : 'Your rental request has been rejected.';

      await sendEmail(
        tenant.email,
        `Rental Request ${
          status === REQUEST_STATUS.approved ? 'Approved' : 'Rejected'
        }`,
        `${statusMessage} Property: ${listing.location}`,
      );
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }

  return updatedRequest;
};

const updatePaymentStatus = async (
  requestId: string,
  paymentStatus: TRequest['paymentStatus'],
  user: any,
) => {
  const request = await Request.findById(requestId);

  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Request not found');
  }

  // Only the tenant who made the request can update payment status
  if (
    user.role !== USER_ROLE.admin &&
    (user.role !== USER_ROLE.tenant ||
      request.tenantId.toString() !== user.id.toString())
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to update this payment',
    );
  }

  // Can only update payment if request is approved
  if (request.status !== REQUEST_STATUS.approved) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Cannot process payment for a request that is not approved',
    );
  }

  const updatedRequest = await Request.findByIdAndUpdate(
    requestId,
    { paymentStatus },
    { new: true },
  ).populate([
    {
      path: 'listingId',
      select: 'location rent bedrooms images',
    },
    {
      path: 'tenantId',
      select: 'name email',
    },
  ]);

  // If payment is successful, set listing as unavailable
  if (paymentStatus === PAYMENT_STATUS.paid) {
    await Listing.findByIdAndUpdate(request.listingId, {
      isAvailable: false,
    });

    // Notify the landlord about successful payment
    try {
      const listing = await Listing.findById(request.listingId);
      if (listing) {
        const landlord = await User.findById(listing.landlordId);
        if (landlord && landlord.email) {
          await sendEmail(
            landlord.email,
            'Payment Received for Rental',
            `The tenant has completed payment for your property at ${listing.location}.`,
          );
        }
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  return updatedRequest;
};

const initiateRequestPayment = async (
  requestId: string,
  user: any,
  req: any,
) => {
  // Validate requestId format
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid request ID format');
  }

  // Find the request to verify it exists before proceeding to payment
  const request = await Request.findById(requestId);
  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Rental request not found');
  }

  // Verify the request is in approved status
  if (request.status !== REQUEST_STATUS.approved) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Only approved requests can proceed to payment',
    );
  }
  // console.log('user', user.id.toString());
  // console.log(request.tenantId.toString());
  //!need
  // // Verify the tenant is the one making the payment
  // if (request.tenantId !== user.id) {
  //   throw new AppError(
  //     StatusCodes.FORBIDDEN,
  //     'You can only make payments for your own requests',
  //   );
  // }

  // This is a wrapper around the PaymentService.initiatePayment
  return PaymentService.initiatePayment(requestId, user.id, req);
};

export const RequestServices = {
  createRequest,
  getTenantRequests,
  getLandlordRequests,
  getRequestById,
  updateRequestStatus,
  updatePaymentStatus,
  initiateRequestPayment,
};
