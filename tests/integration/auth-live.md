# Kiểm tra tích hợp auth Phase 01

Đã xác minh trên server local bằng HTTP thực:

- GET `/` chưa có cookie → 307 về `/login?next=%2F`.
- POST login thiếu/sai Origin → 403.
- Sai tài khoản → 401 và thông báo thống nhất.
- Sau 5 lần sai từ cùng client → 429 và có `Retry-After`; suite chạy trên process riêng để không ảnh hưởng E2E đăng nhập.
- Đúng tài khoản test → 200, redirect nội bộ; URL ngoài site bị đổi về `/`.
- Cookie hợp lệ truy cập trang bảo vệ → 200.
- Logout → 200; cookie/token cũ truy cập lại → 307 về login.

Không chứa credential production; giá trị test chỉ tồn tại trong lệnh/process kiểm thử.
