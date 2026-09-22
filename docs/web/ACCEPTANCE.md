# Biên bản nghiệm thu Web Phân Đơn

Ngày kiểm tra phần mềm: **2026-09-21**  
Môi trường: Windows, Node.js theo `package.json`, Next.js 16.3.5, Chromium Playwright.  
Phạm vi: mã nguồn local và Google live read-only đã cấu hình; chưa có host/domain HTTPS production hay máy in/driver thật.

## Kết quả lệnh

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | Đạt |
| `npm run lint` | Đạt |
| `npm test` | Đạt, 30 test |
| `npm run test:e2e` | Đạt, 9 test khi có Google credential live |
| `npm run check:production-env` | Đạt với cấu hình production giả lập, không in secret |
| `npm run build` | Đạt |

Không ghi secret, đường dẫn key, fileId, sheetId hoặc tên nguồn live trong biên bản.

## Ma trận nghiệm thu

| Nhóm | Kết quả | Bằng chứng / tồn đọng |
|---|---|---|
| Auth | Đạt phần mềm | Đúng/sai credential, logout thu hồi, API 401, Origin/CSRF, rate limit và Retry-After có unit/E2E. Đổi password yêu cầu restart; checklist production còn chờ host. |
| Google | Đạt mock + live read-only | Pagination, folder scope, sheetId ownership, tên tab có nháy đơn, retry và ánh xạ lỗi có test. Live files → sheets → lots → package → preview đạt. Không có endpoint ghi. |
| Parser | Đạt | BOM/dấu Việt, tiêu đề 10 dòng, cột KIỆN đầu, hàng cắt đuôi, Lô rỗng, `00123`, `106 THC`, số không và ghi chú có unit test. |
| Fixture Android | Đạt | 1.422 dòng, 200 dòng lô `106 THC`, 25 đơn vị; không hardcode vào nguồn live. |
| Phiếu | Đạt phần mềm | Nhiều SKU/khách, số lượng `0`, status tự do, Tổng SKU distinct và Tồn không đếm lặp; preview dùng DTO server. |
| UI | Đạt tự động | Reset phụ thuộc, AbortController/request key, lựa chọn lưu/khôi phục có xác thực, viewport 320px, refresh URL preview và query giả. Thiết bị iOS/Android thật còn mở. |
| In | Đạt PDF; chưa đạt giấy | PDF A7 74 × 105 mm và A4 210 × 297 mm, tiếng Việt, ghi chú dài, toolbar ẩn, kiểm tra tràn. Ctrl+P/hủy/in lại, driver và giấy thật chưa nghiệm thu. |
| Bảo mật | Đạt kiểm tra mã/tự động | HttpOnly/SameSite/Secure production, no-store API, Zod validation, React escape nội dung Sheet, security headers, env/key bị ignore, health không lộ secret. Cần kiểm tra bundle/log/artifact trên host thật. |
| Production | Chưa thực hiện | Chưa được cung cấp host/domain/HTTPS/quyền triển khai. Chưa xác minh reverse proxy, quyền file env/key và cookie Secure trên domain thật. |
| Android | Không thay đổi mã | Công việc chỉ trong thư mục web; fixture/source Android chỉ được đọc đối chiếu. Cần regression Android riêng nếu quy trình phát hành yêu cầu. |

## Cổng phát hành còn mở

1. Cung cấp host/domain HTTPS và quyền triển khai.
2. Xác nhận chỉ chạy một Node process; nếu cần scale ngang phải thiết kế session/rate-limit/cache dùng chung trước.
3. Kiểm tra quyền OS của env và Google key.
4. Chạy smoke test production trên domain thật, gồm Secure cookie, APP_ORIGIN, reverse proxy và `/api/health`.
5. Nghiệm thu Chrome/Edge print dialog, thao tác hủy/in lại, driver và giấy A7 thật; đo tỷ lệ 100%.
6. Nghiệm thu Android Chrome/iOS Safari thật nếu mobile là kênh vận hành bắt buộc.

## Quyết định phát hành

**Chưa đủ điều kiện tuyên bố production đã phát hành.** Mã nguồn và artifact build đạt kiểm thử tự động; các cổng hạ tầng HTTPS và máy in thật ở trên phải được người có thẩm quyền xác nhận. Ngoại lệ chỉ được chấp nhận bằng văn bản, không được bỏ qua lỗi lộ bí mật hoặc mất/sai dữ liệu.
