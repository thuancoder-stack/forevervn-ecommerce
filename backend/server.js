import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRouter.js';
import productRouter from './routes/productRouter.js';
// APP config
const app = express();
const port = process.env.PORT || 4000;

// Kết nối MongoDB
connectDB();
connectCloudinary();

// Middleware ← Kiểm tra token, quyền truy cập, v.v.`
app.use(cors());
app.use(express.json());

app.use('/api/user', userRouter) 
app.use('/api/product', productRouter)
// Các route API sẽ được định nghĩa ở đây routes/
app.get('/', (req, res) => {
    res.send('Hello World! API đang chạy...');
});
// // Kết nối MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//     .then(() => console.log('✅ MongoDB đã kết nối'))
//     .catch((err) => console.log('❌ Lỗi kết nối:', err))

app.listen(process.env.PORT, () => {
    console.log(`🚀 Server chạy tại port ${process.env.PORT}`);
});















// backend/
// ├── config/          ← Cấu hình (MongoDB, cloudinary...)
// ├── controllers/     ← Xử lý logic nghiệp vụ
// ├── middleware/      ← Kiểm tra token, quyền truy cập
// ├── models/          ← Cấu trúc dữ liệu MongoDB
// ├── routes/          ← Định nghĩa các API endpoint
// └── server.js        ← Điểm khởi chạy server