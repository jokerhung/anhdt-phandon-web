# Giao diện PC và mobile web

Cập nhật ngày 21/09/2026. Phạm vi: các màn hình đã có của Phase 01, không triển khai API Google Sheets hoặc đánh dấu Phase 03 hoàn thành.

## Thay đổi

- `/login`: khoảng cách thích ứng màn hình nhỏ, nền gradient đúng biến màu, bỏ autofocus, tắt tự viết hoa tên đăng nhập, gợi ý phím bàn phím ảo. Form có tên truy cập và trạng thái đang gửi.
- `/`: header xuống dòng khi thiếu chỗ; nút thử in không tràn; quy trình dạng danh sách một/hai/bốn cột theo chiều rộng.
- `/print-spike`: toolbar và profile cho phép xuống dòng, nút in thuận tiện trên mobile, giải thích giới hạn in điện thoại. Chỉ vùng phiếu cuộn ngang khi thiếu chỗ; kích thước giấy không đổi.
- Component dùng chung: nút/ô nhập tối thiểu 44px, chữ input mobile 16px; hỗ trợ giảm chuyển động. Không chặn zoom, không ẩn overflow toàn trang để che lỗi bố cục.

## Bằng chứng kiểm tra

- `npm run lint`: đạt.
- `npm run typecheck`: đạt.
- `npm run build`: đạt, tạo production build thành công.
- `npm test`: 11/11 test đạt.
- `npm run test:e2e`: 3/3 test hiện có đạt, gồm đăng nhập/đăng xuất, origin/rate limit, PDF A7/A4 một trang đúng kích thước và giữ phiếu A7 trên A4.
- Khám phá trực tiếp bằng trình duyệt với tài khoản thử nghiệm của cấu hình Playwright: đăng nhập → trang chính → thử in A7 → chuyển A4 → quay lại → đăng xuất.
- Đo DOM ở 320, 375, 390, 768 và 1440 CSS px cho login, trang chính, A7 và A4: `document.documentElement.scrollWidth <= window.innerWidth` ở tất cả các kích thước.
- Phiếu trên màn hình rộng khoảng 279,67px (74mm) ở mọi viewport; tại 320px, vùng xem cuộn ngang riêng, không làm trang tràn.
- Kiểm tra ảnh giao diện ở 320px và 1440px; login 667 × 375px vẫn hiển thị từ đầu trang và cho cuộn dọc. Input ở 320px đo được cao 44px, chữ 16px.

## Giới hạn và kiểm tra tiếp

- Đây là kiểm tra viewport trình duyệt, chưa nghiệm thu thiết bị Android/iOS thật, bàn phím ảo hay dịch vụ in mobile. Không thêm test mobile khi chưa khám phá thiết bị bằng ARTEMIS theo AGENTS.md.
- Chưa nghiệm thu máy in/driver giấy thật. Không coi PDF đạt là đã in giấy thành công.
- `/print-spike` chỉ có trong development; chưa phải trang `/preview` nghiệp vụ.
- API và luồng chọn File → Sheet → Lô → Kiện vẫn thuộc Phase 02–03. Quy chuẩn responsive và checklist đã bổ sung vào plan để áp dụng khi triển khai.
