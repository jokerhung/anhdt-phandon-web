# Vận hành Web Phân Đơn

## Kiểm tra hằng ngày

- `/api/health` trả 200 và đúng version.
- Đăng nhập, liệt kê file/sheet và tải một lô mẫu.
- Theo dõi HTTP 5xx/429 và Google quota.
- Xác minh thời gian hệ thống/múi giờ `Asia/Ho_Chi_Minh` đúng.

## Sự cố thường gặp

### Tất cả người dùng bị đăng xuất

Process đã restart hoặc env/password đổi. Đây là hệ quả của session RAM. Đăng nhập lại; kiểm tra service manager nếu restart ngoài kế hoạch.

### Không thấy file Google

Kiểm tra quyền chia sẻ cho service account, folder scope và key còn hiệu lực. Không gửi key qua chat/email không mã hóa.

### 409 SNAPSHOT_EXPIRED

Quay lại trang tra cứu và bấm Làm mới. Không sửa URL để tái sử dụng snapshot cũ.

### 429 đăng nhập

Chờ theo `Retry-After`. Nếu nhiều người dùng chung một IP sau proxy, kiểm tra proxy ghi đè `X-Forwarded-For` và `TRUST_PROXY`; không tắt rate limit để xử lý tạm.

### Phiếu quá khổ

Không giảm scale. Kiểm tra dữ liệu/ghi chú và hướng dẫn trong `PRINTING.md`.

## Restart có kiểm soát

1. Thông báo người dùng vì mọi session sẽ mất.
2. Dừng nhận truy cập hoặc đưa trang bảo trì tại reverse proxy.
3. Restart đúng một process.
4. Kiểm tra health, login và Google read-only.
5. Mở lại traffic.

## Quyền truy cập

- Tài khoản chạy app chỉ cần đọc source/artifact, env và Google key; ghi log tại vị trí riêng nếu cần.
- Không cho web server phục vụ thư mục chứa env/key.
- Hạn chế quyền quản trị host; ghi nhận ai đổi password/key/release.

## Nâng cấp và rollback

Dùng version bất biến qua `DEPLOYMENT_VERSION`. Không sửa trực tiếp artifact đang chạy. Mỗi release phải có dependency lock, kết quả verify và đường rollback theo `SETUP.md`.
