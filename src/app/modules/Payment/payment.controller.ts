import { NextFunction, Request as ExpressRequest, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.service';
import AppError from '../../errors/AppError';
import { sendEmail } from '../../utils/sendMail';
import { Request } from '../Request/request.model';
import mongoose from 'mongoose';

const initiatePayment = catchAsync(
  async (req: ExpressRequest, res: Response) => {
    const { requestId } = req.params;

    const result = await PaymentService.initiatePayment(
      requestId,
      req.user.id,
      req,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Payment initiated successfully',
      data: result,
    });
  },
);

// const handlePaymentCallback = async (
//   req: ExpressRequest,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     // Robust query parsing with handling for incorrect SurjoPay formatting
//     const rawUrl = req.url;
//     const queryParts = rawUrl.split('?');
//     const processedQuery: Record<string, string> = {};

//     if (queryParts.length > 1) {
//       const fullQueryString = queryParts.slice(1).join('&').replace(/\?/g, '&');

//       fullQueryString.split('&').forEach((part) => {
//         const [key, value] = part.split('=');
//         if (key && value) {
//           processedQuery[decodeURIComponent(key)] = decodeURIComponent(value);
//         }
//       });
//     }

//     let internalRequestId = processedQuery.internal_request_id || '';
//     let spPaymentId = processedQuery.order_id || '';

//     // Handle the incorrect format (internal_request_id containing order_id)
//     if (internalRequestId.includes('?order_id=')) {
//       const fixedParts = internalRequestId.split('?order_id=');
//       internalRequestId = fixedParts[0];
//       spPaymentId = fixedParts[1]; // Extract the actual order_id
//     }

//     // Early validation
//     if (!internalRequestId || !spPaymentId) {
//       res.status(400).json({
//         success: false,
//         message: 'Invalid callback: Missing request or payment ID',
//         details: { processedQuery, rawUrl },
//       });
//       return;
//     }

//     // Process the payment
//     try {
//       const result = await PaymentService.handlePaymentSuccess(
//         internalRequestId,
//         spPaymentId,
//       );

//       // Redirect with success parameters
//       res.redirect(
//         `${process.env.FRONTEND_URL}/payment-success/${internalRequestId}?` +
//           `status=success&` +
//           `payment_id=${spPaymentId}`,
//       );
//     } catch (error: any) {
//       console.error('Payment processing error:', error);

//       // Redirect with failure parameters
//       res.redirect(
//         `${process.env.FRONTEND_URL}/payment-failure/${internalRequestId}?` +
//           `status=failed&` +
//           `error=${encodeURIComponent(error.message)}`,
//       );
//     }
//   } catch (error: any) {
//     console.error('Unexpected error in payment callback:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error during payment processing',
//       details: { error: error.message },
//     });
//   }
// };
const handlePaymentCallback = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
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

    let internalRequestId = processedQuery.internal_request_id || '';
    let spPaymentId = processedQuery.order_id || '';

    // Handle the incorrect format (internal_request_id containing order_id)
    if (internalRequestId.includes('?order_id=')) {
      const fixedParts = internalRequestId.split('?order_id=');
      internalRequestId = fixedParts[0];
      spPaymentId = fixedParts[1]; // Extract the actual order_id
    }

    // Early validation
    if (!internalRequestId || !spPaymentId) {
      res.status(400).json({
        success: false,
        message: 'Invalid callback: Missing request or payment ID',
        details: { processedQuery, rawUrl },
      });
      return;
    }

    // Process the payment
    try {
      const result = await PaymentService.handlePaymentSuccess(
        internalRequestId,
        spPaymentId,
      );

      // Return JSON response instead of redirecting
      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          requestId: internalRequestId,
          paymentId: spPaymentId,
          status: 'success',
        },
      });
    } catch (error: any) {
      console.error('Payment processing error:', error);

      // Return JSON error response instead of redirecting
      res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        error: error.message,
        data: {
          requestId: internalRequestId,
          paymentId: spPaymentId,
          status: 'failed',
        },
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in payment callback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during payment processing',
      details: { error: error.message },
    });
  }
};

const verifyPayment = catchAsync(async (req: ExpressRequest, res: Response) => {
  const { paymentOrderId } = req.body;

  const verificationData =
    await PaymentService.verifyPaymentWithShurjoPay(paymentOrderId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Payment verification successful',
    data: verificationData,
  });
});

const getPaymentByRequestId = catchAsync(
  async (req: ExpressRequest, res: Response) => {
    const { requestId } = req.params;
    const result = await PaymentService.getPaymentByRequestId(
      requestId,
      req.user.id,
      req.user.role,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Payment information retrieved successfully',
      data: result,
    });
  },
);

const getAllPaymentsByUser = catchAsync(
  async (req: ExpressRequest, res: Response) => {
    const result = await PaymentService.getAllPaymentsByUser(
      req.user.id,
      req.user.role,
      req.query,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Payments retrieved successfully',
      meta: result.meta,
      data: result.result,
    });
  },
);

export const PaymentController = {
  initiatePayment,
  handlePaymentCallback,
  verifyPayment,
  getPaymentByRequestId,
  getAllPaymentsByUser,
};
