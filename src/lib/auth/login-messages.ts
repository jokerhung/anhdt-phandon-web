export const LOGIN_ERROR_CODES = [
  "origin",
  "invalid",
  "credentials",
  "rate-limit",
  "too-large",
  "server",
] as const;

export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number];

export const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  origin: "Địa chỉ truy cập chưa được phép hoặc yêu cầu bị chặn. Nhờ quản trị viên kiểm tra APP_ORIGIN, ALLOWED_ORIGINS và cấu hình proxy/tunnel.",
  invalid: "Dữ liệu đăng nhập không hợp lệ. Vui lòng nhập lại tên đăng nhập và mật khẩu.",
  credentials: "Thông tin đăng nhập không đúng.",
  "rate-limit": "Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.",
  "too-large": "Dữ liệu đăng nhập quá lớn. Vui lòng kiểm tra lại thông tin đã nhập.",
  server: "Máy chủ gặp lỗi xử lý đăng nhập. Vui lòng liên hệ quản trị viên kiểm tra cấu hình và nhật ký máy chủ.",
};

export function isLoginErrorCode(value: string | null | undefined): value is LoginErrorCode {
  return typeof value === "string" && (LOGIN_ERROR_CODES as readonly string[]).includes(value);
}

export function loginErrorMessage(value: string | null | undefined): string | undefined {
  return isLoginErrorCode(value) ? LOGIN_ERROR_MESSAGES[value] : undefined;
}
