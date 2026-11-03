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

test("prototype in đủ một trang A6/A7/A4, bỏ ghi chú và tăng chữ dữ liệu", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("test-admin");
  await page.getByLabel("Mật khẩu").fill("test-password-at-least-16-characters");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tra cứu lô và kiện" })).toBeVisible();
  await page.goto("/print-spike?profile=a7");
  await expect(page.getByLabel("Phiếu phân đơn thử nghiệm")).toContainText("SP-025");
  await expect(page.getByRole("button", { name: "In / Ctrl+P", exact: true })).toBeEnabled();
  await expect(page.locator(".slip th")).not.toContainText(["GHI CHÚ"]);
  await expect(page.getByRole("columnheader", { name: "SL", exact: true })).toBeVisible();
  await expect(page.locator(".slip tbody")).toHaveCSS("font-size", "32px");
  const expectContentFits = async () => {
    const fits = await page.locator(".slip").evaluate((paper) => {
      const bounds = paper.getBoundingClientRect();
      return [...paper.querySelectorAll("th, td, .slipFooter")].every((cell) => {
        const rect = cell.getBoundingClientRect();
        return rect.bottom <= bounds.bottom && rect.right <= bounds.right;
      });
    });
    expect(fits).toBe(true);
  };
  await expectContentFits();
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
  expect(a4.getPageCount()).toBe(1);
  await expectContentFits();
  expect(Math.abs(a4.getPage(0).getSize().width - mmToPoints(297))).toBeLessThan(1);
  expect(Math.abs(a4.getPage(0).getSize().height - mmToPoints(210))).toBeLessThan(1);
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("link", { name: /Profile A6/ }).click();
  await expect(page).toHaveURL(/profile=a6/);
  await expect(page.getByRole("button", { name: "In / Ctrl+P", exact: true })).toBeEnabled();
  await page.emulateMedia({ media: "print" });
  const a6 = await PDFDocument.load(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
  expect(a6.getPageCount()).toBe(1);
  await expectContentFits();
  expect(Math.abs(a6.getPage(0).getSize().width - mmToPoints(150))).toBeLessThan(1);
  expect(Math.abs(a6.getPage(0).getSize().height - mmToPoints(100))).toBeLessThan(1);

  // Stress the same layout with many SKU rows and trigger the Ctrl+P fit path.
  await page.locator(".slip tbody").evaluate((body) => {
    const row = body.querySelector("tr")!;
    for (let index = 0; index < 20; index += 1) body.append(row.cloneNode(true));
    window.dispatchEvent(new Event("beforeprint"));
  });
  await expectContentFits();
  const dense = await PDFDocument.load(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
  expect(dense.getPageCount()).toBe(1);
});
