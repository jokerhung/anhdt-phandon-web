import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("test-admin");
  await page.getByLabel("Mật khẩu").fill("test-password-at-least-16-characters");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tra cứu lô và kiện" })).toBeVisible();
}

async function selectFirst(page: import("@playwright/test").Page, label: string) {
  await page.getByRole("combobox", { name: label }).click();
  const option = page.getByRole("option").first();
  await expect(option).toBeVisible();
  await option.click();
}

test("chọn File → Sheet → Lô → Kiện và điều hướng preview", async ({ page }) => {
  test.skip(!process.env.GOOGLE_APPLICATION_CREDENTIALS, "Cần Google credential read-only cho lookup E2E");
  await login(page);
  const preview = page.getByRole("button", { name: "Xem trước" });
  await expect(preview).toBeDisabled();
  await selectFirst(page, "File Google Sheets");
  await selectFirst(page, "Sheet / Tab");
  await selectFirst(page, "Lô");
  await page.getByRole("combobox", { name: "Kiện" }).click();
  await page.getByPlaceholder("Tìm mã kiện…").fill("1");
  await page.getByRole("option").first().click();
  await expect(page.getByTestId("package-summary")).toBeVisible();
  await expect(page.getByText("Tổng SL", { exact: true })).toBeVisible();
  await expect(page.getByText("Nhà phân phối đã được phân", { exact: true })).toBeVisible();
  await expect(page.getByTestId("total-quantity")).toHaveText(/^\d/);
  await expect(preview).toBeEnabled();
  await preview.click();
  await expect(page).toHaveURL(/\/preview\?.*fileId=.*sheetId=.*snapshotId=.*lot=.*package=/);
  await expect(page.getByRole("heading", { name: "Dữ liệu xem trước đã sẵn sàng" })).toBeVisible();
});

test("ghi nhớ file và sheet đã chọn sau khi reload trang", async ({ page }) => {
  test.skip(!process.env.GOOGLE_APPLICATION_CREDENTIALS, "Cần Google credential read-only cho lookup E2E");
  await login(page);
  await selectFirst(page, "File Google Sheets");
  const selectedFile = await page.getByRole("combobox", { name: "File Google Sheets" }).innerText();
  await selectFirst(page, "Sheet / Tab");
  const selectedSheet = await page.getByRole("combobox", { name: "Sheet / Tab" }).innerText();
  await page.reload();
  await expect(page.getByRole("combobox", { name: "File Google Sheets" })).toHaveText(selectedFile);
  await expect(page.getByRole("combobox", { name: "Sheet / Tab" })).toHaveText(selectedSheet);
  await expect(page.getByRole("combobox", { name: "Lô" })).toBeEnabled();
});

test("responsive không tràn ngang và trường phụ thuộc bị khóa", async ({ page }) => {
  test.skip(!process.env.GOOGLE_APPLICATION_CREDENTIALS, "Cần Google credential read-only cho lookup E2E");
  await page.setViewportSize({ width: 320, height: 700 });
  await login(page);
  await expect(page.getByRole("combobox", { name: "Sheet / Tab" })).toBeDisabled();
  await expect(page.getByRole("combobox", { name: "Lô" })).toBeDisabled();
  await expect(page.getByRole("combobox", { name: "Kiện" })).toBeDisabled();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
