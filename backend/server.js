import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRouter.js';
import productRouter from './routes/productRouter.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import systemRouter from './routes/systemRouter.js';
import categoryRouter from './routes/categoryRouter.js';
import subCategoryRouter from './routes/subCategoryRouter.js';
import dashboardRouter from './routes/dashboardRouter.js';
import auditLogRouter from './routes/auditLogRouter.js';
import bannerRouter from './routes/bannerRoute.js';
import reviewRouter from './routes/reviewRoute.js';
import importBatchRouter from './routes/importBatchRoute.js';
import behaviorRouter from './routes/behaviorRouter.js';
import returnRouter from './routes/returnRoute.js';
import walletRouter from './routes/walletRoute.js';
import startStockAlertJob from './utils/stockAlert.js';
import startSePayExpiryJob from './utils/sepayExpiryJob.js';
import aiRouter from './routes/aiRouter.js';
import smartSearchRouter from './routes/smartSearchRoute.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 4000;

connectDB();
connectCloudinary();
startStockAlertJob();
startSePayExpiryJob();

app.use(cors());
app.use(express.json());

app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/system', systemRouter);
app.use('/api/category', categoryRouter);
app.use('/api/sub-category', subCategoryRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit-log', auditLogRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/review-user', reviewRouter);
app.use('/api/import-batch', importBatchRouter);
app.use('/api/behavior', behaviorRouter);
app.use('/api/ai', aiRouter);
app.use('/api/return', returnRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/smart-search', smartSearchRouter);

app.get('/', (req, res) => {
    res.send('Hello World! API dang chay...');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server chay tai http://localhost:${port}`);
});
