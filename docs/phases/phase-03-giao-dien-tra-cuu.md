# Phase 03 — Giao diện chọn File → Sheet → Lô → Kiện

Trạng thái: **Chưa bắt đầu**.

## Đầu vào và phạm vi

- Phụ thuộc: Phase 02.
- Đặc tả chi tiết: [PLAN.md](../PLAN.md), §6, trang tra cứu.
- Đường dẫn triển khai tính từ gốc repository; chỉ thực hiện trong phạm vi phase được yêu cầu.

## 3.1. Giao diện chọn File → Sheet → Lô → Kiện

### Công việc

- [ ] Tạo header tiếng Việt với thời điểm đồng bộ, Làm mới và Đăng xuất.
- [ ] Làm bốn combobox trắng, chữ đen, viền/mũi tên thống nhất; Kiện có tìm kiếm và lựa chọn hợp lệ.
- [ ] Khóa trường phụ thuộc khi chưa đủ dữ liệu; nút Xem trước chỉ bật khi lựa chọn hợp lệ và đã tải xong.
- [ ] Đổi file reset sheet/lô/kiện/preview; đổi sheet reset lô/kiện/preview; đổi lô reset kiện/preview; đổi kiện xóa preview.
- [ ] Dùng AbortController/request key chống response cũ; refresh reset/xác thực lại lựa chọn.
- [ ] Xử lý loading, empty, retry, mất quyền, lỗi parser, 409 snapshot và 401; không hiển thị dữ liệu cũ như kết quả mới.
- [ ] Điều hướng sang /preview với query encode đúng khi người dùng bấm Xem trước; không tự in/chuyển khi vừa chọn.
- [ ] Khám phá UI chạy thật, sau đó thêm E2E locator role/label/test-id với wait theo trạng thái; kiểm tra bàn phím và màn hình hẹp.
- [ ] Áp dụng quy chuẩn responsive ở PLAN §6: form một cột trên mobile, toolbar xuống dòng, vùng chạm ≥44px, input mobile ≥16px; không tràn ngang ở 320/375/390/768/1440px.
- [ ] Kiểm tra tên nguồn dài, danh sách kiện và bàn phím ảo không che lựa chọn/nút Xem trước; nghiệm thu Android Chrome/iOS Safari riêng với kiểm tra viewport PC.

### Đầu ra

LookupForm/SearchableSelect và luồng lựa chọn kết nối API thật; bộ E2E cho lựa chọn.

### Tiêu chí hoàn thành

- [ ] Đi từ file đến kiện được bằng chuột/bàn phím; tên có dấu và danh sách dài hoạt động.
- [ ] Đổi nguồn liên tiếp, refresh thất bại và response đến muộn không làm xuất hiện lựa chọn/preview cũ.
- [ ] Logout/401 xóa trạng thái; chưa có lựa chọn hợp lệ không đi tới preview hợp lệ.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## Bàn giao phase

Phase 04 hoàn thiện trang xem trước và in.

- Ghi file thay đổi, lệnh kiểm tra/kết quả, bằng chứng và vấn đề còn mở.
- Chỉ đánh dấu hoàn thành khi các phần bắt buộc có bằng chứng; không xem mock/PDF là bằng chứng Google live/in giấy.
- Không ghi secret hoặc dữ liệu nhạy cảm vào biên bản. Việc chia tài liệu không đồng nghĩa đã triển khai.
