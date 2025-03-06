import axios from 'axios';
import mongoose, { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Request } from '../Request/request.model';
import { Listing } from '../Listing/listing.model';
import { User } from '../User/user.model';
import { Payment } from './payment.model';
import {
  REQUEST_STATUS,
  PAYMENT_STATUS as REQUEST_PAYMENT_STATUS,
} from '../Request/request.interface';
import {
  SurjoPayAuthResponse,
  SurjoPayCustomer,
  PAYMENT_STATUS,
} from './payment.interface';
import { surjoPayConfig } from '../../config';
import { PaymentSearchableFields } from './payment.constant';
import QueryBuilder from '../../builder/QueryBuilder';
import { sendEmail } from '../../utils/sendMail';

interface PopulatedListing {
  _id: Types.ObjectId;
  location: string;
  rent: number;
  landlordId: {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };
}

interface PopulatedTenant {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phoneNumber: string;
}

export const getAuthToken = async (): Promise<SurjoPayAuthResponse> => {
  try {
    const response = await axios.post(
      `${surjoPayConfig.SP_ENDPOINT}/get_token`,
      {
        username: surjoPayConfig.SP_USERNAME,
        password: surjoPayConfig.SP_PASSWORD,
      },
    );

    if (!response.data.token) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        'Failed to get authentication token',
      );
    }

    return response.data;
  } catch (error: any) {
    console.error('Auth token error:', error.response?.data || error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Payment gateway authentication failed',
    );
  }
};

export const verifyPaymentWithShurjoPay = async (paymentId: string) => {
  try {
    const authResponse = await getAuthToken();
    const verification = await axios.post(
      `${surjoPayConfig.SP_ENDPOINT}/verification`,
      { order_id: paymentId },
      {
        headers: {
          Authorization: `Bearer ${authResponse.token}`,
        },
      },
    );
    return verification.data[0];
  } catch (error: any) {
    console.error(
      'Payment verification failed:',
      error.response?.data || error,
    );
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Payment verification failed: ' + error.message,
    );
  }
};

const initiatePayment = async (requestId: string, userId: string, req: any) => {
  // Validate requestId format
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid request ID format');
  }

  // Find the request with populated listing and tenant info
  const request = await Request.findById(requestId).populate([
    {
      path: 'listingId',
      select: 'location rent landlordId',
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
    throw new AppError(StatusCodes.NOT_FOUND, 'Rental request not found');
  }

  // Verify the request is in approved status
  if (request.status !== REQUEST_STATUS.approved) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Only approved requests can proceed to payment',
    );
  }
  //!need
  // Verify the tenant is the one making the payment
  // if (request.tenantId._id.toString() !== userId) {
  //   throw new AppError(
  //     StatusCodes.FORBIDDEN,
  //     'You can only make payments for your own requests',
  //   );
  // }

  // Check if payment is already completed
  if (request.paymentStatus === REQUEST_PAYMENT_STATUS.paid) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Payment has already been completed for this request',
    );
  }

  // Cast the populated fields to their proper types
  const listing = request.listingId as unknown as PopulatedListing;
  const tenant = request.tenantId as unknown as PopulatedTenant;

  // Create a new payment record
  const payment = new Payment({
    requestId: request._id,
    tenantId: request.tenantId,
    landlordId: listing.landlordId,
    listingId: listing._id,
    amount: listing.rent,
    currency: 'BDT',
    status: PAYMENT_STATUS.pending,
  });

  await payment.save();

  try {
    const authResponse = await getAuthToken();
    const clientIp = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';

    // Prepare customer info
    const customerInfo: SurjoPayCustomer = {
      name: tenant.name || 'Tenant',
      email: tenant.email || 'tenant@example.com',
      phone: tenant.phoneNumber || '00000000000',
      address: listing.location || 'N/A',
      city: 'N/A',
      postalCode: '0000',
    };

    // Build callback URLs with internal request ID
    const returnUrl = new URL(surjoPayConfig.SP_RETURN_URL);
    returnUrl.searchParams.append('internal_request_id', requestId);

    const cancelUrl = new URL(surjoPayConfig.SP_CANCEL_URL);
    cancelUrl.searchParams.append('internal_request_id', requestId);

    // Prepare payment data
    const paymentData = {
      prefix: surjoPayConfig.SP_PREFIX,
      token: authResponse.token,
      store_id: authResponse.store_id,
      order_id: payment._id.toString(),
      return_url: returnUrl.toString(),
      cancel_url: cancelUrl.toString(),
      amount: payment.amount,
      currency: payment.currency,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      customer_city: customerInfo.city,
      customer_postcode: customerInfo.postalCode,
      client_ip: clientIp,
    };

    // Make payment request
    const paymentResponse = await axios.post(
      `${surjoPayConfig.SP_ENDPOINT}/secret-pay`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${authResponse.token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // Update payment and request with payment order ID
    const paymentOrderId = paymentResponse?.data?.sp_order_id;

    payment.paymentOrderId = paymentOrderId;
    payment.status = PAYMENT_STATUS.processing;
    await payment.save();

    request.paymentOrderId = paymentOrderId;
    await request.save();

    return {
      paymentUrl: paymentResponse?.data?.checkout_url,
      paymentId: paymentOrderId,
    };
  } catch (error: any) {
    // If payment initiation fails, update payment status
    payment.status = PAYMENT_STATUS.failed;
    await payment.save();

    console.error('Payment initiation failed:', error.response?.data || error);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Payment initiation failed: ' + error.message,
    );
  }
};

const handlePaymentSuccess = async (requestId: string, paymentId: string) => {
  // Validate request ID format
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid request ID format');
  }

  const request = await Request.findById(requestId);
  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Request not found');
  }

  // Verify payment order ID matches
  if (request.paymentOrderId !== paymentId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Payment ID does not match the request',
    );
  }

  // Verify payment with ShurjoPay
  const verificationData = await verifyPaymentWithShurjoPay(paymentId);

  console.log(
    'SurjoPay verification response:',
    JSON.stringify(verificationData, null, 2),
  );

  // Then modify your condition to be more flexible
  if (
    verificationData.sp_code !== 1000 &&
    verificationData.sp_code !== '1000' &&
    !verificationData.sp_message?.toLowerCase().includes('success')
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Payment failed: ${verificationData?.sp_message}`,
    );
  }

  // Find payment record
  const payment = await Payment.findOne({ paymentOrderId: paymentId });
  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Payment record not found');
  }

  // Update payment status
  payment.status = PAYMENT_STATUS.completed;
  payment.transactionId = verificationData.bank_trx_id;
  payment.paymentInfo = {
    status: 'success',
    transactionId: verificationData.bank_trx_id,
    amount: verificationData.amount,
    currency: verificationData.currency_type || 'BDT',
    paidAt: new Date(),
  };
  await payment.save();

  // Update request status
  request.paymentStatus = REQUEST_PAYMENT_STATUS.paid;
  request.paymentInfo = {
    status: 'success',
    transactionId: verificationData.bank_trx_id,
    amount: verificationData.amount,
    currency: verificationData.currency_type || 'BDT',
    paidAt: new Date(),
  };
  await request.save();

  // Update listing availability
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

  return { request, payment };
};

const getPaymentByRequestId = async (
  requestId: string,
  userId: string,
  role: string,
) => {
  // Validate request ID format
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid request ID format');
  }

  const request = await Request.findById(requestId);
  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Request not found');
  }

  // Authorization check
  const listing = await Listing.findById(request.listingId);
  if (!listing) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Listing not found');
  }

  if (role === 'tenant' && request.tenantId.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You can only view payments for your own requests',
    );
  } else if (role === 'landlord' && listing.landlordId.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You can only view payments for your own properties',
    );
  }

  const payment = await Payment.findOne({ requestId }).populate([
    {
      path: 'requestId',
      select: 'status message paymentStatus',
    },
    {
      path: 'tenantId',
      select: 'name email phoneNumber',
    },
    {
      path: 'landlordId',
      select: 'name email phoneNumber',
    },
    {
      path: 'listingId',
      select: 'location rent bedrooms images',
    },
  ]);

  if (!payment) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Payment not found for this request',
    );
  }

  return payment;
};

const getAllPaymentsByUser = async (
  userId: string,
  role: string,
  query: Record<string, unknown>,
) => {
  let filterCondition: Record<string, unknown> = {};

  if (role === 'tenant') {
    filterCondition = { tenantId: new mongoose.Types.ObjectId(userId) };
  } else if (role === 'landlord') {
    filterCondition = { landlordId: new mongoose.Types.ObjectId(userId) };
  }

  const requestQuery = new QueryBuilder(
    Payment.find(filterCondition).populate([
      {
        path: 'requestId',
        select: 'status message paymentStatus',
      },
      {
        path: 'tenantId',
        select: 'name email',
      },
      {
        path: 'landlordId',
        select: 'name email',
      },
      {
        path: 'listingId',
        select: 'location rent bedrooms images',
      },
    ]),
    query,
  )
    .search(PaymentSearchableFields)
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

export const PaymentService = {
  initiatePayment,
  verifyPaymentWithShurjoPay,
  handlePaymentSuccess,
  getPaymentByRequestId,
  getAllPaymentsByUser,
  getAuthToken,
};
