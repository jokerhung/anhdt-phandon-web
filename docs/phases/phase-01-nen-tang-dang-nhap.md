# Phase 01 — Nền tảng, đăng nhập admin và thử in

Trạng thái: **Đã triển khai nền tảng/auth và PDF tự động; chờ nghiệm thu máy in thật**.

## Đầu vào và phạm vi

- Phụ thuộc: Không có. Đọc PLAN.md trước khi thực hiện.
- Đặc tả chi tiết: [PLAN.md](../PLAN.md), §3–4 và §7.
- Đường dẫn triển khai tính từ gốc repository; chỉ thực hiện trong phạm vi phase được yêu cầu.

## 1.1. Khởi tạo Next.js / TypeScript

### Công việc

- [x] Tạo `web/` ở gốc repository với App Router, TypeScript strict và Node runtime; không sửa cấu trúc Android.
- [x] Chốt phiên bản Node/Next stable được hỗ trợ tại thời điểm triển khai; commit lockfile và khai báo Node engine.
- [x] Thiết lập lint, typecheck, build, Vitest và cấu hình Playwright; E2E được thêm sau khi khám phá UI chạy thật.
- [x] Tạo cấu trúc app/components/lib/tests theo PLAN.md; phân ranh module server-only và client.
- [x] Tạo `.env.example` chỉ có placeholder theo PLAN.md, schema kiểm tra cấu hình và thông báo lỗi không chứa bí mật.
- [x] Cập nhật ignore cho env thật, node_modules, .next, báo cáo test; không đọc hoặc sao chép khóa Google Android.
- [x] Thêm scripts dev/build/start/lint/typecheck/test và README chạy local trong `web/`.

### Đầu ra

Project `web/`, lockfile, scripts, env schema và `.env.example`.

### Tiêu chí hoàn thành

- [x] Ứng dụng khởi động local và production build thành công với cấu hình kiểm thử phù hợp.
- [x] Thiếu/sai cấu hình runtime được báo rõ; không cần bí mật production để chạy unit test.
- [x] Ignore hoạt động; không đưa mật khẩu/key thật vào source, HTML hoặc bundle client.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## 1.2. Thử nghiệm khổ giấy và Ctrl+P

### Công việc

- [x] Tạo trang thử local-only với phiếu giả có tiếng Việt, 5 cột và các trường hợp ghi chú dài.
- [x] Tạo profile A7 74 × 105 mm và profile A4 chứa phiếu 74 × 105 mm kích thước thật; không kéo giãn phiếu theo trang.
- [x] Thử CSS print ẩn toolbar, font và @page; E2E xác minh print media, nút gọi window.print(); Ctrl+P native giữ nguyên.
- [ ] Đo thủ công PDF xuất từ Chrome/Edge; ghi nhận scale, margin và ảnh hưởng header/footer trình duyệt. Đã đo tự động Chromium A7 đạt.
- [ ] Nghiệm thu trên máy in/driver do người dùng xác nhận; chưa có thiết bị trong môi trường thực hiện.
- [x] Ghi kết quả thử vào `docs/PRINT-SPIKE.md`; nêu rõ phần đã đo và phần chưa có thiết bị, không đánh dấu in giấy đạt nếu chỉ kiểm PDF.
- [x] Giới hạn trang thử ở development; không để endpoint dữ liệu giả không cần thiết trong production.

### Đầu ra

Prototype in và biên bản `PRINT-SPIKE.md`, thông số dùng cho Phase 04.

### Tiêu chí hoàn thành

- [x] PDF Chromium tự động giữ vùng tiếng Việt, đúng A7 và A4/phiếu kích thước thật trong sai số kiểm tra, không in toolbar.
- [x] Phụ thuộc thiết bị/in giấy thật được ghi rõ còn mở; không xem PDF là bằng chứng giấy thật.
- [x] Khả năng hỗ trợ A7/driver chưa xác minh được ghi nhận; có thể làm phase tiếp theo nhưng chưa nghiệm thu phát hành.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## 1.3. Đăng nhập admin và bảo vệ truy cập

### Công việc

- [x] Tạo form `/login`, POST login/logout; đọc ADMIN_USERNAME và ADMIN_PASSWORD chỉ ở server, không có password mặc định.
- [x] Kiểm tra password bằng scrypt/timingSafeEqual theo PLAN.md; giới hạn kích thước input và số tác vụ xác thực đồng thời.
- [x] Tạo token phiên ngẫu nhiên, lưu hash/expiry server; cookie HttpOnly, SameSite, Secure ở production và TTL tuyệt đối.
- [x] Quản lý session trong RAM có dọn hết hạn/giới hạn dung lượng cho một Node process; restart thu hồi tất cả phiên.
- [x] Thêm requireAdmin cho page và helper API dùng chung; redirect nội bộ hợp lệ, API guard trả 401 để Phase 02 áp dụng.
- [x] Kiểm tra Origin/CSRF cho POST; rate limit đăng nhập, Retry-After, thông báo sai thông tin thống nhất.
- [x] Làm logout thu hồi token server, xóa cookie/trạng thái điều hướng; ghi rõ quy trình đổi password + restart.
- [x] Khám phá form chạy thật trước khi viết E2E; chỉ dùng dữ liệu đăng nhập test.

### Đầu ra

Module auth, trang login, API login/logout, guard dùng chung và test xác thực.

### Tiêu chí hoàn thành

- [x] Đăng nhập đúng/sai, hết hạn, logout và token cũ được test; restart/đổi password được bảo đảm bởi session RAM và quy trình vận hành, chưa dùng secret production.
- [x] Truy cập page trực tiếp chưa đăng nhập bị redirect; helper API chưa phiên trả 401; redirect ngoài site bị từ chối.
- [x] POST khác origin và rate limit được kiểm chứng bằng live HTTP/unit test; lỗi cấu hình không chứa giá trị secret.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## Bàn giao phase

Phase 02. Nếu chưa có máy in, có thể tiếp tục backend/UI nhưng giữ nghiệm thu giấy chưa đạt đến Phase 04.

- Bằng chứng: `npm run lint`, `npm run typecheck`, `npm test` (11 test), `npm run test:e2e` (3 test: auth/logout, PDF A7/A4, Origin/rate limit), `npm run build` đều đạt ngày 21/09/2026.
- Vấn đề còn mở: đo thủ công Chrome/Edge và nghiệm thu máy in/driver giấy thật; xem `docs/PRINT-SPIKE.md`.
- Không xem PDF Chromium là bằng chứng in giấy; Phase 01 đủ nền tảng để bàn giao Phase 02 nhưng chưa đủ điều kiện phát hành.
- Không ghi secret hoặc dữ liệu nhạy cảm vào biên bản. Việc chia tài liệu không đồng nghĩa đã triển khai.

