import express from 'express';
import { UserControllers } from './user.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from './user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './user.validation';

const router = express.Router();

router.post('/register', UserControllers.registerUser);
router.get('/:id', UserControllers.getUserById);

router.post(
  '/change-password',
  validateRequest(UserValidation.changePasswordValidation),
  UserControllers.changePassword,
);
router.patch(
  '/toggle-status/:id',
  auth(USER_ROLE.admin),
  UserControllers.toggleUserStatus,
);
router.delete('/:id', UserControllers.deleteUserById);

router.get('/', UserControllers.getAllUser);

export const UserRoute = router;
