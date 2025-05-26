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
- Xác thực người dùng với JWT và Google OAuth2

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

## Cấu hình

Tạo file `.env.local` trong thư mục gốc của dự án với nội dung sau:

```
# API URL
NEXT_PUBLIC_API_URL=http://13.210.66.80/api

# Google OAuth2 Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-goes-here
```

Để lấy Google Client ID:
1. Truy cập vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo một dự án mới hoặc chọn dự án hiện có
3. Vào "APIs & Services" > "Credentials"
4. Tạo "OAuth client ID" cho Web application
5. Thêm authorized JavaScript origins (ví dụ: `http://localhost:3000`)
6. Thêm authorized redirect URIs (ví dụ: `http://localhost:3000/auth/callback`)
7. Sao chép Client ID và dán vào file `.env.local`

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

### Xác thực API Endpoints

- `POST /api/token/` - Đăng nhập với email/password
- `POST /api/token/refresh/` - Làm mới token
- `POST /api/auth/google/` - Đăng nhập với Google
- `POST /api/auth/logout/` - Đăng xuất
- `GET /api/users/me/` - Lấy thông tin người dùng hiện tại

## Authentication Flow

The Google OAuth authentication flow has been simplified to use a single callback route.

The OAuth flow works as follows:
1. User clicks "Login with Google" on the login page
2. Backend redirects to Google for authentication
3. After successful authentication, Google redirects back to our backend
4. Backend generates JWT tokens and redirects to `/auth/callback` with tokens in URL and cookies
5. The callback page processes and stores these tokens
6. User is redirected to the dashboard

### Authentication Callbacks

- We use the `auth/callback/page.tsx` component exclusively for handling OAuth callbacks
- All other OAuth-related components have been removed to simplify the codebase
- The backend is configured to redirect to `/auth/callback` after successful authentication

If you're experiencing authentication issues:
1. Make sure your environment variables are set correctly
2. Check that your Google OAuth client is configured to use the correct redirect URI
3. Clear your browser cookies and local storage
4. Try the login flow again
