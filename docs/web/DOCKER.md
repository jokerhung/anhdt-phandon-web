# Deploy bằng Docker Compose

Yêu cầu Docker Engine/Docker Desktop chạy Linux containers và Docker Compose v2+.
Chạy các lệnh từ thư mục `web`. Chỉ chạy **một instance** vì session và rate-limit nằm trong RAM.

## Coolify (cấu hình mặc định)

1. Tạo **Application từ Git repository**, chọn build pack **Docker Compose**. Không dùng service chỉ paste Compose vì image này cần source và Dockerfile trong repo.
2. Base Directory là `/web` nếu repo chứa thư mục `web`, hoặc `/` nếu repo bắt đầu ngay tại thư mục này. Compose Location: `/docker-compose.yml` tính từ Base Directory. Không dùng override local.
3. Trong **Domains for web**, nhập `https://phandon.sk2.io.vn:3000`. `:3000` chỉ định cổng nội bộ cho proxy; URL người dùng vẫn là `https://phandon.sk2.io.vn`. Đặt `APP_ORIGIN=https://phandon.sk2.io.vn` **không có `:3000`**.
4. Nhập các biến trong phần Environment Variables của Coolify theo ví dụ bên dưới. Compose không yêu cầu file `.env` được commit. Các biến tài khoản, hash và cấu hình Google chỉ cần runtime, **không bật Available at Buildtime**. Chỉ `DEPLOYMENT_VERSION` dùng cả build và runtime; cập nhật giá trị cho mỗi release.
5. Đưa Google key lên **deployment server** ở ngoài thư mục checkout, ví dụ `/opt/phandon/secrets/service-account.json`; đặt `GOOGLE_SERVICE_ACCOUNT_FILE` bằng đường dẫn này. Không dùng đường dẫn Windows từ máy dev. Compose mount key read-only, giữ nguyên cách app đọc file. Nếu dùng build server riêng, file key phải ở deployment server. Cấp quyền đọc cho UID 1000 của container (ví dụ owner UID 1000, mode 0400); hạn chế quyền thư mục và không commit key.
6. Trỏ DNS domain về Coolify/proxy rồi Deploy. Nếu domain vẫn dùng Cloudflare Tunnel, chuyển đích tunnel tới proxy Coolify phù hợp với máy triển khai; Compose mặc định không còn publish cổng host 3003. Không thay route đang dùng trước khi deployment mới sẵn sàng.
7. Kiểm tra service healthy, `/api/health` trả 200, đăng nhập và tải dữ liệu Google. Healthcheck không xác minh credential Google có hợp lệ hay chưa.

Coolify quản lý network và proxy labels. `expose: 3000` không mở cổng public. `TRUST_PROXY` mặc định false; chỉ bật khi xác minh proxy ghi đè header IP. Khi false, mọi người dùng chia sẻ hạn mức đăng nhập.

Tham khảo: [Coolify Docker Compose](https://coolify.io/docs/applications/builds/docker-compose), [domain/cổng nội bộ](https://coolify.io/docs/applications/configuration/general).

## Cấu hình

Dùng `.env` hiện có hoặc sao chép `.env.example`, sau đó cấu hình:

```dotenv
PORT=3003
APP_ORIGIN=https://phandon.sk2.io.vn
ALLOWED_ORIGINS=https://phandon.sk2.io.vn,http://localhost:3003,http://127.0.0.1:3003
ADMIN_USERNAME=ten-quan-tri-rieng
ADMIN_PASSWORD_HASH=hash-scrypt-tao-bang-npm-run-hash-password
GOOGLE_SERVICE_ACCOUNT_FILE=/opt/phandon/secrets/service-account.json`r`nGOOGLE_APPLICATION_CREDENTIALS=/run/secrets/google_service_account
DEPLOYMENT_VERSION=release-001
TRUST_PROXY=false
```

- Thay username và hash bằng giá trị thật; production không cho dùng username `admin`.
- `APP_ORIGIN` phải là HTTPS. Cookie production luôn Secure; ưu tiên đăng nhập bằng domain HTTPS, không hạ bảo mật cookie để dùng HTTP.
- `GOOGLE_APPLICATION_CREDENTIALS` là đường dẫn **file trên máy host**, dùng dấu `/` trên Windows. Linux dùng ví dụ `/opt/private/service-account.json`. File phải tồn tại và tài khoản `node` trong container phải đọc được. Compose mount read-only vào `/run/secrets/google_service_account`; không đưa key hay `.env` vào image. Không đặt bí mật trong `src/` hoặc `public/`.
- `PORT` chỉ dùng cho override local; Coolify luôn route tới cổng nội bộ `3000`.
- Chỉ bật `TRUST_PROXY=true` khi đã xác minh proxy ghi đè header IP tin cậy. `false` dùng chung hạn mức đăng nhập cho mọi client.
- Không in `docker compose config` ra log công khai vì có thể lộ biến môi trường; dùng `config --quiet`.

## Build và chạy local (không qua Coolify)

Trên Windows, đổi đường dẫn Google key trong `.env` về file trên máy local, ví dụ `D:/private/service-account.json`. Thêm override để publish cổng host:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.local.yml ps
docker compose -f docker-compose.yml -f docker-compose.local.yml logs --tail=100 web
```

Nếu `npm run dev` đang chiếm cổng 3003, dừng nó trước khi `up`, hoặc đổi `PORT` và route tunnel tương ứng. Container có healthcheck `/api/health`; lỗi cấu hình production trả 503 và trạng thái unhealthy. Restart policy không tự khởi động lại container chỉ vì unhealthy.

Cloudflared đang chạy **trên host**: giữ route `phandon.sk2.io.vn` tới `http://127.0.0.1:3003`. Không cần bật dev/HMR trong production. Nếu cloudflared chạy trong container, `localhost` trỏ vào chính container đó; cần dùng chung Docker network và service `http://web:3000` thay vì route host này.

## Cập nhật / dừng local

Trên Coolify, dùng Deploy/Restart/Stop trong UI. Các lệnh bên dưới dành cho local:

Sau khi đổi code hoặc `DEPLOYMENT_VERSION`:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Sau khi chỉ đổi `.env` (origin, tài khoản, v.v.):

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --force-recreate
```

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

Restart/recreate làm mất session và snapshot RAM; người dùng cần đăng nhập và tra cứu lại. Không scale nhiều replica. Deployment ID được ghi khi build; dùng cùng giá trị lúc chạy.
