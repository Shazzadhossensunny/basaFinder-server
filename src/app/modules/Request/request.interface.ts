import { Model, Types } from 'mongoose';

export const REQUEST_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;

export const PAYMENT_STATUS = {
  pending: 'pending',
  paid: 'paid',
  failed: 'failed',
} as const;

export type TRequestStatus = keyof typeof REQUEST_STATUS;
export type TPaymentStatus = keyof typeof PAYMENT_STATUS;

export interface TRequest {
  _id: string;
  listingId: Types.ObjectId;
  tenantId: Types.ObjectId;
  message: string;
  status: TRequestStatus;
  paymentStatus: TPaymentStatus;
  landlordPhoneNumber?: string;
}

export interface RequestModel extends Model<TRequest> {}
