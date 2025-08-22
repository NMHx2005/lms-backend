## Định nghĩa API LMS Backend

### 🏠 Thông tin hệ thống (Project Information)
- GET `/` — Thông tin hệ thống, phiên bản, tính năng (public)
- GET `/health` — Healthcheck và thống kê runtime (public)
- GET `/api` — Trạng thái API và các entry points chính (public)

---

### 🔧 Chức năng dùng chung (Shared Functionality)

#### 🔐 Xác thực (Authentication)
- POST `/api/auth/register` — Đăng ký tài khoản bằng name/email/password. Tự tách `firstName`/`lastName` từ `name`.
- POST `/api/auth/login` — Đăng nhập email/password; trả về tokens (JWT) và hồ sơ người dùng.
- GET `/api/auth/me` — Lấy thông tin người dùng hiện tại (Bearer token).
- POST `/api/auth/refresh-token` — Làm mới access/refresh token.
- POST `/api/auth/logout` — Đăng xuất; tuỳ chọn tất cả thiết bị.
- POST `/api/auth/forgot-password` — Gửi email đặt lại mật khẩu.
- POST `/api/auth/reset-password` — Đặt lại mật khẩu bằng token.
- POST `/api/auth/change-password` — Đổi mật khẩu (yêu cầu xác thực).

#### 🔗 Google OAuth
- GET `/api/auth/google/config` — Cấu hình OAuth cho frontend (clientId, scope...).
- GET `/api/auth/google/` — Bắt đầu luồng Google OAuth (redirect).
- GET `/api/auth/google/callback` — Xử lý callback từ Google.
- POST `/api/auth/google/link` — Liên kết tài khoản Google vào user hiện tại.
- DELETE `/api/auth/google/unlink` — Gỡ liên kết Google.
- GET `/api/auth/google/status` — Kiểm tra trạng thái liên kết.

#### 💬 Bình luận (Comments)
- GET `/api/comments` — Danh sách bình luận theo bộ lọc (contentType, contentId, paging).
- GET `/api/comments/tree/course/{courseId}` — Cây bình luận theo khoá học (nested).
- GET `/api/comments/{commentId}` — Lấy 1 bình luận (tuỳ chọn kèm replies/author).
- GET `/api/comments/stats` — Thống kê tổng hợp bình luận.
- POST `/api/comments` — Tạo bình luận (auth).
- PUT `/api/comments/{commentId}` — Sửa bình luận của chính mình (auth).
- DELETE `/api/comments/{commentId}` — Xoá bình luận (auth; mặc định soft delete).
- POST `/api/comments/{commentId}/like` — Thích/bỏ thích (toggle; auth).
- POST `/api/comments/{commentId}/dislike` — Không thích/bỏ không thích (toggle; auth).
- POST `/api/comments/{commentId}/helpful` — Đánh dấu hữu ích (auth).
- POST `/api/comments/{commentId}/report` — Báo cáo vi phạm (auth).

Quản trị kiểm duyệt (Admin moderation)
- GET `/api/admin/comments/moderation` — Hàng chờ kiểm duyệt.
- POST `/api/admin/comments/{id}/moderate` — Duyệt/Từ chối/Gắn cờ với lý do.
- POST `/api/admin/comments/bulk-moderate` — Kiểm duyệt hàng loạt.
- GET `/api/admin/comments/moderation-stats` — KPI kiểm duyệt.

#### 📚 Trường mở rộng khoá học (Enhanced Course Fields)
Public
- GET `/api/courses/enhanced` — Danh sách khoá học với bộ lọc nâng cao (accessibility, devices, gamification...).
- GET `/api/courses/search` — Tìm kiếm full-text đa tiêu chí (highlight/snippets).
- GET `/api/courses/stats/category` — Thống kê theo category/subcategory.
- GET `/api/courses/stats/accessibility` — Thống kê accessibility.
- GET `/api/courses/stats/monetization` — Thống kê mô hình doanh thu.

Protected (giảng viên)
- PUT `/api/courses/{courseId}/analytics` — Cập nhật snapshot analytics của khoá học.
- PUT `/api/courses/{courseId}/seo` — Cập nhật SEO metadata và structured data.
- PUT `/api/courses/{courseId}/localization` — Cập nhật bản dịch/subtitles/dubbing.
- PUT `/api/courses/{courseId}/compliance` — Cập nhật compliance (GDPR, accessibility...).
- POST `/api/courses/recommendations` — Gợi ý khoá học cá nhân hoá (auth).

#### 📤 Upload tệp (Cloudinary)
- GET `/api/upload/health` — Tình trạng dịch vụ upload/config.
- POST `/api/upload/single/image` — Upload 1 ảnh (auth; form-data `image`).
- POST `/api/upload/single/video` — Upload 1 video (auth; form-data `video`).
- POST `/api/upload/single/document` — Upload 1 tài liệu (auth; form-data `document`).
- POST `/api/upload/multiple/images` — Upload nhiều ảnh (auth; `images`).
- POST `/api/upload/multiple/documents` — Upload nhiều tài liệu (auth; `documents`).
- POST `/api/upload/profile-picture` — Upload ảnh đại diện (auth; `profilePicture`).
- POST `/api/upload/course-thumbnail` — Upload thumbnail khoá học (teacher; `thumbnail`).
- POST `/api/upload/course-materials` — Upload tài nguyên khoá học (teacher; `materials`).
- DELETE `/api/upload/file` — Xoá tệp theo publicId/resourceType (auth).
- GET `/api/upload/file/{publicId}/image` — Lấy thông tin tệp (auth).
- POST `/api/upload/signed-url` — Lấy Signed URL để upload trực tiếp (auth).

#### 💰 Thanh toán & Giỏ hàng (VNPay)
Payments
- POST `/api/payments/create` — Tạo yêu cầu thanh toán cho khoá học.
- GET `/api/payments/return` — Xử lý return URL từ VNPay.
- POST `/api/payments/ipn` — Xử lý IPN từ VNPay.
- GET `/api/payments/history` — Lịch sử thanh toán của user (filter/paging).
- POST `/api/payments/refund` — Yêu cầu hoàn tiền.

Cart
- GET `/api/cart` — Lấy giỏ hàng hiện tại.
- POST `/api/cart/add` — Thêm khoá học vào giỏ.
- PUT `/api/cart/update` — Cập nhật số lượng/mã giảm giá.
- DELETE `/api/cart/remove/{courseId}` — Gỡ khoá học khỏi giỏ.
- DELETE `/api/cart/clear` — Xoá toàn bộ giỏ.
- POST `/api/cart/checkout` — Thanh toán qua provider.
- GET `/api/cart/total` — Tính tổng (thuế/giảm giá/vận chuyển).

#### 📄 Xác minh chứng chỉ (Public)
- GET `/api/verify/{certificateId}` — Xác minh tính hợp lệ chứng chỉ.
- POST `/api/verify/qr` — Xác minh bằng dữ liệu QR.
- GET `/api/verify/stats/overview` — Thống kê xác minh (public).

#### 📊 Analytics & Reports
- GET `/api/reports/overview` — Danh sách báo cáo có sẵn & báo cáo gần đây.
- POST `/api/reports/custom` — Tạo báo cáo tuỳ biến (metrics/filters/schedule).
- GET `/api/metrics/system` — System metrics (performance/usage; admin).

---

### 🏢 Quản trị (Admin Management)

#### 📊 Dashboard
- GET `/api/admin/dashboard` — Tổng quan KPI, xu hướng, hoạt động gần đây.

#### 👥 Quản lý người dùng (User Management)
- GET `/api/admin/users` — Danh sách user (filter/paging/sort).
- POST `/api/admin/users` — Tạo user (admin tạo teacher/student).
- GET `/api/admin/users/{userId}` — Chi tiết user (activity, enrollments, payments).
- PUT `/api/admin/users/{userId}` — Cập nhật thông tin/quyền/thiết lập.
- DELETE `/api/admin/users/{userId}` — Xoá (soft-delete) user.
- PUT `/api/admin/users/bulk/status` — Cập nhật trạng thái hàng loạt.

#### 📚 Quản lý khoá học (Course Management)
- GET `/api/admin/courses` — Danh sách khoá học (đầy đủ trường nâng cao).
- POST `/api/admin/courses` — Tạo khoá học (metadata chi tiết).
- PUT `/api/admin/courses/{courseId}` — Cập nhật khoá học.
- DELETE `/api/admin/courses/{courseId}` — Xoá khoá học (tuân thủ policy).

#### 💬 Kiểm duyệt bình luận (Comment Moderation)
- GET `/api/admin/comments/moderation` — Hàng chờ cần xử lý.
- POST `/api/admin/comments/{id}/moderate` — Duyệt/Từ chối/Gắn cờ kèm ghi chú.
- POST `/api/admin/comments/bulk-moderate` — Xử lý hàng loạt.
- GET `/api/admin/comments/moderation-stats` — Thống kê kiểm duyệt.

---

### 👤 Khách hàng (Client System)

#### 📊 Dashboard
- GET `/api/client/dashboard` — Dashboard cá nhân hoá (overview/recommendations/activity).

#### 📚 Khoá học
- GET `/api/client/courses` — Catalog khoá học đã publish (paging/filters/sort).
- GET `/api/client/courses/{courseId}` — Chi tiết khoá học (instructor/ratings/preview).
- POST `/api/client/courses/{courseId}/enroll` — Ghi danh (free/paid).
- GET `/api/client/courses/my-courses` — Danh sách khoá đã ghi danh.

#### 👨‍🏫 Tính năng giảng viên (Teacher)
- GET `/api/client/teacher-dashboard` — Dashboard giảng viên (KPI/feedback).
- GET `/api/client/teacher-dashboard/performance` — Chỉ số hiệu suất theo kỳ.
- POST `/api/client/teacher-rating/submit` — Học viên đánh giá giảng viên.

#### 📄 Chứng chỉ (Client)
- GET `/api/client/certificates` — Danh sách chứng chỉ của user (filter/paging).
- POST `/api/client/certificates/request` — Yêu cầu cấp chứng chỉ.
- GET `/api/client/certificates/{certificateId}/download` — Tải chứng chỉ PDF.

---

### 📌 Lưu ý
- Auth: cần Bearer token trừ khi ghi chú public.
- Roles: một số endpoint yêu cầu role `teacher` hoặc `admin`.
- Validation: tất cả endpoint ghi có validate; lỗi theo chuẩn chung.
- Pagination: hầu hết list hỗ trợ `page`, `limit`, `sortBy`, `sortOrder`.
- Idempotency: các endpoint payment/moderation thiết kế an toàn khi retry (best-effort).

---

### 🧪 Luồng kiểm thử nhanh (gợi ý)
1) Đăng ký → Đăng nhập → `/api/auth/me`.
2) Xem catalog `/api/client/courses`, ghi danh 1 khoá.
3) Tạo bình luận, like/dislike, report.
4) Tạo payment → return/IPN (sandbox) → history.
5) Yêu cầu chứng chỉ → verify bằng ID/QR.
6) Admin: xem users/courses → moderate comments → dashboard.
