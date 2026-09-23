# Cache tra cứu

- Danh sách file và metadata tab: cache RAM 5 phút, tối đa 100 mục trên mỗi Google client. Các yêu cầu cùng khóa đang tải được gộp lại; không cache lỗi.
- Quyền truy cập file/folder vẫn được kiểm tra trực tiếp trước khi trả danh sách tab, kể cả cache hit.
- Nội dung sheet: giữ cache snapshot hiện có, mặc định `SHEETS_CACHE_TTL_SECONDS=60`. Các API lô/kiện/preview dùng snapshot đồng nhất.
- Làm mới khi đã chọn tab: đọc lại metadata và nội dung sheet từ Google. Không xóa dữ liệu cũ trên màn hình trong lúc tải; giữ lựa chọn lô/kiện nếu còn tồn tại, cập nhật lại phần phân bổ trước khi cho xem trước.
- Trong lúc cập nhật: hiển thị thông báo, khóa lựa chọn và xem trước/in từ màn hình tra cứu. Nếu cập nhật lỗi, bản cũ vẫn hiển thị nhưng không được dùng để mở phiếu mới. Phiếu đã mở ở tab khác vẫn giữ snapshot riêng theo cơ chế hiện có.
- Làm mới khi chưa chọn tab: tải lại danh sách file và tab, bỏ qua cache metadata. Endpoint files/sheets hỗ trợ `refresh=1` sau xác thực. Danh sách file tải thường có thể chậm cập nhật tối đa 5 phút.
- Cache chỉ ở RAM server; không lưu dữ liệu phân đơn vào localStorage hay CDN. Restart/redeploy xóa cache. Lần tải đầu và tải mới bắt buộc vẫn phụ thuộc tốc độ Google; không cam kết nhanh như cache hit.
