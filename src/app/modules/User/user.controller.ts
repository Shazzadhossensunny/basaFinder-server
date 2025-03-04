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
  const user = await UserServices.findUserById(req.params.id, {
    role: req.user.role,
    id: req.user.id,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User is retrieved successfully',
    data: user,
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
// const updateUserById = catchAsync(async (req, res) => {
//   const updateUser = await UserServices.updateUser(req.params.id, req.body);
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'User update successfully',
//     data: updateUser,
//   });
// });
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

export const UserControllers = {
  registerUser,
  getAllUser,
  getUserById,
  changePassword,
  toggleUserStatus,
  // updateUserById,
  deleteUserById,
};
