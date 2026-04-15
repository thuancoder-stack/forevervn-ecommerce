import cron from 'node-cron';
import { expirePendingSePayOrders } from '../controllers/orderController.js';

const startSePayExpiryJob = () => {
    let running = false;

    cron.schedule('*/1 * * * *', async () => {
        if (running) return;

        running = true;
        try {
            await expirePendingSePayOrders();
        } catch (error) {
            console.error('SePay expiry job failed:', error);
        } finally {
            running = false;
        }
    });
};

export default startSePayExpiryJob;
