# Cài đặt và triển khai Web Phân Đơn

## 1. Kiến trúc production bắt buộc

- Node.js 22–24, **một process duy nhất**.
- Reverse proxy HTTPS (Nginx/IIS/Caddy) chuyển tiếp tới `127.0.0.1:3000`.
- Không dùng nhiều worker, PM2 cluster, nhiều container hoặc serverless: session và rate limit hiện nằm trong RAM của một process.
- Service account Google chỉ có scope Drive/Sheets read-only và file JSON nằm ngoài repository/web root.

## 2. Chuẩn bị

```bash
npm ci
npm run hash-password
```

Tạo file env riêng trên server từ `.env.example`; không commit file này. Biến bắt buộc:

- `ADMIN_USERNAME`: không dùng `admin` trong production.
- `ADMIN_PASSWORD_HASH`: hash scrypt từ lệnh trên.
- `APP_ORIGIN`: origin HTTPS công khai, không có dấu `/` cuối.
- `ALLOWED_ORIGINS`: danh sách origin bổ sung được phép đăng nhập/đăng xuất, phân cách bằng dấu phẩy. `APP_ORIGIN` luôn được phép; bỏ trống để giữ hành vi cũ. Ví dụ: `https://phandon.sk2.io.vn,http://localhost:3003,http://127.0.0.1:3003`. Chỉ HTTP/HTTPS, không wildcard, tài khoản, đường dẫn, query hoặc fragment. Origin khác port là origin khác; phải khai báo đúng port. Restart app sau khi đổi. Đây là allowlist CSRF, không phải cấu hình CORS; cookie đăng nhập riêng cho từng hostname và vẫn giữ Secure trong production.
- `PORT=3000`: cổng lắng nghe của `npm run dev` và `npm start`, đọc từ `.env`. Ưu tiên: `--port`/`-p` → biến môi trường hệ thống → `.env` → mặc định 3000. Sau khi đổi cần khởi động lại ứng dụng; khi chạy local, cập nhật `APP_ORIGIN` cùng port. Sau reverse proxy, `APP_ORIGIN` vẫn là URL HTTPS công khai.
- `GOOGLE_APPLICATION_CREDENTIALS`: đường dẫn tuyệt đối tới key JSON.
- `GOOGLE_DRIVE_FOLDER_ID`: folder giới hạn nguồn nếu áp dụng.
- `TRUST_PROXY=true`: chỉ khi reverse proxy tin cậy **ghi đè** `X-Forwarded-For` từ client.
- `DEPLOYMENT_VERSION`: mã release/commit không chứa secret.

Cấp quyền file env/key chỉ cho tài khoản chạy service. Không đặt key trong repository, `public/`, `.next/` hoặc thư mục log.

## 3. Kiểm tra và build

Docker/Coolify lưu ý: repository hiện không có thư mục `public/` được track. Dockerfile không `COPY /app/public`; nếu thêm asset public sau này, phải track thư mục đó và bổ sung copy tương ứng.

```bash
npm run check:production-env
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

`test:e2e` live cần credential Google read-only trong môi trường chạy test. Không in giá trị env vào log CI.

## 4. Chạy production

```bash
npm run start -- --hostname 127.0.0.1
```

Reverse proxy phải:

- Kết thúc TLS và redirect HTTP → HTTPS.
- Ghi đè `X-Forwarded-For`, không nối header do Internet gửi vào.
- Gửi `Host`/`X-Forwarded-Proto` đúng.
- Không cache HTML hoặc `/api/*`.
- Chỉ có một upstream Node.

Kiểm tra:

```text
GET https://DOMAIN/api/health
```

Kỳ vọng HTTP 200, `status=ok`, `Cache-Control: private, no-store` và đúng `DEPLOYMENT_VERSION`.

## 5. Đổi mật khẩu

1. Chạy `npm run hash-password` trên máy tin cậy.
2. Thay `ADMIN_PASSWORD_HASH` trong secret store/env.
3. Restart process Node.
4. Xác minh mật khẩu cũ không đăng nhập được và mật khẩu mới hoạt động.

Restart xóa toàn bộ session RAM, snapshot cache và rate-limit hiện tại; đây là hành vi mong đợi.

## 6. Đổi Google key

1. Tạo/cấp key mới với quyền đọc tối thiểu.
2. Chia sẻ đúng folder/file cho service account mới.
3. Thay file key và đường dẫn env nếu cần.
4. Restart rồi kiểm tra files → sheets → lots.
5. Thu hồi/xóa key cũ sau khi xác minh.

## 7. Backup và phục hồi bí mật

Backup mã hóa, có kiểm soát truy cập cho:

- File env production.
- Key service account hiện hành.
- Tài liệu cấu hình reverse proxy/service manager.

Không cần backup session/cache RAM. Kiểm tra phục hồi định kỳ trên máy cô lập, không ghi secret vào biên bản.

## 8. Rollback

1. Giữ artifact/source release trước và file khóa dependency.
2. Dừng process hiện tại.
3. Khôi phục release trước; giữ nguyên env/key nếu cấu hình tương thích.
4. Chạy `npm ci`, `npm run build`, sau đó start một process.
5. Kiểm tra `/api/health`, đăng nhập và tra cứu live.

Rollback/restart sẽ đăng xuất mọi người dùng vì session nằm trong RAM.

## 9. Log và giám sát

- Theo dõi uptime, HTTP 5xx/429, Google quota và dung lượng đĩa.
- Không log request body đăng nhập, cookie, hash mật khẩu, Google token/key hoặc raw Sheet.
- Cảnh báo khi `/api/health` không trả 200 hoặc version không đúng release.

## 10. In

Xem [PRINTING.md](PRINTING.md). PDF tự động không thay thế nghiệm thu Chrome/Edge, driver và giấy thật.
