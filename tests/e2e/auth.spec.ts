import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

test("security headers và health endpoint không lộ bí mật", async ({ page, request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("private");
  const body = await response.json();
  expect(body).toMatchObject({ status: "ok", service: "ugreen-phan-don-web" });
  expect(JSON.stringify(body)).not.toContain("PRIVATE KEY");
  const pageResponse = await page.goto("/login");
  expect(pageResponse?.headers()["x-frame-options"]).toBe("DENY");
  expect(pageResponse?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(pageResponse?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});

test("form đăng nhập chạy thật và logout thu hồi phiên", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();

  await page.getByLabel("Tên đăng nhập").fill("sai");
  await page.getByLabel("Mật khẩu").fill("sai-mat-khau");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByText("Thông tin đăng nhập không đúng.", { exact: true })).toBeVisible();

  await page.getByLabel("Tên đăng nhập").fill("test-admin");
  await page.getByLabel("Mật khẩu").fill("test-password-at-least-16-characters");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tra cứu kiện" })).toBeVisible();
  const sessionCookie = (await page.context().cookies()).find((cookie) => cookie.name === "phan_don_session");
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe("Lax");
  expect(sessionCookie?.value.length).toBeGreaterThanOrEqual(43);

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("trang thử in ẩn toolbar trong print media và giữ tiếng Việt", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("test-admin");
  await page.getByLabel("Mật khẩu").fill("test-password-at-least-16-characters");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tra cứu lô và kiện" })).toBeVisible();
  await page.getByRole("link", { name: "Thử in" }).click();
  await expect(page).toHaveURL(/\/print-spike/);
  await expect(page.getByText(/Ghi chú dài để kiểm tra/)).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Thử in phiếu A7" })).toBeHidden();
  await expect(page.getByLabel("Phiếu phân đơn thử nghiệm")).toBeVisible();

  const pdfBytes = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pdf = await PDFDocument.load(pdfBytes);
  expect(pdf.getPageCount()).toBe(1);
  const { width, height } = pdf.getPage(0).getSize();
  const mmToPoints = (mm: number) => (mm * 72) / 25.4;
  expect(Math.abs(width - mmToPoints(74))).toBeLessThan(1);
  expect(Math.abs(height - mmToPoints(105))).toBeLessThan(1);

  await page.emulateMedia({ media: "screen" });
  await page.getByRole("link", { name: "Profile A4" }).click();
  await expect(page).toHaveURL(/profile=a4/);
  await page.emulateMedia({ media: "print" });
  const a4PdfBytes = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const a4Pdf = await PDFDocument.load(a4PdfBytes);
  expect(a4Pdf.getPageCount()).toBe(1);
  const a4Size = a4Pdf.getPage(0).getSize();
  expect(Math.abs(a4Size.width - mmToPoints(210))).toBeLessThan(1);
  expect(Math.abs(a4Size.height - mmToPoints(297))).toBeLessThan(1);
  const slipBox = await page.getByLabel("Phiếu phân đơn thử nghiệm").boundingBox();
  expect(slipBox).not.toBeNull();
  expect(Math.abs((slipBox?.width ?? 0) - (74 * 96) / 25.4)).toBeLessThan(2);
  expect(Math.abs((slipBox?.height ?? 0) - (105 * 96) / 25.4)).toBeLessThan(2);
});
