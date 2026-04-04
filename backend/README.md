# ForeverVN Backend
đã render.com  https://forevervn-ecommerce.onrender.com
Backend API cho hệ thống ForeverVN e-commerce.

Service này xử lý:

- đăng ký, đăng nhập, phân quyền user/admin/employee
- sản phẩm, danh mục, sub-category
- giỏ hàng, đơn hàng, voucher
- banner, review, audit logs, import batch
- dashboard admin
- gửi email newsletter và OTP quên mật khẩu
- upload ảnh qua Cloudinary
- một số tác vụ AI và cảnh báo tồn kho

## 1. Công nghệ dùng

- Node.js
- Express
- MongoDB + Mongoose
- JWT
- bcrypt
- Nodemailer
- Cloudinary
- node-cron

## 2. Cấu trúc thư mục

```txt
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
  server.js
  package.json
  .env
```

## 3. Yêu cầu trước khi chạy

- Node.js 18 trở lên
- MongoDB Atlas hoặc MongoDB server
- Cloudinary account
- Gmail để gửi mail thật
- App Password của Gmail

## 4. Chạy local

Di chuyển vào thư mục `backend`:

```bash
npm install
```

Tạo file `.env`, sau đó chạy:

```bash
npm run dev
```

Hoặc production mode:

```bash
npm start
```

Backend mặc định chạy ở:

```txt
http://localhost:4000
```

## 5. Scripts

```json
{
  "dev": "nodemon server.js",
  "start": "node server.js",
  "serve": "node server.js"
}
```

## 6. Biến môi trường

Tạo file `.env` trong thư mục `backend` với mẫu sau:

```env
PORT=4000

MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net
JWT_SECRET=your_jwt_secret

CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password

KLING_ACCESS_KEY=your_kling_access_key
KLING_SECRET_KEY=your_kling_secret_key
```

## 7. Lưu ý rất quan trọng về MongoDB

Trong [mongodb.js](C:\Users\Admin\Desktop\Ecommerce-app\forevervn-ecommerce\backend\config\mongodb.js), code đang tự nối thêm:

```txt
/e-commerce
```

vào cuối `MONGO_URI`.

Vì vậy:

- đúng:
  `MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net`
- không nên:
  `MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/e-commerce`

Nếu bạn nhập sẵn `/e-commerce` trong `.env`, chuỗi kết nối có thể bị sai.

## 8. Gmail App Password

Để gửi mail newsletter và OTP reset password, bạn cần:

1. dùng một Gmail làm email gửi
2. bật `2-Step Verification`
3. tạo `App Password`
4. điền vào `.env`

Ví dụ:

```env
EMAIL_USER=forevervn.shop@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

Lưu ý:

- `EMAIL_PASS` không phải mật khẩu Gmail thường
- đây là App Password 16 ký tự do Google cấp

## 9. Các nhóm API chính

Backend mount các route sau trong [server.js](C:\Users\Admin\Desktop\Ecommerce-app\forevervn-ecommerce\backend\server.js):

- `/api/user`
- `/api/product`
- `/api/cart`
- `/api/order`
- `/api/system`
- `/api/category`
- `/api/sub-category`
- `/api/dashboard`
- `/api/audit-log`
- `/api/banner`
- `/api/review-user`
- `/api/import-batch`
- `/api/behavior`
- `/api/ai`

Health check:

```txt
GET /
```

## 10. Các tính năng mail đang có

### Newsletter

Route:

```txt
POST /api/system/newsletter/subscribe
```

Chức năng:

- nhận email từ frontend
- tìm voucher `SUBSCRIBE` đang active
- gửi mail thật cho người dùng

### Quên mật khẩu bằng OTP

Routes:

```txt
POST /api/user/forgot-password
POST /api/user/reset-password
```

Chức năng:

- gửi OTP 6 số về email
- OTP hết hạn sau 10 phút
- người dùng nhập đúng OTP thì đổi được mật khẩu

## 11. Cloudinary

Cloudinary được dùng để upload và lưu media. Cấu hình nằm tại:

- [cloudinary.js](C:\Users\Admin\Desktop\Ecommerce-app\forevervn-ecommerce\backend\config\cloudinary.js)

## 12. Cảnh báo tồn kho

File xử lý:

- [stockAlert.js](C:\Users\Admin\Desktop\Ecommerce-app\forevervn-ecommerce\backend\utils\stockAlert.js)

Chức năng:

- cron job kiểm tra tồn kho
- gửi email cảnh báo khi hàng xuống dưới ngưỡng

## 13. Deploy lên Render

Khuyến nghị deploy backend này trên Render.

Thiết lập:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Sau đó thêm toàn bộ biến môi trường ở phần `Environment`.

## 14. Checklist chạy local

Trước khi chạy local, kiểm tra đủ:

- [ ] đã có file `backend/.env`
- [ ] đã điền `MONGO_URI`
- [ ] đã điền `JWT_SECRET`
- [ ] đã điền `CLOUDINARY_NAME`
- [ ] đã điền `CLOUDINARY_API_KEY`
- [ ] đã điền `CLOUDINARY_API_SECRET`
- [ ] đã điền `ADMIN_EMAIL`
- [ ] đã điền `ADMIN_PASSWORD`
- [ ] đã điền `EMAIL_USER`
- [ ] đã điền `EMAIL_PASS`
- [ ] đã chạy `npm install`
- [ ] đã chạy `npm run dev`
- [ ] mở `http://localhost:4000` thấy backend phản hồi

## 15. Checklist deploy Render

Trước khi bấm deploy, kiểm tra:

- [ ] repo đã push code mới nhất lên GitHub
- [ ] Render service đang trỏ đúng branch
- [ ] Root Directory là `backend`
- [ ] Build Command là `npm install`
- [ ] Start Command là `npm start`
- [ ] đã thêm `MONGO_URI`
- [ ] đã thêm `JWT_SECRET`
- [ ] đã thêm toàn bộ Cloudinary env
- [ ] đã thêm `ADMIN_EMAIL`
- [ ] đã thêm `ADMIN_PASSWORD`
- [ ] đã thêm `EMAIL_USER`
- [ ] đã thêm `EMAIL_PASS`
- [ ] nếu dùng AI thì đã thêm `KLING_ACCESS_KEY`
- [ ] nếu dùng AI thì đã thêm `KLING_SECRET_KEY`

## 16. Checklist test sau deploy

Sau khi backend live, test lần lượt:

- [ ] mở URL backend và kiểm tra route `/`
- [ ] test đăng ký user
- [ ] test đăng nhập user
- [ ] test đăng nhập admin
- [ ] test tạo sản phẩm
- [ ] test upload ảnh qua Cloudinary
- [ ] test add to cart
- [ ] test đặt đơn
- [ ] test newsletter subscribe
- [ ] test forgot password OTP
- [ ] test review
- [ ] test dashboard admin

## 17. Các lỗi hay gặp

### `Missing credentials for "PLAIN"`

Nguyên nhân thường là:

- thiếu `EMAIL_USER`
- thiếu `EMAIL_PASS`
- App Password Gmail sai

### `Newsletter email service is not configured yet`

Nguyên nhân:

- chưa cấu hình `EMAIL_USER`
- chưa cấu hình `EMAIL_PASS`

### MongoDB không kết nối

Kiểm tra:

- `MONGO_URI` có đúng không
- Atlas đã whitelist IP chưa
- có bị thêm trùng `/e-commerce` trong `MONGO_URI` không

### Frontend hoặc admin không gọi được API

Kiểm tra:

- backend có đang live không
- `VITE_BACKEND_URL` ở frontend có đúng không
- `VITE_BACKEND_URL` ở admin có đúng không

## 18. Ghi chú production

- Backend hiện đang dùng `cors()` mở hoàn toàn
- nếu lên production chính thức, nên giới hạn `origin`
- backend này hợp Render hoặc VPS hơn Vercel vì có Express thường và cron job
