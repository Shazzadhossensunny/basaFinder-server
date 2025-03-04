import { Types } from 'mongoose';

export interface SurjoPayConfig {
  SP_ENDPOINT: string;
  SP_USERNAME: string;
  SP_PASSWORD: string;
  SP_PREFIX: string;
  SP_RETURN_URL: string;
  SP_CANCEL_URL: string;
}

export interface SurjoPayCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface SurjoPayAuthResponse {
  token: string;
  store_id: string;
  token_type: string;
  sp_code: string;
  message: string;
  ip: any;
  expires_in: any;
}

export interface TPayment {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'initiated' | 'success' | 'failed';
  transactionId?: string;
  paidAmount?: number;
  paidAt?: Date;
  failureReason?: string;
}
