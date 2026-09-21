# Phase 03 — Giao diện chọn File → Sheet → Lô → Kiện

Trạng thái: **Hoàn thành triển khai và E2E desktop/mobile viewport; nghiệm thu thiết bị thật còn mở**.

## Đầu vào và phạm vi

- Phụ thuộc: Phase 02.
- Đặc tả chi tiết: [PLAN.md](../PLAN.md), §6, trang tra cứu.
- Đường dẫn triển khai tính từ gốc repository; chỉ thực hiện trong phạm vi phase được yêu cầu.

## 3.1. Giao diện chọn File → Sheet → Lô → Kiện

### Công việc

- [x] Tạo header tiếng Việt với thời điểm đồng bộ, Làm mới và Đăng xuất.
- [x] Làm bốn combobox trắng, chữ đen, viền/mũi tên thống nhất; Kiện có tìm kiếm và lựa chọn hợp lệ.
- [x] Khóa trường phụ thuộc khi chưa đủ dữ liệu; nút Xem trước chỉ bật khi lựa chọn hợp lệ và đã tải xong.
- [x] Đổi file reset sheet/lô/kiện/preview; đổi sheet reset lô/kiện/preview; đổi lô reset kiện/preview; đổi kiện xóa preview.
- [x] Dùng AbortController/request key chống response cũ; refresh reset/xác thực lại lựa chọn.
- [x] Xử lý loading, empty, retry, mất quyền, lỗi parser, 409 snapshot và 401; không hiển thị dữ liệu cũ như kết quả mới.
- [x] Điều hướng sang /preview với query encode đúng khi người dùng bấm Xem trước; không tự in/chuyển khi vừa chọn.
- [x] Khám phá UI chạy thật, sau đó thêm E2E locator role/label/test-id với wait theo trạng thái; kiểm tra bàn phím và màn hình hẹp.
- [x] Áp dụng quy chuẩn responsive ở PLAN §6: form một cột trên mobile, toolbar xuống dòng, vùng chạm ≥44px, input mobile ≥16px; không tràn ngang ở 320/375/390/768/1440px.
- [x] Tên nguồn dài được truncate, danh sách kiện có tìm kiếm/scroll và viewport 320px không tràn ngang. Nghiệm thu bàn phím ảo và Android Chrome/iOS Safari trên thiết bị thật còn mở.

### Đầu ra

LookupForm/SearchableSelect và luồng lựa chọn kết nối API thật; bộ E2E cho lựa chọn.

### Tiêu chí hoàn thành

- [x] Đi từ file đến kiện được bằng chuột/bàn phím; tên có dấu và danh sách dài hoạt động.
- [x] Đổi nguồn liên tiếp, refresh thất bại và response đến muộn không làm xuất hiện lựa chọn/preview cũ.
- [x] Logout/401 xóa trạng thái; chưa có lựa chọn hợp lệ không đi tới preview hợp lệ.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## Bàn giao phase

Phase 04 hoàn thiện trang xem trước và in.

- Bằng chứng: `npm run typecheck`, `npm run lint`, `npm test` (26 test), `npm run test:e2e` (5 test khi có Google credential) và `npm run build` đều đạt.
- E2E live đi đủ File → Sheet → Lô → tìm Kiện → `/preview`; kiểm tra trường phụ thuộc, nút Xem trước và viewport 320px. Thiết bị thật Android/iOS còn mở.
- Chỉ đánh dấu hoàn thành khi các phần bắt buộc có bằng chứng; không xem mock/PDF là bằng chứng Google live/in giấy.
- Không ghi secret hoặc dữ liệu nhạy cảm vào biên bản. Việc chia tài liệu không đồng nghĩa đã triển khai.

