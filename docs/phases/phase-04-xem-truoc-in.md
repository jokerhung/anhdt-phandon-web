# Phase 04 — Xem trước phiếu và in Ctrl+P

Trạng thái: **Chưa bắt đầu**.

## Đầu vào và phạm vi

- Phụ thuộc: Phase 03 và kết quả thử in của Phase 01. Cần máy in được người dùng xác nhận để nghiệm thu giấy.
- Đặc tả chi tiết: [PLAN.md](../PLAN.md), §6–7.
- Đường dẫn triển khai tính từ gốc repository; chỉ thực hiện trong phạm vi phase được yêu cầu.

## 4.1. Xem trước phiếu

### Công việc

- [ ] Tạo route /preview được bảo vệ; validate query và truy xuất dữ liệu qua cùng lớp auth/domain, không tin dữ liệu client.
- [ ] Tạo một SlipPreview dùng chung cho hiển thị và in, không nhân đôi quy tắc nghiệp vụ.
- [ ] Hiển thị LÔ/KIỆN, bảng SKU/T/KHÁCH/SL/GHI CHÚ, ngày, Tổng SKU và tồn nếu > 0.
- [ ] Hiển thị nguồn/fetchedAt bên ngoài vùng phiếu; nút Quay lại khôi phục lựa chọn còn hợp lệ.
- [ ] Cố định ngày tạo preview theo APP_TIME_ZONE; không suy ngày từ tên tab.
- [ ] Xử lý chưa phân bổ, snapshot hết hạn, sửa query và 401; không render phiếu lỗi có thể bị hiểu là hợp lệ.
- [ ] Cho ghi chú xuống dòng, không cắt nội dung bằng ellipsis; chuẩn bị trạng thái font/layout-ready và tràn trang cho phần in bên dưới.
- [ ] Khám phá và kiểm thử refresh URL, quay lại, nhiều SKU/khách và phiên hết hạn.

### Đầu ra

Trang preview và component SlipPreview; kiểm thử nội dung/điều hướng.

### Tiêu chí hoàn thành

- [ ] Nội dung phiếu khớp Slip DTO/Kotlin; số lượng 0, ghi chú và tồn không bị mất.
- [ ] Refresh URL hợp lệ hoạt động trong hạn snapshot; query giả/hết hạn không ra phiếu sai.
- [ ] Quay lại không tự in; lỗi/401 không giữ preview cũ như dữ liệu đang hợp lệ.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## 4.2. Hoàn thiện in Ctrl+P

### Công việc

- [ ] Áp dụng mm/pt, font hỗ trợ tiếng Việt, @page và @media print theo thông số Phase 01.
- [ ] Profile A7 mặc định; A4 chứa phiếu kích thước thật. Dùng cùng component và dữ liệu với preview.
- [ ] Ẩn header/form/toolbar/nguồn ngoài phiếu khi in; Ctrl+P giữ hành vi native.
- [ ] Nút In / Ctrl+P chỉ gọi window.print() khi dữ liệu, font và kiểm tra layout sẵn sàng; không tải dữ liệu trong beforeprint.
- [ ] Đo tràn vùng in sau font/layout; phiếu quá khổ hoặc không hợp lệ bị ẩn trong print CSS và có thông báo, không cắt mất nội dung.
- [ ] Không hiện In thành công từ afterprint; hủy hộp thoại không xóa lựa chọn.
- [ ] Kiểm thử PDF tự động và thủ công Ctrl+P/print dialog trên Chrome/Edge; đo giấy thật, lặp lại in/hủy.
- [ ] Viết `docs/web/PRINTING.md`: driver, khổ giấy, scale 100%, header/footer, margin, Save as PDF và xử lý phiếu quá khổ.

### Đầu ra

Print stylesheet/profile, PrintButton, kiểm tra tràn trang và PRINTING.md.

### Tiêu chí hoàn thành

- [ ] Ctrl+P/nút In cho cùng phiếu; PDF/giấy không in toolbar, không cắt dòng hoặc sai số lượng.
- [ ] A7/A4 đúng scale theo driver đã nghiệm thu; ghi chú dài không mất âm thầm.
- [ ] Chưa phân bổ/phiếu quá khổ không in phiếu dữ liệu lỗi; hủy/in lại hoạt động.
- [ ] Có bằng chứng giấy thật; nếu thiếu thiết bị thì giữ hạng mục này chưa đạt, không tuyên bố đã phát hành.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## Bàn giao phase

Phase 05 nghiệm thu toàn luồng và triển khai.

- Ghi file thay đổi, lệnh kiểm tra/kết quả, bằng chứng và vấn đề còn mở.
- Chỉ đánh dấu hoàn thành khi các phần bắt buộc có bằng chứng; không xem mock/PDF là bằng chứng Google live/in giấy.
- Không ghi secret hoặc dữ liệu nhạy cảm vào biên bản. Việc chia tài liệu không đồng nghĩa đã triển khai.
