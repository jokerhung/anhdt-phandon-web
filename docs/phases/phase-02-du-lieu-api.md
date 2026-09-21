# Phase 02 — Google Sheets, nghiệp vụ và API tra cứu

Trạng thái: **Hoàn thành triển khai và kiểm thử; Google live read-only đã smoke test**.

## Đầu vào và phạm vi

- Phụ thuộc: Phase 01 hoàn thành nền tảng/auth. Phần fixture/parser không cần Google live; smoke test live cần khóa và quyền đọc được cấu hình an toàn.
- Đặc tả chi tiết: [PLAN.md](../PLAN.md), §2 và §5.
- Đường dẫn triển khai tính từ gốc repository; chỉ thực hiện trong phạm vi phase được yêu cầu.

## 2.1. Kết nối Google, chọn file và sheet

### Công việc

- [x] Cấu hình googleapis server-only, service account từ đường dẫn ngoài repo và scopes chỉ đọc.
- [x] Implement danh sách file: đúng MIME, chưa xóa, phân trang đầy đủ, folder filter nếu cấu hình.
- [x] Kiểm tra file thuộc phạm vi cho phép ở server trên mọi đường truy cập, không chỉ lọc dropdown.
- [x] Implement GET /api/files và GET /api/sheets; dùng sheetId ổn định và title để hiển thị.
- [x] Tạo hàm đọc values.get với FORMATTED_VALUE/ROWS; quote và escape A1 cho tên tab có dấu nháy đơn.
- [x] Validate input, DTO tối thiểu, auth guard, private/no-store; không nhận URL tùy ý hay trả Google token.
- [x] Timeout và retry có giới hạn cho lỗi tạm thời; phân biệt thiếu quyền, nguồn bị xóa và quota.
- [x] Test adapter bằng mock và smoke test live read-only trên nguồn service account được cấu hình; không ghi ID/tên nguồn vào biên bản.

### Đầu ra

Drive/Sheets adapters, API files/sheets và service đọc values để các phần parser/snapshot tiếp theo trong phase này sử dụng.

### Tiêu chí hoàn thành

- [x] Liệt kê không mất file do phân trang; title có dấu/ký tự đặc biệt đọc đúng.
- [x] Giả fileId ngoài folder hoặc sheetId không thuộc file bị từ chối; không có endpoint ghi Google.
- [x] 401/403/404/429/lỗi mạng có ánh xạ an toàn; smoke test live files → sheets → lots trả 200 và snapshot hợp lệ.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## 2.2. Parser, index Lô/Kiện và tạo phiếu

### Công việc

- [x] Định nghĩa SheetRow, Allocation, SlipLine, Slip và ParseResult; giữ định danh/số lượng hiển thị dạng chuỗi.
- [x] Port normalizeHeader, natural sort có tie-break, dò tiêu đề 10 hàng đầu và cột KIỆN đầu tiên.
- [x] Port quy tắc cặp cột khách/trạng thái và hai cột rỗng kết thúc; không nhận Tồn/KIỆN/VÀO VL thành khách.
- [x] Xử lý hàng cắt đuôi, dòng hoàn toàn rỗng, thiếu Lô/cột bắt buộc và lỗi kèm số hàng.
- [x] Tạo index theo cặp chính xác Lô/Kiện, danh sách lô/kiện natural sort.
- [x] Port SlipBuilder: nhiều SKU/khách, 0 khác rỗng, cột T từ SL nguồn, bỏ đúng OK, tổng SKU distinct và tồn không đếm lặp.
- [x] Tách ngày/múi giờ thành đầu vào xác định để preview và test tái lập được.
- [x] Đối chiếu fixture/test Kotlin; dữ liệu thật chỉ trong test server, không đưa vào public hoặc báo cáo công khai.

### Đầu ra

Module domain thuần TypeScript và unit tests đối chiếu Android.

### Tiêu chí hoàn thành

- [x] Fixture hiện có đạt 1.422 dòng, 200 dòng lô 106 THC, 25 đơn vị; không hardcode các số này cho nguồn live.
- [x] 00123, cột trùng, ghi chú tự do, nhiều SKU/khách và 0/trống đều đúng.
- [x] Cặp chưa phân bổ không tạo phiếu; thứ tự dòng, tổng SKU và tồn khớp Kotlin.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## 2.3. Snapshot, cache và API tra cứu

### Công việc

- [x] Tạo cache theo fileId/sheetId, TTL cấu hình, giới hạn dung lượng và gộp request tải trùng.
- [x] Tạo snapshotId/fetchedAt; chỉ publish sau khi tải và parse thành công, giữ snapshot cũ trong thời hạn ngắn có giới hạn.
- [x] Implement GET /api/lots, /api/packages, /api/slip và POST /api/refresh theo hợp đồng PLAN.md.
- [x] Validate file/sheet/snapshot/lô/kiện ở server; tất cả request phụ thuộc phải dùng đúng snapshot.
- [x] Snapshot không còn hợp lệ trả 409 SNAPSHOT_EXPIRED; không tự đổi sang dữ liệu mới dưới lựa chọn cũ.
- [x] Refresh thất bại không thay snapshot tốt bằng dữ liệu lỗi và không cho flow refresh thất bại tạo phiếu mới từ lựa chọn cũ chưa xác nhận.
- [x] Áp dụng auth, Origin/CSRF cho refresh, private/no-store và DTO tối thiểu; không trả raw sheet.
- [x] Integration tests cho TTL, eviction, refresh, request đồng thời và lỗi nguồn; dùng clock kiểm soát thay vì sleep dài.

### Đầu ra

Bộ API tra cứu hoàn chỉnh, cache/snapshot service và integration tests.

### Tiêu chí hoàn thành

- [x] Cả chuỗi lots/packages/slip dùng cùng snapshot; refresh không trộn hai nguồn hoặc phiên bản.
- [x] Snapshot hết hạn/evict và lô/kiện giả có lỗi xác định, không in nhầm phiếu.
- [x] Không gọi Google mỗi lần gõ kiện; cache/request gộp đúng và không bỏ qua auth.

Chỉ đánh dấu hoàn thành khi có bằng chứng kiểm tra; ghi rõ phần chưa thực hiện hoặc bị chặn.

## Bàn giao phase

Phase 03 dùng bộ API và snapshot đã xác minh.

- Bằng chứng: `npm run typecheck`, `npm run lint`, `npm test` (26 test), `npm run test:e2e` (3 test) và `npm run build` đều đạt. Fixture Android đạt 1.422/200/25, 79 kiện chưa phân bổ và có phiếu 4 SKU.
- Smoke test live read-only: files → sheets → lots đều HTTP 200; nguồn có 1 file, 1 tab, 3 lô và snapshot hợp lệ. Không ghi tên/ID nguồn hoặc secret.
- Chỉ đánh dấu hoàn thành khi các phần bắt buộc có bằng chứng; không xem mock/PDF là bằng chứng Google live/in giấy.
- Không ghi secret hoặc dữ liệu nhạy cảm vào biên bản. Việc chia tài liệu không đồng nghĩa đã triển khai.

