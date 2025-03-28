import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export interface SurjoPayConfig {
  SP_ENDPOINT: string;
  SP_USERNAME: string;
  SP_PASSWORD: string;
  SP_PREFIX: string;
  SP_RETURN_URL: string;
  SP_CANCEL_URL: string;
}

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  mongoDb_uri: process.env.MONGODB_URI,
  bcrypt_salt_round: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  // Email configuration
  email_host: process.env.SMTP_HOST || 'smtp.zoho.com',
  email_port: Number(process.env.SMTP_PORT) || 465,
  email_secure: process.env.EMAIL_SECURE === 'true', // Convert string to boolean
  email_user: process.env.SMTP_USER || '',
  email_pass: process.env.SMTP_PASS || '',
  email_from: process.env.EMAIL_FROM || 'BasaFinder <noreply@basafinder.com>',
};

export const surjoPayConfig: SurjoPayConfig = {
  SP_ENDPOINT: process.env.SP_ENDPOINT as string,
  SP_USERNAME: process.env.SP_USERNAME as string,
  SP_PASSWORD: process.env.SP_PASSWORD as string,
  SP_PREFIX: process.env.SP_PREFIX as string,
  SP_RETURN_URL: process.env.SP_RETURN_URL as string,
  SP_CANCEL_URL: process.env.SP_CANCEL_URL as string,
};
