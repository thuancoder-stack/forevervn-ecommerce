import express from 'express';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import {
    placeOrder,
    placeOrderSePay,
    retryPendingSePayOrder,
    placeOrderWallet,
    sepayIpnHandler,
    getAdminPaymentAnalytics,
    allOrders,
    userOrders,
    updateStatus,
    cancelOrder,
    confirmReceived,
    deleteOrder
} from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.post('/place', authUser, placeOrder);
orderRouter.post('/place-sepay', authUser, placeOrderSePay);
orderRouter.post('/place-wallet', authUser, placeOrderWallet);
orderRouter.post('/sepay-ipn', express.json(), sepayIpnHandler);

orderRouter.post('/list', adminAuth, allOrders);
orderRouter.get('/analytics/payments', adminAuth, getAdminPaymentAnalytics);
orderRouter.post('/status', adminAuth, updateStatus);
orderRouter.post('/delete', adminAuth, deleteOrder);
orderRouter.post('/userorders', authUser, userOrders);
orderRouter.post('/cancel', authUser, cancelOrder);
orderRouter.post('/retry-sepay', authUser, retryPendingSePayOrder);
orderRouter.post('/confirm-received', authUser, confirmReceived);

export default orderRouter;
