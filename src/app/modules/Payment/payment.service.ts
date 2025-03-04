import axios from 'axios';
import { Order } from '../Order/order.model';
import { SurjoPayCustomer, SurjoPayAuthResponse } from './payment.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { surjoPayConfig } from '../../config';
import mongoose from 'mongoose';

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

const initiatePayment = async (
  orderId: string,
  customerInfo: SurjoPayCustomer,
  req: any,
) => {
  console.log('Sending request to SurjoPay with orderId:', orderId);
  console.log('Customer Info:', customerInfo);
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  if (order.paymentStatus === 'completed') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Order is already paid');
  }

  try {
    const authResponse = await getAuthToken();
    const clientIp = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';

    // Build callback URLs with ONLY your order ID
    const returnUrl = new URL(surjoPayConfig.SP_RETURN_URL);
    returnUrl.searchParams.append('internal_order_id', orderId);

    const cancelUrl = new URL(surjoPayConfig.SP_CANCEL_URL);
    cancelUrl.searchParams.append('internal_order_id', orderId);

    // 1. First prepare initial payment data without URLs
    const initialPaymentData = {
      prefix: surjoPayConfig.SP_PREFIX,
      token: authResponse.token,
      store_id: authResponse.store_id,
      order_id: orderId,
      return_url: returnUrl.toString(),
      cancel_url: cancelUrl.toString(),
      amount: order.totalAmount,
      currency: 'BDT',
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      customer_city: customerInfo.city,
      customer_postcode: customerInfo.postalCode,
      client_ip: clientIp,
    };

    // 6. Make final payment request with complete data
    const finalPaymentResponse = await axios.post(
      `${surjoPayConfig.SP_ENDPOINT}/secret-pay`,
      initialPaymentData,
      {
        headers: {
          Authorization: `Bearer ${authResponse.token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // 7. Save payment ID to order
    order.paymentOrderId = finalPaymentResponse?.data?.sp_order_id;
    await order.save();
    console.log('Payment initiated successfully:', finalPaymentResponse?.data);

    return {
      paymentUrl: finalPaymentResponse?.data?.checkout_url,
      paymentId: finalPaymentResponse?.data?.sp_order_id,
    };
  } catch (error: any) {
    console.error('Payment initiation failed:', error.response?.data || error);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Payment initiation failed: ' + error.message,
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

const handlePaymentSuccess = async (orderId: string, paymentId: string) => {
  // Validate order ID format
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid order ID format');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  // Verify payment with ShurjoPay
  const verificationData = await verifyPaymentWithShurjoPay(paymentId);

  if (verificationData.sp_code !== 1000) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Payment failed: ${verificationData?.sp_message}`,
    );
  }

  // Update order status
  order.paymentStatus = 'completed';
  order.paymentInfo = {
    status: 'success',
    transactionId: verificationData.bank_trx_id,
    amount: verificationData.amount,
    currency: 'BDT',
    paidAt: new Date(),
  };

  await order.save();
  return order;
};

export const PaymentService = {
  initiatePayment,
  handlePaymentSuccess,
  verifyPaymentWithShurjoPay,
};
