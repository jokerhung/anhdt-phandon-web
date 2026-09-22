# Phase 05 — Nghiệm thu, triển khai và bàn giao

Trạng thái: **Hoàn thành hardening, tài liệu và nghiệm thu tự động; chưa triển khai production/giấy thật do thiếu host, domain và thiết bị**.

## Đầu vào và phạm vi

- Phụ thuộc: Phase 01–04; host/domain/HTTPS và quyền triển khai được người dùng xác nhận.
- Đặc tả chi tiết: [PLAN.md](../PLAN.md), §9–10 và toàn bộ ma trận nghiệm thu.
- Đường dẫn triển khai tính từ gốc repository; chỉ thực hiện trong phạm vi phase được yêu cầu.

## 5.1. Nghiệm thu, triển khai và bàn giao

### Công việc

- [x] Chạy typecheck/lint/unit/integration/E2E/production build; kết quả và môi trường ghi tại `docs/web/ACCEPTANCE.md`.
- [x] Đi lại tự động/live luồng login → file → sheet → lô → kiện → preview → PDF; 401/409, query giả, reset/request cũ và ánh xạ lỗi nguồn có test. Ctrl+P/driver thật còn mở.
- [x] Rà soát cấu hình/bundle/HTML test, no-store, validation, React escaping, CSRF, rate limit, session và security headers; host/log production còn phải xác minh sau triển khai.
- [ ] Chưa triển khai production: chưa có host/domain HTTPS/quyền triển khai. Đã bổ sung preflight và hướng dẫn một Node process, Secure cookie, APP_ORIGIN, trusted proxy, quyền env/key.
- [x] Tài liệu và cổng preflight quy định không dùng multi-process/serverless; nếu scale ngang phải thiết kế kho session/rate-limit/cache dùng chung trước.
- [x] Viết `docs/web/SETUP.md` cho Google/env, dev/build/start, đổi password/key, restart, backup bí mật và rollback; không ghi giá trị bí mật thật.
- [x] Viết `docs/web/ACCEPTANCE.md` ghi từng ca, kết quả, môi trường, bằng chứng và tồn đọng; giấy thật được giữ là cổng chưa đạt.
- [x] Không sửa mã Android; tài liệu bàn giao ghi giới hạn browser/driver và nhu cầu regression Android riêng nếu phát hành Android.

### Đầu ra

Bản web sẵn sàng triển khai sau khi vượt các cổng hạ tầng/nghiệm thu còn mở; SETUP.md, OPERATIONS.md, PRINTING.md và ACCEPTANCE.md hoàn chỉnh.

### Tiêu chí hoàn thành

- [ ] Ma trận phần mềm tự động đạt; ngoại lệ host HTTPS, thiết bị mobile thật và máy in/giấy thật chưa được người dùng nghiệm thu/chấp nhận.
- [x] Production env từ chối username `admin`, placeholder/sai hash, HTTP origin và thiếu Google credential; API dữ liệu bảo vệ, logout hoạt động. Đổi password trên host thật còn chờ triển khai.
- [ ] Đã có rollback/vận hành; chưa có nghiệm thu máy in thật và chưa phát hành production, nên không tuyên bố hoàn tất phát hành.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## Bàn giao phase

Bàn giao; tính năng ngoài PLAN.md cần yêu cầu/phạm vi riêng.

- Bằng chứng: typecheck/lint/build đạt, 30 unit/integration test và 9 E2E đạt khi có Google live; production-env preflight đạt với cấu hình giả lập.
- Tài liệu: `docs/web/SETUP.md`, `docs/web/OPERATIONS.md`, `docs/web/PRINTING.md`, `docs/web/ACCEPTANCE.md`. Cổng mở: host/domain HTTPS, quyền triển khai, mobile thật và máy in/giấy thật.
- Chỉ đánh dấu hoàn thành khi các phần bắt buộc có bằng chứng; không xem mock/PDF là bằng chứng Google live/in giấy.
- Không ghi secret hoặc dữ liệu nhạy cảm vào biên bản. Việc chia tài liệu không đồng nghĩa đã triển khai.


