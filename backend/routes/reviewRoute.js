import express from 'express';
import { addReview, listReviews, deleteReview, replyReview } from '../controllers/reviewController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const reviewRouter = express.Router();

reviewRouter.post('/add', upload.array('images', 5), authUser, addReview);
reviewRouter.get('/list', listReviews);
reviewRouter.post('/delete', adminAuth, deleteReview);
reviewRouter.post('/reply', adminAuth, replyReview);

export default reviewRouter;
