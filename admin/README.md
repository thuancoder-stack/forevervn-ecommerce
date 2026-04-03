# ForeverVN Admin

Admin panel cho hệ thống ForeverVN e-commerce.

Ứng dụng này phục vụ:

- đăng nhập admin / employee
- dashboard tổng quan
- quản lý nhân viên và khách hàng
- quản lý danh mục, sub-category, sản phẩm
- quản lý voucher, banner, review
- quản lý đơn hàng, import batch, audit logs
- thao tác vận hành như bulk operation

## 1. Công nghệ dùng

- React
- Vite
- React Router
- Axios
- Ant Design
- Tailwind CSS
- React Query
- Zustand
- Zod
- Framer Motion
- Iconify

## 2. Các màn hình chính

Trong `admin/src/pages` hiện có các màn:

- `Dashboard`
- `Employees`
- `Customers`
- `Orders`
- `List`
- `Add`
- `Update`
- `Categories`
- `SubCategories`
- `Vouchers`
- `Banners`
- `Reviews`
- `ImportBatch`
- `BulkOperation`
- `AuditLogs`

## 3. Chạy local

Di chuyển vào thư mục `admin`:

```bash
npm install
```

Tạo file `.env`, sau đó chạy:

```bash
npm run dev
```

Admin thường chạy ở:

```txt
http://localhost:5174
```

hoặc cổng Vite tiếp theo nếu frontend đang mở trước.

## 4. Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

## 5. Biến môi trường

Tạo file `.env` trong thư mục `admin`:

```env
VITE_BACKEND_URL=http://localhost:4000
```

Khi deploy production:

```env
VITE_BACKEND_URL=https://your-backend.onrender.com
```

Admin đang đọc biến này trong:

- [config.js](C:\Users\Admin\Desktop\Ecommerce-app\forevervn-ecommerce\admin\src\config.js)

## 6. Luồng đăng nhập admin

Admin panel dùng token để bảo vệ toàn bộ app.

Khi chưa có token:

- hiển thị màn login admin

Khi đã có token:

- hiển thị navbar
- sidebar
- các route quản trị

## 7. Các chức năng chính

### Dashboard

- doanh thu
- lợi nhuận
- khách hàng
- category mix
- hoạt động gần đây

### User management

- danh sách nhân viên
- cập nhật nhân viên
- xóa tài khoản
- xem khách hàng

### Catalog management

- category
- sub-category
- add product
- update product
- list items
- upload ảnh sản phẩm

### Commerce management

- đơn hàng
- voucher
- import batch
- bulk operation
- banners
- reviews
- audit logs

## 8. Build production

Từ thư mục `admin`:

```bash
npm run build
```

Output nằm trong:

```txt
dist/
```

## 9. Deploy lên Vercel

Khuyến nghị deploy admin trên Vercel.

Thiết lập:

- Framework Preset: `Vite`
- Root Directory: `admin`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Environment Variables:

```env
VITE_BACKEND_URL=https://your-backend.onrender.com
```

## 10. Checklist chạy local

Trước khi chạy local, kiểm tra:

- [ ] đã có file `admin/.env`
- [ ] đã điền `VITE_BACKEND_URL`
- [ ] backend local đang chạy
- [ ] đã chạy `npm install`
- [ ] đã chạy `npm run dev`
- [ ] mở được màn login admin

## 11. Checklist trước khi deploy Vercel

Trước khi deploy:

- [ ] code đã push lên GitHub
- [ ] chọn đúng Root Directory là `admin`
- [ ] Build Command là `npm run build`
- [ ] Output Directory là `dist`
- [ ] Install Command là `npm install`
- [ ] đã thêm `VITE_BACKEND_URL`
- [ ] backend Render đang live

## 12. Checklist test sau deploy

Sau khi admin live, test lần lượt:

- [ ] login admin
- [ ] dashboard load dữ liệu
- [ ] employees hiển thị đúng
- [ ] customers hiển thị đúng
- [ ] orders load và update status được
- [ ] add product hoạt động
- [ ] update product hoạt động
- [ ] list items load được
- [ ] categories và sub-categories CRUD được
- [ ] vouchers CRUD được
- [ ] banners CRUD được
- [ ] reviews load và moderation được
- [ ] import batch hoạt động
- [ ] bulk operation hoạt động
- [ ] audit logs load được

## 13. Các lỗi hay gặp

### Admin không load được dữ liệu

Kiểm tra:

- `VITE_BACKEND_URL` có đúng không
- backend có đang live không
- token admin có còn hợp lệ không

### Login admin không vào được

Kiểm tra:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- hoặc tài khoản role `Admin` / `Employee` trong database

### Upload ảnh lỗi

Kiểm tra bên backend:

- `CLOUDINARY_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Dashboard hoặc CRUD báo unauthorized

Kiểm tra:

- token đã hết hạn chưa
- middleware backend
- role có đúng `Admin` hoặc `Employee` không

## 14. Ghi chú

- Admin là Vite SPA, không dùng SSR
- nếu backend đổi domain, phải cập nhật lại `VITE_BACKEND_URL`
- nếu deploy song song `frontend` và `admin`, nên tách domain rõ ràng

Ví dụ:

- storefront: `www.domain.com`
- admin: `admin.domain.com`
- backend: `api.domain.com` hoặc URL Render
