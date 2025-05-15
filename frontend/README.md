# MonKids Management Frontend

Giao diện quản lý trường học Mầm Non MonKids được xây dựng với Next.js, TypeScript và Mantine UI.

## Tính năng

- Dashboard tổng quan
- Quản lý học sinh (thêm, sửa, xóa, tìm kiếm)
- Quản lý giáo viên (thêm, sửa, xóa, tìm kiếm)
- In biên lai học phí
- In phiếu lương giáo viên
- Giao diện responsive
- Kết nối với backend API

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy môi trường development
npm run dev

# Build cho production
npm run build

# Chạy production build
npm start
```

## Cấu trúc thư mục

```
src/
├── api/          # API service và functions
├── app/          # Route definitions và page components
├── components/   # UI components tái sử dụng
├── contexts/     # React contexts
├── hooks/        # Custom React hooks
├── styles/       # CSS và styling
├── types/        # TypeScript type definitions
└── utils/        # Helper functions
```

## API Endpoints

Frontend kết nối với các API endpoints sau:

- `GET /api/students/` - Lấy danh sách học sinh
- `GET /api/students/:id/` - Lấy chi tiết một học sinh
- `POST /api/students/` - Tạo học sinh mới
- `PUT /api/students/:id/` - Cập nhật thông tin học sinh
- `DELETE /api/students/:id/` - Xóa học sinh

- `GET /api/teachers/` - Lấy danh sách giáo viên
- `GET /api/teachers/:id/` - Lấy chi tiết một giáo viên
- `POST /api/teachers/` - Tạo giáo viên mới
- `PUT /api/teachers/:id/` - Cập nhật thông tin giáo viên
- `DELETE /api/teachers/:id/` - Xóa giáo viên
