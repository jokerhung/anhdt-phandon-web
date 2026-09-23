# Cache tra cứu

- Sau đăng nhập hoặc F5: chỉ tải/cache danh sách file qua `/api/files`, không tự khôi phục file/tab cũ và không tải dữ liệu của tất cả sheet.
- Chọn file: `/api/sheets` tải/cache danh sách tab của đúng file đó. Không đọc nội dung tab ở bước này.
- Chọn tab: `/api/lots` chỉ tải nội dung tab được chọn, parse và tạo snapshot/index lô/kiện. Lô, kiện, số lượng và preview sau đó dùng cùng snapshot RAM.
- Cache được tách theo fileId và sheetId, không có TTL tự tải lại. Chọn nguồn chưa có cache mới gọi Google; quay lại nguồn đã tải dùng lại cache. Yêu cầu trùng đang tải được gộp. `SHEETS_CACHE_TTL_SECONDS` cũ không chi phối cache này.
- **Làm mới** gọi POST có kiểm tra session và origin: tải lại danh sách file, thay thế thế hệ cache, xóa cache tab/snapshot cũ. Giao diện chỉ tải tiếp danh sách tab của file đang chọn và dữ liệu của tab đang chọn (nếu có), không tải các nguồn khác. Giữ lựa chọn lô/kiện còn tồn tại.
- **Tự cập nhật 15 phút theo phiên đăng nhập**: bộ đếm nằm ở layout chung của các màn hình đã đăng nhập (tra cứu, preview), dùng `createdAt` của session server. Không tính lại khi đổi sheet, đổi màn hình hoặc làm mới thủ công. Mỗi mốc 15 phút gọi `POST /api/refresh?scope=sheet` cho sheet đang chọn; chưa chọn sheet thì bỏ qua mốc đó. Mốc đã xử lý lưu trong sessionStorage để F5 không làm gọi lặp. Đăng xuất/hết phiên thì dừng.
- Timer không chủ động dừng khi tab trình duyệt bị ẩn; nếu trình duyệt/thiết bị ngủ hoặc hạn chế timer, khi hoạt động trở lại sẽ tải một lần bù, không chạy dồn các lần đã lỡ. Đóng ứng dụng/trình duyệt thì không tiếp tục chạy: đây không phải lịch chạy phía server.
- Khi tự cập nhật thành công, màn hình tra cứu đồng bộ lại lô/kiện từ cache; preview lấy snapshot mới và dựng lại phiếu. Khóa in trong lúc cập nhật hoặc lỗi. Không tải lại các sheet khác.
- Cập nhật định kỳ thành công thay snapshot của sheet; snapshot cũ của sheet đó hết hiệu lực (preview cũ cần mở lại). Lỗi cập nhật không ghi đè cache cũ, hiển thị lỗi ở màn hình tra cứu và khóa mở phiếu mới cho tới khi tải thành công hoặc chọn lại dữ liệu. Đây là timer trên trang, không phải tác vụ server chạy khi không có người dùng.
- Trong lúc cập nhật vẫn hiển thị dữ liệu cũ và khóa xem trước. Nếu tải lỗi, báo lỗi và không mở phiếu từ snapshot cũ. Snapshot URL cũ hết hiệu lực khi thế hệ cache được thay thế; mở lại preview từ tra cứu.
- Tab sai định dạng được cache kèm lỗi, không ảnh hưởng tab khác. Lỗi mạng ở bước tải tab/dữ liệu có thể thử lại; dữ liệu lỗi không được ghi vào cache.
- Quyền Google/folder kiểm tra khi tải nguồn lần đầu, không kiểm tra lại khi đọc cache. Thu hồi quyền/chỉnh sửa Google có hiệu lực sau Làm mới hoặc restart. Mỗi API vẫn kiểm tra session ứng dụng.
- Cache dùng chung trong một process RAM; không lưu dữ liệu phân đơn vào localStorage/CDN. Restart/redeploy xóa cache. RAM tăng theo các sheet thực sự đã được chọn. Không chạy nhiều replica với kiến trúc này.
