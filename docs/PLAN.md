# Kế hoạch bản web Phân đơn — Next.js / TypeScript

Ngày lập: 21/09/2026. Trạng thái: **kế hoạch, chưa triển khai**.

Kế hoạch đã được chia thành 5 phase riêng tại [phases/README.md](phases/README.md). Dùng tài liệu này làm đặc tả tổng thể và checklist trong từng phase để triển khai, ghi bằng chứng, cập nhật tiến độ.

## 1. Mục tiêu và phạm vi

Xây dựng thêm bản web chạy độc lập với Android, dùng cùng nguồn Google Sheets và cùng quy tắc phân đơn:

**Đăng nhập → chọn file Google Sheets → chọn sheet/tab → chọn lô → chọn kiện → xem trước → Ctrl+P để in.**

- Một tài khoản admin; tên đăng nhập và mật khẩu cấu hình trong `.env` phía server.
- Danh sách file là các bảng tính Google được chia sẻ cho service account, không phải upload Excel từ máy tính.
- Có đăng xuất, tải lại dữ liệu, trạng thái đồng bộ, thông báo lỗi và kết quả rỗng.
- In bằng chức năng sẵn có của trình duyệt; thêm nút “In / Ctrl+P” gọi `window.print()` cho thuận tiện.
- Giao diện tiếng Việt, dùng được trên desktop và màn hình hẹp; ưu tiên nghiệm thu in trên Chrome/Edge desktop.
- Không thay đổi mã hoặc quy trình build Android.

Ngoài phạm vi bản đầu: OCR, Bluetooth/TSPL trực tiếp, sửa Google Sheets, đăng ký/quên mật khẩu, phân quyền nhiều người, in hàng loạt, chế độ offline, lưu lịch sử in vào cơ sở dữ liệu.

## 2. Căn cứ từ dự án hiện tại

Ưu tiên hành vi của mã đang chạy khi tài liệu Android cũ khác với mã nguồn. Chuyển quy tắc sang TypeScript, không import mã Kotlin hoặc SDK máy in vào web.

| Thành phần hiện tại | Nội dung cần kế thừa |
|---|---|
| `app/src/main/java/com/anhdt/phandon/data/remote/DriveApi.kt` | Liệt kê file, phân trang, lọc bảng tính chưa bị xóa, tùy chọn thư mục Drive |
| `app/src/main/java/com/anhdt/phandon/data/remote/SheetsApi.kt` | Danh sách tab; đọc `values.get`, `FORMATTED_VALUE`, `ROWS`; escape tên tab trong A1 |
| `app/src/main/java/com/anhdt/phandon/data/SheetParser.kt` | Nhận diện tiêu đề, khối đơn vị, ô rỗng và dữ liệu lỗi |
| `app/src/main/java/com/anhdt/phandon/data/LabelRepository.kt` | Index theo cặp chính xác `(Lô, Kiện)`; một kiện có thể nhiều SKU |
| `app/src/main/java/com/anhdt/phandon/core/TextNormalize.kt` | Chuẩn hóa tiêu đề và natural sort |
| `app/src/main/java/com/anhdt/phandon/slip/SlipBuilder.kt` | Tạo dòng phân bổ, ghi chú, tổng SKU và tồn |
| `app/src/main/java/com/anhdt/phandon/slip/SlipLayout.kt` | Mốc kích thước phiếu A7, tỷ lệ cột để đối chiếu |
| `app/src/test/resources/` và các test Kotlin tương ứng | Fixture và kỳ vọng hồi quy để đối chiếu bản web |

Các đường dẫn trên tính từ gốc repository. Không đưa fixture dữ liệu thật vào `public/`, bundle trình duyệt hoặc báo cáo CI công khai.

## 3. Kiến trúc dự kiến

- Tạo ứng dụng trong `web/` ở gốc repository; `docs/web/` chỉ chứa tài liệu.
- Next.js App Router + TypeScript strict, Node.js runtime. Chọn bản stable được hỗ trợ và khóa phiên bản bằng lockfile khi bắt đầu; không dùng canary.
- Server Components cho khung trang và kiểm tra phiên; Client Components cho các ô chọn và nút in.
- Route Handlers cho đăng nhập, đăng xuất và truy vấn dữ liệu. Một lớp `requireAdmin()` dùng chung cho mọi điểm đọc dữ liệu được bảo vệ.
- Google client chính thức cho Node.js (`googleapis`), module server-only; dùng service account với quyền chỉ đọc.
- Kiểm tra cấu hình và đầu vào bằng schema, ví dụ Zod. CSS Modules/global print CSS; chưa cần thư viện quản lý state lớn.
- Vitest cho hàm thuần và API/service tests; Playwright cho web E2E sau khi đã khám phá giao diện chạy thật.
- Triển khai ban đầu: một Node process trên máy chủ/VPS, reverse proxy HTTPS. Không static export vì cần giữ bí mật và xác thực phía server.

Luồng dữ liệu: trình duyệt đã đăng nhập → Next.js API → Google Drive/Sheets → parser/index → DTO cần thiết → giao diện/phiếu.

### Cấu trúc dự kiến

```text
web/
  src/app/
    login/page.tsx
    (protected)/layout.tsx
    (protected)/page.tsx
    (protected)/preview/page.tsx
    api/auth/{login,logout}/route.ts
    api/files/route.ts
    api/sheets/route.ts
    api/lots/route.ts
    api/packages/route.ts
    api/slip/route.ts
    api/refresh/route.ts
    globals.css
    print.css
  src/components/       # LookupForm, SearchableSelect, SlipPreview, PrintButton
  src/lib/auth/         # kiểm tra mật khẩu, session, rate limit, requireAdmin
  src/lib/google/       # Drive, Sheets; chỉ chạy server
  src/lib/domain/       # types, parser, natural-sort, index, slip-builder
  src/lib/server/       # env, snapshot-cache, DTO validation
  tests/{unit,integration,e2e}/
  .env.example          # placeholder, tuyệt đối không có bí mật thật
  package.json
  package-lock.json
docs/web/
  PLAN.md
  README.md
  phases/
    README.md
    phase-01-nen-tang-dang-nhap.md
    ...
    phase-05-nghiem-thu-trien-khai.md
```

Đây là sơ đồ, tên `{login,logout}` và các thư mục trong ngoặc nhọn không phải tên thư mục thật. Tài liệu vận hành và biên bản nghiệm thu được bổ sung khi triển khai.

## 4. Đăng nhập admin và `.env`

### Cấu hình dự kiến

Tệp thực tế: `web/.env`; chỉ commit `web/.env.example`. Ví dụ dưới đây là placeholder, không phải thông tin đăng nhập dùng được:

```dotenv
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt:v1:REPLACE_WITH_SALT:REPLACE_WITH_HASH
SESSION_TTL_SECONDS=28800
APP_ORIGIN=http://localhost:3000
GOOGLE_APPLICATION_CREDENTIALS=/absolute/private/path/service-account.json
GOOGLE_DRIVE_FOLDER_ID=
SHEETS_CACHE_TTL_SECONDS=60
APP_TIME_ZONE=Asia/Ho_Chi_Minh
```

- `ADMIN_USERNAME` và `ADMIN_PASSWORD_HASH` bắt buộc, không có mật khẩu mặc định. Hash được tạo bằng `npm run hash-password` từ mật khẩu tối thiểu 16 ký tự; startup từ chối plaintext, placeholder hoặc hash sai định dạng.
- `.env` nằm ở root của ứng dụng `web/`, không nằm trong `src/`. Không dùng tiền tố `NEXT_PUBLIC_` cho bí mật; không truyền hash hoặc bí mật vào props, JSON hay cấu hình client. Tham chiếu: [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables).
- `.env` chỉ giữ scrypt hash có salt, không giữ password rõ. Hash vẫn phải được coi là dữ liệu nhạy cảm: giới hạn quyền đọc, không gửi qua chat, không log, không đưa vào image công khai.
- Khi triển khai thêm quy tắc ignore cho `web/.env*` trừ `.env.example`, `.next/`, `node_modules/` và các artifact kiểm thử. Khóa Google đặt ngoài repository, không tái đóng gói asset bí mật Android sang web.
- Next.js có thứ tự ưu tiên nhiều nguồn env; tài liệu vận hành cần chỉ rõ không để `.env.local` hoặc env của process vô tình ghi đè cấu hình. Đổi tài khoản/mật khẩu phải restart service và vô hiệu hóa mọi phiên cũ.

### Luồng xác thực

1. `GET /login`: form tên đăng nhập/mật khẩu, hỗ trợ trình quản lý mật khẩu; không lưu password vào localStorage.
2. `POST /api/auth/login`: giới hạn kích thước đầu vào, kiểm tra Origin/CSRF, rate limit rồi xác thực ở server. Sai tên hay password cùng thông báo “Thông tin đăng nhập không đúng”.
3. Dùng `crypto.scrypt` với salt ngẫu nhiên để tạo `ADMIN_PASSWORD_HASH` trước khi startup; khi đăng nhập derive candidate và so sánh buffer cùng độ dài bằng `timingSafeEqual`. Giới hạn số phép kiểm tra đồng thời, không tự viết thuật toán mật mã.
4. Phiên opaque: token ngẫu nhiên tối thiểu 256 bit bằng Node crypto; cookie chỉ chứa token, phía server giữ hash token và hạn dùng. Cookie `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` trên HTTPS production; TTL mặc định 8 giờ tuyệt đối, không tự gia hạn vô hạn.
5. MVP giữ session trong RAM có dọn hết hạn và giới hạn dung lượng: restart làm tất cả phiên hết hiệu lực. Chỉ dùng một process; trước khi scale nhiều process/serverless phải chuyển session và rate limit sang kho dùng chung, ví dụ Redis.
6. `POST /api/auth/logout`: kiểm tra CSRF/Origin, thu hồi session server và xóa cookie. Token cũ không dùng lại được.
7. Rate limit dự kiến: 5 lần sai/15 phút/IP và giới hạn toàn cục bổ sung; trả `429` với `Retry-After`, tránh khóa vĩnh viễn tài khoản admin. Chỉ tin forwarded IP từ reverse proxy đã cấu hình.
8. Trang chưa đăng nhập chuyển về `/login`; API trả `401`. Kiểm tra phiên tại mọi Route Handler và lớp truy cập dữ liệu, không chỉ ẩn nút hoặc kiểm tra layout. Tham chiếu: [Next.js authentication](https://nextjs.org/docs/app/guides/authentication).

Không dùng HTTP qua mạng LAN cho production; ngoại lệ cookie không Secure chỉ dành cho localhost development. Chỉ cho redirect sau đăng nhập tới đường dẫn nội bộ hợp lệ.

## 5. Google Sheets và tính nhất quán dữ liệu

### Kết nối và API nội bộ

- Bật Drive API và Sheets API; chia sẻ file hoặc thư mục cho email service account với quyền Viewer.
- Scope chỉ đọc: `drive.readonly` và `spreadsheets.readonly`; không có endpoint ghi Sheets.
- Theo hết `nextPageToken` khi lấy file. Nếu cấu hình folder thì chỉ cho phép file thuộc phạm vi đó, không chỉ lọc danh sách trên UI.
- Google token/key chỉ tồn tại server. Server xác thực file và sheet hợp lệ trước khi đọc, kể cả khi người dùng sửa URL trực tiếp.
- `values.get` dùng `FORMATTED_VALUE` và `majorDimension=ROWS`, không dùng gviz; giữ ID lô/kiện/SKU dạng chuỗi. Tham chiếu: [Google Sheets values.get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get).

| Endpoint dự kiến | Đầu vào và đầu ra |
|---|---|
| `GET /api/files` | Danh sách `{id, name, modifiedTime}` trong phạm vi được phép |
| `GET /api/sheets?fileId=...` | Danh sách `{sheetId, title}`; không chọn tab bằng vị trí mảng |
| `GET /api/lots?fileId=...&sheetId=...` | Danh sách lô, `snapshotId`, `fetchedAt` |
| `GET /api/packages?fileId=...&sheetId=...&snapshotId=...&lot=...` | Kiện thuộc đúng lô trong snapshot |
| `GET /api/slip?fileId=...&sheetId=...&snapshotId=...&lot=...&package=...` | Phiếu có phân bổ hoặc kết quả không thể in, không trả raw sheet |
| `POST /api/refresh` | Body file/sheet; đọc lại Google, thay snapshot sau khi parse thành công |

Mọi endpoint bảng này yêu cầu phiên admin. POST có kiểm tra CSRF/Origin. Validate độ dài, kiểu ID và chuỗi; không nhận URL Google tùy ý. Response dữ liệu riêng dùng `Cache-Control: private, no-store`; không cache công khai qua CDN.

### Snapshot và xử lý bất đồng bộ

- Cache server theo `(fileId, sheetId)`, TTL mặc định 60 giây; giới hạn dung lượng và số snapshot, gộp request tải trùng. Không gọi Google mỗi lần gõ tìm kiện.
- Sau khi tải/parse xong mới thay snapshot. `snapshotId` xác định phiên bản dữ liệu của toàn bộ chuỗi lô → kiện → phiếu; trả kèm thời điểm tải và giữ snapshot đã dùng trong thời hạn ngắn có giới hạn.
- Snapshot bị loại hoặc không còn hợp lệ: trả `409 SNAPSHOT_EXPIRED`, yêu cầu tải lại danh sách; không âm thầm dựng phiếu từ bản mới cho lựa chọn cũ.
- Khi refresh hoặc đổi nguồn, hủy preview cũ và xác thực lại lô/kiện. Trong MVP, nếu tải lại thất bại thì giữ thông tin lỗi và không cho tạo phiếu mới từ cache cũ chưa được xác nhận.
- Dùng AbortController và request key để bỏ response đến muộn khi người dùng đổi file/tab/lô nhanh.
- Không ghi dữ liệu nguồn hoặc snapshot vào localStorage. Có thể lưu `fileId` và `sheetId` đã chọn (ID không nhạy cảm), nhưng luôn kiểm tra lại với server sau đăng nhập/reload; xóa trạng thái khi logout/401.
- Timeout, retry có giới hạn cho lỗi Google tạm thời/429/5xx với backoff; không retry vô hạn hoặc retry lỗi quyền truy cập.

### Quy tắc nghiệp vụ cần chuyển nguyên vẹn

- Dò hàng tiêu đề trong 10 hàng đầu; normalize dấu tiếng Việt, `đ`, BOM và khoảng trắng theo mã Kotlin.
- Lấy cột `KIỆN` đầu tiên nếu có tên trùng; yêu cầu các cột Lô/Kiện/SKU/SL.
- Khối đơn vị bắt đầu sau SL, xen kẽ số lượng/trạng thái; kết thúc tại cặp hai cột rỗng đúng vị trí. Không nhận `Tồn`, `KIỆN`, `VÀO VL` thành khách.
- Hàng bị cắt đuôi: ô thiếu là chuỗi rỗng; bỏ hàng hoàn toàn rỗng. Hàng có dữ liệu nhưng thiếu Lô phải báo lỗi kèm số hàng.
- Giữ `00123`, `106 THC` và mọi định danh như chuỗi; natural sort có tie-break giữ khác biệt số 0 đầu. Không normalize định danh để gộp hai kiện khác nhau.
- Tra cứu khớp chính xác cả lô và kiện. Một kiện có nhiều dòng SKU/khách.
- Chỉ bỏ phân bổ có số lượng trống; giá trị `"0"` vẫn là một dòng theo Android. Cột T là SL của dòng nguồn, không phải tổng phân bổ của khách.
- Ghi chú bỏ đúng trạng thái `OK`; giữ nguyên trạng thái khác. Tổng SKU đếm SKU khác nhau trên phiếu; tồn cộng một lần cho mỗi dòng nguồn khớp, không nhân theo số khách.
- Không có dòng phân bổ: hiện “Chưa phân bổ”, không tạo phiếu có thể in. Ngày phiếu là ngày tạo preview theo múi giờ cấu hình, không suy từ tên sheet; ngày giữ cố định trong lần xem trước/in đó.

## 6. Giao diện và chuyển trạng thái

### Trang đăng nhập

Form gọn, nhãn rõ, lỗi tiếng Việt; nút đăng nhập có loading và chống gửi lặp. Không điền sẵn mật khẩu.

### Quy chuẩn responsive PC và mobile web

- Thiết kế mobile-first từ 320 CSS px; không cuộn ngang toàn trang. PC dùng container giới hạn chiều rộng, không kéo form đăng nhập ra toàn màn hình.
- Mobile: trường chọn xếp một cột, nút thao tác chính rộng toàn hàng; từ 768px có thể dùng hai cột nếu nhãn và nội dung đủ chỗ. Header/toolbar tự xuống dòng, không che nội dung.
- Nút và ô nhập cao tối thiểu 44px; ô nhập trên mobile dùng chữ tối thiểu 16px. Giữ focus bàn phím rõ, hỗ trợ cảm ứng và không khóa phóng to trình duyệt.
- Không tự focus ô đăng nhập khi mở trang để tránh bật bàn phím ảo ngoài ý muốn. Khi màn hình thấp hoặc xoay ngang, form phải cuộn dọc tới được nút gửi và thông báo lỗi.
- Tên file/tab/lô/kiện dài không làm tràn trang; danh sách tìm kiếm nằm trong viewport, hỗ trợ cuộn và bàn phím. Reset/loading/lỗi phải giống nhau trên PC và mobile.
- Phiếu vẫn giữ kích thước thật 74 × 105 mm; nếu thiếu chiều rộng thì cuộn ngang riêng vùng phiếu, không co chữ hoặc thay đổi kích thước bản in. Print CSS bỏ vùng cuộn và toolbar.
- Mobile hiển thị nút “In phiếu”, PC hiển thị “In / Ctrl+P”. Khả năng in mobile phụ thuộc trình duyệt/dịch vụ in; nghiệm thu máy in và driver vẫn ưu tiên Chrome/Edge PC.
- Ma trận kiểm tra: 320, 375, 390, 768 và 1440px; thêm màn hình ngang thấp, bàn phím, phóng to và thiết bị thật. Giả lập viewport không thay thế nghiệm thu Android Chrome/iOS Safari.

Kết quả cập nhật các màn hình hiện có được ghi tại [RESPONSIVE.md](RESPONSIVE.md); chưa đồng nghĩa hoàn thành luồng Google Sheets của Phase 02–04.

### Trang tra cứu

- Header: “Tra cứu kiện”, thời điểm đồng bộ, “Làm mới”, “Đăng xuất”.
- Bốn trường theo thứ tự: File Google Sheets → Sheet/Tab → Lô → Kiện.
- Các ô chọn nền trắng, chữ đen, viền và mũi tên thống nhất. Kiện có tìm kiếm để xử lý danh sách dài; vẫn phải chọn một giá trị hợp lệ.
- Hỗ trợ bàn phím, nhãn liên kết đúng input, trạng thái disabled/loading và focus rõ ràng.
- File thay đổi: reset sheet/lô/kiện/preview; sheet thay đổi: reset lô/kiện/preview; lô thay đổi: reset kiện/preview; kiện thay đổi: xóa preview cũ.
- Chưa có nguồn hợp lệ thì khóa trường phụ thuộc. Nút “Xem trước” chỉ bật khi đã có đủ lựa chọn và không đang tải.
- Loading, danh sách rỗng, lỗi quyền Google, sai định dạng sheet, mất mạng và hết phiên có thông báo riêng, không dùng màn hình trắng.
- Không tự mở preview hay in khi vừa chọn kiện; phải bấm “Xem trước”.

### Trang xem trước

- Route `/preview` chứa ID nguồn, snapshot và lô/kiện trong query được encode; server kiểm tra lại toàn bộ trước khi dựng phiếu. Refresh URL vẫn hoạt động khi snapshot còn hiệu lực.
- Hiện nguồn dữ liệu/thời điểm lấy ở phần màn hình, ngoài vùng in; có “Quay lại” và “In / Ctrl+P”.
- Dùng một component `SlipPreview` cho xem trên màn hình và in, không dựng hai phiên bản nghiệp vụ riêng.
- Phiếu gồm LÔ, KIỆN; bảng SKU / T / KHÁCH / SL / GHI CHÚ; ngày, Tổng SKU, Tồn chưa phân bổ nếu > 0.
- Nếu hết phiên: xóa preview phía client khi nhận 401, chuyển login. Không tuyên bố có thể thu hồi giấy/PDF hay dữ liệu đã được trình duyệt tải trước đó.

## 7. In bằng trình duyệt

### Thiết kế

- Mặc định **A7 dọc, 74 × 105 mm**, kế thừa quy cách Android. Đây là mặc định lập kế hoạch, cần nghiệm thu với giấy/driver thực tế trước phát hành.
- Dùng HTML/CSS với đơn vị mm/pt, font hỗ trợ tiếng Việt; không dùng SDK Android, TSPL hoặc Web Bluetooth.
- `@media print` ẩn header, form, toolbar và hướng dẫn; chỉ hiển thị phiếu hợp lệ. `@page` khai báo kích thước và margin phù hợp. Tham chiếu: [MDN — Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing).
- Ctrl+P dùng hành vi native, không cần bắt phím. Nút in chỉ gọi `window.print()` sau khi component và font sẵn sàng; dữ liệu phải tải xong trước đó, không tải bất đồng bộ trong `beforeprint`.
- Trang không có phiếu hợp lệ: print CSS không in dữ liệu cũ, chỉ thông báo chưa có phiếu. Không thể ngăn tuyệt đối người dùng mở hộp thoại in bằng Ctrl+P.
- Không tự động xác nhận “In thành công”: browser không báo chắc chắn giấy đã ra; `afterprint` cũng có thể xảy ra sau khi hủy hộp thoại.

### Phiếu dài và khổ giấy

- Không giả định số dòng tối đa của Android áp dụng y nguyên cho HTML; đo với font và kích thước web thực tế.
- MVP ưu tiên một kiện/một trang A7. Nếu nội dung vượt vùng in, hiện lỗi trước khi cho in; print CSS cũng ẩn phiếu quá khổ, không cắt mất dòng hoặc ghi chú bằng `overflow: hidden`/ellipsis.
- Ghi chú dài được xuống dòng; kiểm tra chiều cao thực tế sau khi font tải xong. Nếu thử nghiệm cho thấy dữ liệu thường vượt A7, bổ sung phân trang có lặp tiêu đề như một quyết định phạm vi trước phát hành.
- Cung cấp profile A4 tùy chọn: một phiếu kích thước thật 74 × 105 mm trên trang A4; không tự kéo giãn toàn trang. Profile được áp dụng cả preview lẫn print stylesheet.

### Hướng dẫn người dùng và giới hạn

1. Cài driver máy in trong Windows/hệ điều hành; web chỉ thấy máy in mà trình duyệt/hệ điều hành cung cấp.
2. Mở xem trước, bấm Ctrl+P hoặc “In / Ctrl+P”.
3. Chọn đúng máy in và khổ giấy tương ứng, scale 100%, tắt header/footer trình duyệt; chỉnh margin theo driver đã nghiệm thu.
4. Có thể chọn Save as PDF trong hộp thoại, không cần endpoint xuất PDF riêng.

CSS không thể ép mọi driver tuân thủ khổ A7 hay tự chọn máy in. Phải kiểm chứng bằng bản PDF và bản in giấy; nếu driver không hỗ trợ A7, dùng profile A4 hoặc cấu hình custom paper trong driver.

## 8. Các giai đoạn thực hiện

Triển khai theo **5 phase** dưới đây. Checklist chi tiết và tiến độ được quản lý trong [danh mục phase](phases/README.md) và từng file phase; hiện tất cả đều chưa bắt đầu.

### Phase 01 — Nền tảng, đăng nhập admin và thử in

Xem [checklist Phase 01](phases/phase-01-nen-tang-dang-nhap.md).

- Phụ thuộc: Không có. Đọc PLAN.md trước khi thực hiện.
- Phạm vi: khởi tạo dự án, cấu hình env, thử in sớm và hoàn thiện đăng nhập/bảo mật.

### Phase 02 — Google Sheets, nghiệp vụ và API tra cứu

Xem [checklist Phase 02](phases/phase-02-du-lieu-api.md).

- Phụ thuộc: Phase 01 hoàn thành nền tảng/auth. Phần fixture/parser không cần Google live; smoke test live cần khóa và quyền đọc được cấu hình an toàn.
- Phạm vi: đọc Google file/sheet, port nghiệp vụ Kotlin và hoàn thiện snapshot/cache/API.

### Phase 03 — Giao diện chọn File → Sheet → Lô → Kiện

Xem [checklist Phase 03](phases/phase-03-giao-dien-tra-cuu.md).

- Phụ thuộc: Phase 02.
- Phạm vi: giao diện chọn file → sheet → lô → kiện, trạng thái tải/lỗi và chống response cũ.

### Phase 04 — Xem trước phiếu và in Ctrl+P

Xem [checklist Phase 04](phases/phase-04-xem-truoc-in.md).

- Phụ thuộc: Phase 03 và kết quả thử in của Phase 01. Cần máy in được người dùng xác nhận để nghiệm thu giấy.
- Phạm vi: phiếu xem trước dùng chung với bản in, A7/A4, Ctrl+P, kiểm tra tràn trang và in giấy.

### Phase 05 — Nghiệm thu, triển khai và bàn giao

Xem [checklist Phase 05](phases/phase-05-nghiem-thu-trien-khai.md).

- Phụ thuộc: Phase 01–04; host/domain/HTTPS và quyền triển khai được người dùng xác nhận.
- Phạm vi: kiểm thử toàn luồng, production HTTPS, hướng dẫn vận hành và bàn giao.

Chỉ đánh dấu phase hoàn thành khi có bằng chứng theo tiêu chí trong file tương ứng. Thiếu máy in hoặc Google live phải được ghi rõ; không xem kết quả mock/PDF là thay thế nghiệm thu thực tế.

## 9. Ma trận nghiệm thu

| Nhóm | Ca bắt buộc |
|---|---|
| Auth | Đúng/sai thông tin, cookie hết hạn, logout thu hồi, POST khác origin, rate limit, API trực tiếp không phiên, đổi password/restart |
| Google | Nhiều trang file, folder scope bị giả mạo qua URL, file không có quyền, tab bị xóa/đổi tên, tab có dấu nháy đơn, lỗi quota/mạng |
| Parser | BOM/dấu Việt, tiêu đề không ở dòng 1, cột KIỆN trùng, hàng bị cắt đuôi, khối đơn vị, Lô rỗng, `00123`, `106 THC` |
| Đối chiếu fixture | Fixture hiện có kỳ vọng 1.422 dòng, 200 dòng lô `106 THC`, 25 đơn vị; đây là kỳ vọng fixture, không hardcode cho dữ liệu live |
| Phiếu | Một/nhiều SKU, nhiều khách, số lượng `0` so với trống, ghi chú OK và chữ tự do, tổng SKU distinct, tồn không bị đếm lặp |
| UI | Chuỗi reset, lựa chọn không hợp lệ, response cũ đến muộn, refresh thất bại, snapshot hết hạn, truy cập lại URL preview |
| In | Ctrl+P và nút in, A7/A4, font tiếng Việt, ghi chú dài, phiếu quá khổ, hủy/in lại, tắt header/footer, đúng scale |
| Bảo mật | Không lộ env/key trong bundle/log/HTML, không raw HTML từ ô Sheet, response không cache công khai, query/API được validate |

Test web E2E phải dựa trên giao diện đã chạy và được khám phá thực tế, ưu tiên locator theo role/label/test-id, có chờ trạng thái dữ liệu rõ ràng thay vì sleep tùy ý. Playwright kiểm chứng DOM/print media/PDF không thay thế nghiệm thu hộp thoại Ctrl+P và máy in thật. Nếu bổ sung kiểm thử Android để đối chiếu, tuân thủ quy trình khám phá ARTEMIS trước khi viết test mobile theo AGENTS.md.

## 10. Giả định cần xác nhận khi bắt đầu triển khai

- Một admin, một Node process, HTTPS production; chưa cần tài khoản riêng cho từng nhân viên.
- Chọn file Google Sheets từ service account hiện có về mặt quyền truy cập; vẫn cần cấp khóa riêng trên server một cách an toàn, không đọc/chép bí mật trong bước lập kế hoạch này.
- A7 là mặc định theo bản Android, A4 là profile dự phòng. Driver/máy in thực tế và số lượng nội dung tối đa là cổng nghiệm thu, không mặc định đã hỗ trợ.
- Một kiện/một phiếu; phiếu tràn trang bị chặn có thông báo trong bản đầu, không mất dữ liệu âm thầm.
- Chỉ lập kế hoạch ở lượt này; chưa scaffold ứng dụng, tạo `.env` thật, cài dependency hoặc triển khai server.

