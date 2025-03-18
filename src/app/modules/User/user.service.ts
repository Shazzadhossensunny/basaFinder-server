import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import { TChangePassword, TUser } from './user.interface';
import { User } from './user.model';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import bcrypt from 'bcrypt';
import QueryBuilder from '../../builder/QueryBuilder';
import { USER_ROLE, UserSearchableFields } from './user.constant';

const createUser = async (payload: TUser) => {
  const result = await User.create(payload);
  return result;
};

const getAllUser = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find(), query)
    .search(UserSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();
  return {
    result,
    meta,
  };
};

const findUserById = async (userId: string, requestingUser: TUser) => {
  // First check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Authorization check
  if (
    requestingUser.role !== USER_ROLE.admin &&
    requestingUser.userId !== userId
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Access denied. You can only view your own account.',
    );
  }

  return user;
};

const findUserByEmail = async (email: string) => {
  const result = await User.findOne({ email });
  return result;
};

const changePassword = async (
  userData: JwtPayload,
  payload: TChangePassword,
) => {
  const user = await User.isUserExistsByEmail(userData.email);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const isPasswordMatched = await User.isPasswordMatched(
    payload.currentPassword,
    user.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Password is incorrect');
  }

  //hash new password
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_round),
  );

  await User.findOneAndUpdate(
    {
      email: userData.email,
      role: userData.role,
    },
    {
      password: newHashedPassword,
    },
  );

  return { success: true, message: 'Password updated successfully' };
};

const toggleUserStatus = async (userId: string, requestUser: TUser) => {
  // Only admin can toggle user status
  if (requestUser.role !== USER_ROLE.admin) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only admin can activate/deactivate users',
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Prevent deactivating admin accounts
  if (user.role === USER_ROLE.admin) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Admin accounts cannot be deactivated',
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      isActive: !user.isActive,
      deactivatedAt: !user.isActive ? null : new Date(),
    },
    { new: true },
  );

  return updatedUser;
};

const updateUserProfile = async (
  userId: string,
  payload: Partial<TUser>,
  requestingUser: TUser,
) => {
  // Check if user exists
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Authorization: Admins can update any profile, others can only update their own
  if (
    requestingUser.role !== USER_ROLE.admin &&
    requestingUser.userId !== userId
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'You can only update your own profile!',
    );
  }

  // Prevent role updates
  if (payload.role) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot update user role');
  }

  // Check if new email is unique
  if (payload.email && payload.email !== user.email) {
    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      throw new AppError(StatusCodes.CONFLICT, 'Email is already in use');
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return updatedUser;
};

const deleteUser = async (deleteId: string, requestUser: TUser) => {
  // Check if user exists before deletion
  const user = await User.findById(deleteId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // If user is customer, they can only delete their own account
  if (requestUser.role === USER_ROLE.landlord && deleteId !== requestUser._id) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Access denied. Customers can only delete their own account',
    );
  }

  const result = await User.findByIdAndDelete(deleteId);
  return result;
};

export const UserServices = {
  createUser,
  getAllUser,
  findUserById,
  findUserByEmail,
  changePassword,
  toggleUserStatus,
  updateUserProfile,
  deleteUser,
};
