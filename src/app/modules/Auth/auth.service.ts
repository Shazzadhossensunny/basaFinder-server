// auth.service.ts
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { TLoginUser } from './auth.interface';
import { createToken, verifyToken } from './auth.utils';
import config from '../../config';
import { User } from '../User/user.model';
import type { StringValue } from 'ms';
const loginUser = async (payload: TLoginUser) => {
  const user = await User.isUserExistsByEmail(payload.email);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found!');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Your account has been deactivated. Please contact support.',
    );
  }

  const isPasswordMatched = await User.isPasswordMatched(
    payload.password,
    user.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const jwtPayload = {
    role: user.role,
    email: user.email,
    userId: user._id,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as StringValue,
  );
  // console.log('Generated Access Token:', accessToken);
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as StringValue,
  );
  // console.log('Generated Access Token:', refreshToken);
  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  // checking if the given token is valid
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);

  const { email, userId, iat } = decoded;

  // checking if the user is exist
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'This user is not found !');
  }

  // if (
  //   user.passwordChangedAt &&
  //   User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, iat as number)
  // ) {
  //   throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized !');
  // }

  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as StringValue,
  );

  // console.log(accessToken);

  return {
    accessToken,
  };
};

export const AuthServices = {
  loginUser,
  refreshToken,
};
