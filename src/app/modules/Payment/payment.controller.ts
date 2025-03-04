import { NextFunction, Request, Response } from 'express';
import {
  getAuthToken,
  PaymentService,
  verifyPaymentWithShurjoPay,
} from './payment.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import axios from 'axios';
import { surjoPayConfig } from '../../config';
import { Order } from '../Order/order.model';
import mongoose from 'mongoose';

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.initiatePayment(
    req.body.orderId,
    req.body.customerInfo,
    req as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Payment initiated successfully',
    data: result,
  });
});

// payment.controller.ts
const handlePaymentCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Robust query parsing with handling for incorrect SurjoPay formatting
    const rawUrl = req.url;
    const queryParts = rawUrl.split('?');
    const processedQuery: Record<string, string> = {};

    if (queryParts.length > 1) {
      const fullQueryString = queryParts.slice(1).join('&').replace(/\?/g, '&');

      fullQueryString.split('&').forEach((part) => {
        const [key, value] = part.split('=');
        if (key && value) {
          processedQuery[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    }

    let rawOrderId = processedQuery.internal_order_id || '';
    let spPaymentId = processedQuery.order_id || '';

    // 🛠 Handle the incorrect format (internal_order_id containing order_id)
    if (rawOrderId.includes('?order_id=')) {
      const fixedParts = rawOrderId.split('?order_id=');
      rawOrderId = fixedParts[0];
      spPaymentId = fixedParts[1]; // Extract the actual order_id
    }

    // console.log('✅ Extracted Parameters:', { rawOrderId, spPaymentId });

    // Early validation
    if (!rawOrderId || !spPaymentId) {
      res.status(400).json({
        success: false,
        message: 'Invalid callback: Missing order or payment ID',
        details: { processedQuery, rawUrl },
      });
      return;
    }

    // Find order
    const order = await Order.findOne({ paymentOrderId: spPaymentId });
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
        details: { spPaymentId },
      });
      return;
    }

    // Verify payment
    let verificationData;
    try {
      verificationData =
        await PaymentService.verifyPaymentWithShurjoPay(spPaymentId);
    } catch (verificationError: any) {
      res.status(500).json({
        success: false,
        message: 'Payment verification failed',
        details: { error: verificationError.message },
      });
      return;
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

    // Redirect with success parameters
    res.redirect(
      `https://bike-shop-ecru.vercel.app/payment-success/${order._id}?` +
        `status=success&` +
        `payment_id=${spPaymentId}`,
    );
    // res.redirect(
    //   `http://localhost:5173/payment-success/${order._id}?` +
    //     `status=success&` +
    //     `payment_id=${spPaymentId}`,
    // );
  } catch (error: any) {
    console.error('Unexpected error in payment callback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during payment processing',
      details: { error: error.message },
    });
  }
};

export const PaymentController = {
  initiatePayment,
  handlePaymentCallback,
};
