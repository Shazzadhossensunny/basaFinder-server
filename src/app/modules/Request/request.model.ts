import { model, Schema } from 'mongoose';
import { RequestModel, TRequest } from './request.interface';
import { REQUEST_STATUS, PAYMENT_STATUS } from './request.interface';

const requestSchema = new Schema<TRequest, RequestModel>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required'],
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant ID is required'],
    },
    message: {
      type: String,
      required: [true, 'Request message is required'],
    },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.pending,
    },
    paymentOrderId: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.pending,
    },
    paymentInfo: {
      status: String,
      transactionId: String,
      amount: Number,
      currency: String,
      paidAt: Date,
    },
    landlordPhoneNumber: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate rental requests from the same tenant for the same listing
requestSchema.index({ listingId: 1, tenantId: 1 }, { unique: true });

export const Request = model<TRequest, RequestModel>('Request', requestSchema);
