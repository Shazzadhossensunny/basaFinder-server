import { Model } from 'mongoose';
import { USER_ROLE } from './user.constant';

export interface TUser {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'admin' | 'landlord' | 'tenant';
  passwordChangedAt?: Date;
  isActive: boolean;
  deactivatedAt?: Date;
}
// import { ObjectId } from 'mongoose'; this is for listing create user
// export type TUserTokenPayload = {
//   role: 'landlord' | 'tenant' | 'admin';
//   email: string;
//   userId: string;
//   iat: number;
//   exp: number;
//   id: ObjectId;
// };

export type TChangePassword = {
  currentPassword: string;
  newPassword: string;
};

export interface UserModel extends Model<TUser> {
  isUserExistsByEmail(email: string): Promise<TUser>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}

// types/user.types.ts
export interface RequestWithUser extends Request {
  user: TUser;
}

export type TUserRole = keyof typeof USER_ROLE;
