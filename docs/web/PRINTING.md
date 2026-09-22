# Hướng dẫn in phiếu phân đơn

## Yêu cầu

- Ưu tiên Chrome hoặc Edge mới trên máy tính đã cài driver máy in.
- Profile mặc định là **A7 dọc 74 × 105 mm**. Nếu driver không có A7/custom paper, dùng profile **A4**; phiếu vẫn giữ đúng kích thước 74 × 105 mm trên trang A4.
- Web không tự chọn máy in và không thể ép mọi driver tuân thủ khổ giấy.

## Cách in

1. Tại trang xem trước, kiểm tra Lô, Kiện, SKU, khách, số lượng, ghi chú, ngày, Tổng SKU và Tồn.
2. Chọn profile A7 hoặc A4.
3. Bấm **In / Ctrl+P** hoặc nhấn `Ctrl+P`.
4. Trong hộp thoại in:
   - Chọn đúng máy in và khổ giấy tương ứng.
   - Scale/Tỷ lệ: **100%** hoặc **Actual size**.
   - Tắt **Headers and footers**.
   - Margin: None/0 cho A7; với A4 dùng thiết lập mặc định theo preview.
5. In thử một phiếu và đo thực tế trước khi in hàng loạt.

## Save as PDF

Chọn **Save as PDF** trong hộp thoại in. PDF A7 phải có trang 74 × 105 mm; PDF A4 phải là 210 × 297 mm và phiếu bên trong không bị kéo giãn.

## Phiếu quá khổ

Sau khi font và layout sẵn sàng, trang đo chiều cao nội dung. Nếu phiếu vượt vùng A7, nút In bị khóa và print stylesheet ẩn phiếu để tránh cắt mất dòng/ghi chú. Hãy:

- Thử profile A4 nếu mục đích là kiểm tra/đối chiếu.
- Kiểm tra ghi chú hoặc dữ liệu bất thường.
- Không giảm scale tùy ý vì sẽ làm sai kích thước phiếu.

## Giới hạn nghiệm thu

PDF tự động chỉ kiểm tra DOM, print CSS và kích thước trang. Cần nghiệm thu riêng trên Chrome/Edge, driver và giấy thật: in, hủy hộp thoại, in lại, đo 74 × 105 mm, kiểm tra dấu tiếng Việt và mọi dòng ghi chú.
