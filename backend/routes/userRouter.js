import express from 'express';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import { loginUser, registerUser, getCurrentUser, loginAdmin, getAllUsers, deleteUser } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/me', authUser, getCurrentUser);
userRouter.post('/admin/login', loginAdmin);
userRouter.get('/list', adminAuth, getAllUsers);
userRouter.post('/delete', adminAuth, deleteUser);

export default userRouter;