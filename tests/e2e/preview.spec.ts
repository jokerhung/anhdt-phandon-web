import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const mmToPoints = (mm: number) => (mm * 72) / 25.4;

test("query preview giả không dựng phiếu có thể in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("test-admin");
  await page.getByLabel("Mật khẩu").fill("test-password-at-least-16-characters");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tra cứu lô và kiện" })).toBeVisible();
  await page.goto("/preview?fileId=bad&sheetId=0&snapshotId=bad&lot=X&package=Y");
  await expect(page.getByRole("heading", { name: "Thông tin xem trước không hợp lệ" })).toBeVisible();
  await expect(page.getByLabel("Phiếu phân đơn")).toHaveCount(0);
});

test("prototype dùng chung SlipPreview và PDF A7/A4 đúng khổ", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("test-admin");
  await page.getByLabel("Mật khẩu").fill("test-password-at-least-16-characters");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tra cứu lô và kiện" })).toBeVisible();
  await page.goto("/print-spike?profile=a7");
  await expect(page.getByLabel("Phiếu phân đơn thử nghiệm")).toContainText("SP-025");
  await page.emulateMedia({ media: "print" });
  const a7 = await PDFDocument.load(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
  expect(a7.getPageCount()).toBe(1);
  expect(Math.abs(a7.getPage(0).getSize().width - mmToPoints(105))).toBeLessThan(1);
  expect(Math.abs(a7.getPage(0).getSize().height - mmToPoints(74))).toBeLessThan(1);
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("link", { name: /Profile A4/ }).click();
  await expect(page).toHaveURL(/profile=a4/);
  await page.emulateMedia({ media: "print" });
  const a4 = await PDFDocument.load(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
  expect(Math.abs(a4.getPage(0).getSize().width - mmToPoints(297))).toBeLessThan(1);
  expect(Math.abs(a4.getPage(0).getSize().height - mmToPoints(210))).toBeLessThan(1);
});
