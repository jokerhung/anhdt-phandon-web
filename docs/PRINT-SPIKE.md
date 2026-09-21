# Biên bản thử in Phase 01

Ngày thực hiện: 21/09/2026  
Trạng thái: **Prototype và đo PDF tự động Chromium đã đạt; giấy thật/driver Chrome và Edge desktop chưa được nghiệm thu trong môi trường hiện tại.**

## Phạm vi đã triển khai

- Trang `/print-spike` chỉ khả dụng khi `NODE_ENV=development` và yêu cầu phiên admin.
- Phiếu giả có tiếng Việt, bảng 5 cột SKU / T / KHÁCH / SL / GHI CHÚ, số lượng `0` và ghi chú dài xuống dòng.
- Profile A7: phiếu và trang dọc `74 × 105 mm`, margin 0.
- Profile A4: trang `210 × 297 mm`, margin 12 mm, bên trong vẫn là phiếu đúng `74 × 105 mm`, không kéo giãn.
- Toolbar bị ẩn trong print media; nút “In / Ctrl+P” chỉ gọi `window.print()`, Ctrl+P native không bị can thiệp.
- Có liên kết chọn profile A7/A4 trên trang thử; profile được encode trong query và vẫn yêu cầu đăng nhập.

## Cách đo thủ công cần thực hiện

1. Chạy ứng dụng development, đăng nhập và mở `/print-spike`.
2. Chrome và Edge: mở Ctrl+P, tắt Headers and footers, scale 100%, margin None/default theo driver.
3. Xuất PDF, đo trang/vùng phiếu và kiểm tra chữ Việt, đường bảng, ghi chú dài, toolbar không xuất hiện.
4. In bằng máy/driver người dùng xác nhận ở A7; ghi model máy, phiên bản driver, custom paper, sai số chiều rộng/cao và margin thực tế.
5. Thử profile A4 với phiếu kích thước thật, không Fit to page.

## Bằng chứng

- Playwright Chromium render print media thành PDF với `preferCSSPageSize`.
- Profile A7 đạt 1 trang, kích thước xấp xỉ `74 × 105 mm` (sai số dưới 1 point).
- Profile A4 đạt 1 trang, kích thước xấp xỉ `210 × 297 mm`; phần tử phiếu vẫn xấp xỉ `74 × 105 mm` (sai số dưới 2 CSS pixel).
- Test xác minh toolbar bị ẩn trong print media và vùng phiếu/chuỗi tiếng Việt vẫn render.
- Production build đạt với cấu hình test an toàn; suite E2E auth còn xác minh cookie HttpOnly/SameSite và logout thu hồi phiên.

## Giới hạn còn mở

- Chưa xác nhận hộp thoại Ctrl+P native thủ công trên Chrome/Edge desktop, header/footer theo từng browser và profile A4 bằng phép đo thủ công.
- Chưa có máy in/driver do người dùng cung cấp nên chưa đo giấy thật, custom paper hoặc sai số margin.
- **Không xem PDF tự động là bằng chứng in giấy đạt.** Hạng mục nghiệm thu máy in vẫn mở và phải hoàn tất ở Phase 04 trước phát hành.
