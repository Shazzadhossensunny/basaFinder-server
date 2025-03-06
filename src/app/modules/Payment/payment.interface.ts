import { Model, Types } from 'mongoose';

export interface SurjoPayAuthResponse {
  token: string;
  store_id: string;
  message: string;
}

export interface SurjoPayCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface SurjoPayVerificationResponse {
  sp_code: number;
  sp_message: string;
  order_id: string;
  bank_trx_id: string;
  amount: number;
  currency_type: string;
  date_time: string;
  status: string;
}

export const PAYMENT_STATUS = {
  pending: 'pending',
  processing: 'processing',
  completed: 'completed',
  failed: 'failed',
  refunded: 'refunded',
} as const;

export type TPaymentStatus = keyof typeof PAYMENT_STATUS;

export interface TPayment {
  _id: string;
  requestId: Types.ObjectId;
  tenantId: Types.ObjectId;
  landlordId: Types.ObjectId;
  listingId: Types.ObjectId;
  transactionId?: string;
  paymentOrderId?: string;
  amount: number;
  currency: string;
  status: TPaymentStatus;
  paymentInfo?: {
    status: string;
    transactionId: string;
    amount: number;
    currency: string;
    paidAt: Date;
  };
  metadata?: Record<string, unknown>;
}

export interface PaymentModel extends Model<TPayment> {}
