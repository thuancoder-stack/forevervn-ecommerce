import express from 'express';
import { getDashboardStats, exportOrdersCsv } from '../controllers/dashboardController.js';
import adminAuth from '../middleware/adminAuth.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/stats', adminAuth, getDashboardStats);
dashboardRouter.get('/export-orders', adminAuth, exportOrdersCsv);

export default dashboardRouter;
