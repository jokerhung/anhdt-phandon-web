# Phase 04 — Xem trước phiếu và in Ctrl+P

Trạng thái: **Hoàn thành phần mềm và kiểm thử PDF; nghiệm thu Ctrl+P/Chrome/Edge và giấy thật còn mở**.

## Đầu vào và phạm vi

- Phụ thuộc: Phase 03 và kết quả thử in của Phase 01. Cần máy in được người dùng xác nhận để nghiệm thu giấy.
- Đặc tả chi tiết: [PLAN.md](../PLAN.md), §6–7.
- Đường dẫn triển khai tính từ gốc repository; chỉ thực hiện trong phạm vi phase được yêu cầu.

## 4.1. Xem trước phiếu

### Công việc

- [x] Tạo route /preview được bảo vệ; validate query và truy xuất dữ liệu qua cùng lớp auth/domain, không tin dữ liệu client.
- [x] Tạo một SlipPreview dùng chung cho hiển thị và in, không nhân đôi quy tắc nghiệp vụ.
- [x] Hiển thị LÔ/KIỆN, bảng SKU/T/KHÁCH/SL/GHI CHÚ, ngày, Tổng SKU và tồn nếu > 0.
- [x] Hiển thị nguồn/fetchedAt bên ngoài vùng phiếu; nút Quay lại khôi phục lựa chọn còn hợp lệ.
- [x] Cố định ngày tạo preview theo APP_TIME_ZONE; không suy ngày từ tên tab.
- [x] Xử lý chưa phân bổ, snapshot hết hạn, sửa query và 401; không render phiếu lỗi có thể bị hiểu là hợp lệ.
- [x] Cho ghi chú xuống dòng, không cắt nội dung bằng ellipsis; chuẩn bị trạng thái font/layout-ready và tràn trang cho phần in bên dưới.
- [x] Khám phá và kiểm thử refresh URL, quay lại, nhiều SKU/khách và phiên hết hạn.

### Đầu ra

Trang preview và component SlipPreview; kiểm thử nội dung/điều hướng.

### Tiêu chí hoàn thành

- [x] Nội dung phiếu khớp Slip DTO/Kotlin; số lượng 0, ghi chú và tồn không bị mất.
- [x] Refresh URL hợp lệ hoạt động trong hạn snapshot; query giả/hết hạn không ra phiếu sai.
- [x] Quay lại không tự in; lỗi/401 không giữ preview cũ như dữ liệu đang hợp lệ.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## 4.2. Hoàn thiện in Ctrl+P

### Công việc

- [x] Áp dụng mm/pt, font hỗ trợ tiếng Việt, @page và @media print theo thông số Phase 01.
- [x] Profile A7 mặc định; A4 chứa phiếu kích thước thật. Dùng cùng component và dữ liệu với preview.
- [x] Ẩn header/form/toolbar/nguồn ngoài phiếu khi in; Ctrl+P giữ hành vi native.
- [x] Nút In / Ctrl+P chỉ gọi window.print() khi dữ liệu, font và kiểm tra layout sẵn sàng; không tải dữ liệu trong beforeprint.
- [x] Đo tràn vùng in sau font/layout; phiếu quá khổ hoặc không hợp lệ bị ẩn trong print CSS và có thông báo, không cắt mất nội dung.
- [x] Không hiện In thành công từ afterprint; hủy hộp thoại không xóa lựa chọn.
- [x] Kiểm thử PDF tự động A7/A4 đạt. Kiểm thử thủ công Ctrl+P/print dialog trên Chrome/Edge, đo giấy thật và lặp lại in/hủy còn mở do chưa có thiết bị/driver trong môi trường.
- [x] Viết `docs/web/PRINTING.md`: driver, khổ giấy, scale 100%, header/footer, margin, Save as PDF và xử lý phiếu quá khổ.

### Đầu ra

Print stylesheet/profile, PrintButton, kiểm tra tràn trang và PRINTING.md.

### Tiêu chí hoàn thành

- [x] Ctrl+P/nút In dùng cùng phiếu; PDF không in toolbar, không cắt dòng hoặc sai số lượng. Giấy thật còn chờ nghiệm thu.
- [x] PDF A7/A4 đúng kích thước và ghi chú dài không mất âm thầm; scale theo driver/giấy thật chưa nghiệm thu.
- [x] Chưa phân bổ/phiếu quá khổ không in phiếu dữ liệu lỗi; logic không xóa lựa chọn sau hộp thoại. Thao tác hủy/in lại thực tế còn chờ nghiệm thu.
- [ ] Chưa có bằng chứng giấy thật; giữ cổng phát hành chưa đạt cho đến khi nghiệm thu máy in/driver thực tế.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## Bàn giao phase

Phase 05 nghiệm thu toàn luồng và triển khai.

- Bằng chứng phần mềm: `npm run typecheck`, `npm run lint`, `npm test` (29 test), `npm run test:e2e` (8 test khi có Google credential) và `npm run build` đều đạt.
- PDF tự động xác minh A7 74 × 105 mm, A4 210 × 297 mm; preview live, refresh URL và query giả đã kiểm tra. Vấn đề mở: Ctrl+P/hủy/in lại trên Chrome/Edge và giấy thật.
- Chỉ đánh dấu hoàn thành khi các phần bắt buộc có bằng chứng; không xem mock/PDF là bằng chứng Google live/in giấy.
- Không ghi secret hoặc dữ liệu nhạy cảm vào biên bản. Việc chia tài liệu không đồng nghĩa đã triển khai.

