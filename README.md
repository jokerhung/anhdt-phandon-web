# UGREEN Phân đơn — Web

Ứng dụng Next.js App Router/TypeScript. Phase 01 cung cấp nền tảng, đăng nhập admin phía server và trang thử in development-only.

## Yêu cầu

- Node.js 22–24 (khuyến nghị Node 24 LTS)
- npm 11+

## Chạy local

1. Sao chép `.env.example` thành `.env`.
2. Thay `ADMIN_USERNAME`, `ADMIN_PASSWORD` (ít nhất 16 ký tự, không dùng placeholder) và kiểm tra `APP_ORIGIN`.
3. Chạy `npm install` rồi `npm run dev`.
4. Mở `http://localhost:3000`.

Không commit `.env` hoặc khóa service account. Trang `/print-spike` chỉ tồn tại trong development và yêu cầu đăng nhập.

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e` (sau khi UI chạy thật đã được khám phá và test E2E được bổ sung)

## Đổi tài khoản hoặc mật khẩu

Sửa env trên server và restart Node process. Session được giữ trong RAM nên restart vô hiệu hóa toàn bộ phiên cũ. MVP chỉ hỗ trợ một Node process; không chạy multi-process/serverless trước khi chuyển session/rate limit sang kho dùng chung.
