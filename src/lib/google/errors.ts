export type GoogleErrorCode = "GOOGLE_CONFIG" | "GOOGLE_FORBIDDEN" | "GOOGLE_NOT_FOUND" | "GOOGLE_QUOTA" | "GOOGLE_UNAVAILABLE";

export class GoogleDataError extends Error {
  constructor(public readonly code: GoogleErrorCode, message: string, public readonly status: number) {
    super(message);
    this.name = "GoogleDataError";
  }
}

export function mapGoogleError(error: unknown): GoogleDataError {
  const status = typeof error === "object" && error !== null && "code" in error ? Number((error as { code: unknown }).code) : 0;
  if (status === 401 || status === 403) return new GoogleDataError("GOOGLE_FORBIDDEN", "Không có quyền đọc nguồn Google Sheets.", 403);
  if (status === 404) return new GoogleDataError("GOOGLE_NOT_FOUND", "Nguồn Google Sheets không tồn tại hoặc đã bị xóa.", 404);
  if (status === 429) return new GoogleDataError("GOOGLE_QUOTA", "Google đang giới hạn truy cập. Vui lòng thử lại sau.", 429);
  return new GoogleDataError("GOOGLE_UNAVAILABLE", "Không thể tải dữ liệu từ Google. Vui lòng thử lại.", 503);
}
