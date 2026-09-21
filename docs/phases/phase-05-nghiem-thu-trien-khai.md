# Phase 05 — Nghiệm thu, triển khai và bàn giao

Trạng thái: **Chưa bắt đầu**.

## Đầu vào và phạm vi

- Phụ thuộc: Phase 01–04; host/domain/HTTPS và quyền triển khai được người dùng xác nhận.
- Đặc tả chi tiết: [PLAN.md](../PLAN.md), §9–10 và toàn bộ ma trận nghiệm thu.
- Đường dẫn triển khai tính từ gốc repository; chỉ thực hiện trong phạm vi phase được yêu cầu.

## 5.1. Nghiệm thu, triển khai và bàn giao

### Công việc

- [ ] Chạy typecheck/lint/unit/integration/E2E/production build; ghi kết quả từng lệnh và phiên bản môi trường.
- [ ] Đi lại toàn luồng login → file → sheet → lô → kiện → preview → in; kiểm lỗi mạng/quota, 401/409 và đổi nguồn nhanh.
- [ ] Rà soát bí mật trong git/bundle/HTML/log; kiểm tra cache riêng, input validation, XSS từ ô Sheet, CSRF, rate limit và thu hồi session.
- [ ] Triển khai production một Node process sau reverse proxy HTTPS; xác minh cookie Secure, APP_ORIGIN, trusted proxy và quyền đọc file env/key.
- [ ] Không dùng multi-process/serverless với session RAM; nếu môi trường yêu cầu thì phải thiết kế kho session/rate-limit dùng chung trước triển khai.
- [ ] Viết SETUP.md cho setup Google/env, dev/build/start, đổi password/key, restart, backup bí mật và rollback; không ghi giá trị bí mật thật.
- [ ] Viết ACCEPTANCE.md ghi từng ca, kết quả, ngày, môi trường, bằng chứng và tồn đọng; tổng hợp giấy thật từ Phase 04.
- [ ] Xác nhận Android không bị ảnh hưởng; bàn giao hướng dẫn và các giới hạn browser/driver.

### Đầu ra

Bản web production được phép triển khai, SETUP.md, PRINTING.md và ACCEPTANCE.md hoàn chỉnh.

### Tiêu chí hoàn thành

- [ ] Toàn bộ ma trận PLAN.md §9 đạt hoặc ngoại lệ được người dùng chấp nhận rõ; không tự bỏ qua lỗi mất/sai dữ liệu, lộ bí mật.
- [ ] Không còn login mặc định, secret công khai hay API dữ liệu không bảo vệ; logout/đổi password hoạt động ở production.
- [ ] Đã có nghiệm thu máy in thật, quy trình rollback và hướng dẫn vận hành; không nhầm việc build thành công với phát hành hoàn tất.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## Bàn giao phase

Bàn giao; tính năng ngoài PLAN.md cần yêu cầu/phạm vi riêng.

- Ghi file thay đổi, lệnh kiểm tra/kết quả, bằng chứng và vấn đề còn mở.
- Chỉ đánh dấu hoàn thành khi các phần bắt buộc có bằng chứng; không xem mock/PDF là bằng chứng Google live/in giấy.
- Không ghi secret hoặc dữ liệu nhạy cảm vào biên bản. Việc chia tài liệu không đồng nghĩa đã triển khai.

