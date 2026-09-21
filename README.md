# UGREEN Phân đơn — Web

Ứng dụng Next.js App Router/TypeScript. Phase 01 cung cấp nền tảng, đăng nhập admin phía server và trang thử in development-only.

## Yêu cầu

- Node.js 22–24 (khuyến nghị Node 24 LTS)
- npm 11+

## Chạy local

1. Sao chép `.env.example` thành `.env`.
2. Tạo password hash bằng `npm run hash-password` (mật khẩu nhập vào phải có ít nhất 16 ký tự).
3. Sao chép dòng `ADMIN_PASSWORD_HASH=...` được tạo vào `.env`, rồi cấu hình `ADMIN_USERNAME` và `APP_ORIGIN`.
4. Chạy `npm install` rồi `npm run dev`.
5. Mở `http://localhost:3000`.

`.env` chỉ lưu scrypt hash theo định dạng `scrypt:v1:salt:derivedKey`; ứng dụng không chấp nhận password rõ trong biến môi trường.

Không commit `.env` hoặc khóa service account. Trang `/print-spike` chỉ tồn tại trong development và yêu cầu đăng nhập.

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e` (sau khi UI chạy thật đã được khám phá và test E2E được bổ sung)

## Đổi tài khoản hoặc mật khẩu

Chạy `npm run hash-password`, thay `ADMIN_PASSWORD_HASH` trong env trên server rồi restart Node process. Không truyền mật khẩu trên command line trong production vì có thể xuất hiện trong shell history; chạy lệnh không có đối số để nhập tương tác. Session được giữ trong RAM nên restart vô hiệu hóa toàn bộ phiên cũ. MVP chỉ hỗ trợ một Node process; không chạy multi-process/serverless trước khi chuyển session/rate limit sang kho dùng chung.

