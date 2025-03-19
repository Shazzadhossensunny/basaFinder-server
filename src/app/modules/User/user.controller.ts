import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TUser } from './user.interface';
import { UserServices } from './user.service';
import { StatusCodes } from 'http-status-codes';

const registerUser = catchAsync(async (req, res) => {
  const user = await UserServices.createUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User registered successfully',
    data: user,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const requestingUser = req.user as TUser;
  const { id } = req.params;

  const result = await UserServices.findUserById(id, requestingUser);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUser(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Users are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { ...passwordData } = req.body;
  const result = await UserServices.changePassword(req.user, passwordData);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password is updated successfully!',
    data: result,
  });
});
const toggleUserStatus = catchAsync(async (req, res) => {
  const user = req.user as TUser;
  const result = await UserServices.toggleUserStatus(req.params.id, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `User ${result?.isActive ? 'activated' : 'deactivated'} successfully`,
    data: result,
  });
});

const changeUserRole = catchAsync(async (req, res) => {
  const adminUser = req.user as TUser;
  const { id } = req.params;
  const { role } = req.body;

  const result = await UserServices.changeUserRole(id, role, adminUser);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User role updated successfully',
    data: result,
  });
});
const deleteUserById = catchAsync(async (req, res) => {
  const user = req.user as TUser;
  const deleteUser = await UserServices.deleteUser(req.params.id, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User deleted successfully',
    data: deleteUser,
  });
});

const updateUserProfile = catchAsync(async (req, res) => {
  const user = req.user as TUser;
  const { id } = req.params;
  const result = await UserServices.updateUserProfile(id, req.body, user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

export const UserControllers = {
  registerUser,
  getAllUser,
  getUserById,
  changePassword,
  toggleUserStatus,
  updateUserProfile,
  changeUserRole,
  deleteUserById,
};
