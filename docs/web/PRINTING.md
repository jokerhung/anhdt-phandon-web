# Hướng dẫn in phiếu phân đơn

## Yêu cầu

- Ưu tiên Chrome hoặc Edge mới trên máy tính đã cài driver máy in.
- Profile mặc định là **A7 ngang 105 × 74 mm**. Profile **A4 ngang** phóng toàn bộ phiếu theo cùng tỷ lệ, vừa trang 297 × 210 mm; không thay đổi cách xuống dòng. Preview và bản in dùng chung tỷ lệ này.
- Web không tự chọn máy in và không thể ép mọi driver tuân thủ khổ giấy.

## Cách in

1. Tại trang xem trước, kiểm tra Lô, Kiện, SKU, khách, số lượng, ghi chú, ngày, Tổng SKU và Tồn.
2. Chọn profile A7 hoặc A4.
3. Bấm **In / Ctrl+P** hoặc nhấn `Ctrl+P`.
4. Trong hộp thoại in:
   - Chọn đúng máy in và khổ giấy tương ứng.
   - Trang đã tự fit vào profile được chọn. Dùng **100%** để giữ đúng kích thước preview; chọn **Fit to page / Fit to printable area** nếu driver cần thu nhỏ theo vùng in được của máy in.
   - Tắt **Headers and footers**.
   - Margin: **None/0** cho cả A7 và A4.
5. In thử một phiếu và đo thực tế trước khi in hàng loạt.

## Save as PDF

Chọn **Save as PDF** trong hộp thoại in. PDF A7 phải có trang 105 × 74 mm; PDF A4 phải là 297 × 210 mm và phiếu bên trong phóng đều, không méo tỷ lệ.

CSS đặt `@page` margin bằng 0 để Chrome/Edge không có vùng chèn ngày, URL và số trang của trình duyệt. Trang web không thể tự bật/tắt các tùy chọn hệ thống như Scale hay Headers and footers; nếu trình duyệt/driver ghi đè cấu hình, chọn lại các thiết lập ở trên. Lô, kiện, ngày và tổng SKU thuộc nội dung phiếu nên vẫn được giữ.

## Phiếu quá khổ

Sau khi font và layout sẵn sàng, trang đo chiều cao nội dung. Nếu phiếu vượt vùng A7, nút In bị khóa và print stylesheet ẩn phiếu để tránh cắt mất dòng/ghi chú. Hãy:

- Đổi A7 sang A4 chỉ phóng theo tỷ lệ, không tăng số dòng chứa được.
- Kiểm tra ghi chú hoặc dữ liệu bất thường.
- Không giảm scale tùy ý vì sẽ làm sai kích thước phiếu.

## Giới hạn nghiệm thu

PDF tự động chỉ kiểm tra DOM, print CSS và kích thước trang. Cần nghiệm thu riêng trên Chrome/Edge, driver và giấy thật: in, hủy hộp thoại, in lại, đo 74 × 105 mm, kiểm tra dấu tiếng Việt và mọi dòng ghi chú.
