# Các phase triển khai bản web

Trạng thái: **Mới chia kế hoạch, chưa triển khai**.

Đọc [kế hoạch tổng thể](../PLAN.md) trước. Checklist dưới đây gộp đầy đủ nội dung của 10 phase trước thành **5 phase**, không mở rộng phạm vi.

## Thứ tự thực hiện

| Phase | Phạm vi | Phụ thuộc | Trạng thái |
|---|---|---|---|
| 01 | [Nền tảng, đăng nhập admin và thử in](phase-01-nen-tang-dang-nhap.md) | Không có | Đã triển khai; chờ in giấy thật |
| 02 | [Google Sheets, nghiệp vụ và API tra cứu](phase-02-du-lieu-api.md) | 01 | Hoàn thành |
| 03 | [Giao diện chọn File → Sheet → Lô → Kiện](phase-03-giao-dien-tra-cuu.md) | 02 | Chưa bắt đầu |
| 04 | [Xem trước phiếu và in Ctrl+P](phase-04-xem-truoc-in.md) | 03 | Chưa bắt đầu |
| 05 | [Nghiệm thu, triển khai và bàn giao](phase-05-nghiem-thu-trien-khai.md) | 04 | Chưa bắt đầu |

Thực hiện 01 → 02 → 03 → 04 → 05. Nếu Phase 01 chưa có máy in, có thể tiếp tục backend/UI sau khi nền tảng/auth đạt, nhưng giữ nghiệm thu giấy chưa đạt đến Phase 04. Parser/fixture trong Phase 02 có thể làm khi chưa có Google key; không xem mock là bằng chứng Google live.

## Cách thực hiện một phase

1. Đọc đặc tả và phụ thuộc, thực hiện các mục nhỏ theo thứ tự trong file phase.
2. Chỉ làm phạm vi phase người dùng yêu cầu, không tự chuyển sang phase khác.
3. Kiểm tra từng checklist và tiêu chí hoàn thành; ghi bằng chứng và blocker riêng.
4. Cập nhật đầu file và bảng này: Chưa bắt đầu / Đang làm / Bị chặn / Hoàn thành.
5. Bàn giao file thay đổi, lệnh kiểm tra/kết quả, vấn đề còn mở và bước tiếp theo. Không ghi secret vào biên bản.

## Nội dung đã gộp

| Phase mới | Các phần công việc |
|---|---|
| 01 | Khởi tạo Next.js/TypeScript, cấu hình env, thử in sớm, đăng nhập admin và bảo mật |
| 02 | Google file/sheet, parser/index/SlipBuilder, snapshot/cache và API tra cứu |
| 03 | Bốn combobox, tìm kiện, reset trạng thái và xử lý request/lỗi |
| 04 | Preview, nội dung phiếu, A7/A4, Ctrl+P và nghiệm thu in giấy |
| 05 | Kiểm thử toàn luồng, production HTTPS, tài liệu và bàn giao |

## Ràng buộc chung

- Code ở `web/`, tài liệu ở `docs/web/`; không thay đổi Android ngoài yêu cầu.
- Env và Google key chỉ ở server; không tạo/đọc bí mật thật khi lập kế hoạch.
- Test theo từng phase, không dồn đến cuối. Web E2E dựa trên UI đã khám phá; mobile test nếu có phải theo ARTEMIS trong AGENTS.md.
- PDF không thay thế nghiệm thu máy in thật; build thành công không đồng nghĩa đã triển khai.
