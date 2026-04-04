import { test, expect } from "@playwright/test";

/**
 * Regression test for mobile content visibility bug:
 * On mobile viewport, content in scrollable containers was invisible due to
 * a reference aliasing bug in ElementBase.setSize() — the expand-height
 * cascade was silently skipped because the IntPoint equality check compared
 * an object to itself.
 */

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MATRIX_SELECTOR = 'div[style*="white-space"]';

async function matrixContains(
  page: import("@playwright/test").Page,
  text: string,
  timeout = 10000
): Promise<boolean> {
  try {
    await page.waitForFunction(
      ([sel, t]) => {
        const el = document.querySelector(sel);
        return el ? el.innerHTML.includes(t) : false;
      },
      [MATRIX_SELECTOR, text] as const,
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

async function waitForMatrixReady(
  page: import("@playwright/test").Page,
  timeout = 15000
): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      return el.innerHTML.length > 500;
    },
    MATRIX_SELECTOR,
    { timeout }
  );
}

test.describe("content pages render at mobile size", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test("about page", async ({ page }) => {
    await page.goto("/about/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);
    expect(await matrixContains(page, "About")).toBe(true);
  });

  test("projects page", async ({ page }) => {
    await page.goto("/projects/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);
    expect(await matrixContains(page, "Projects")).toBe(true);
  });

  test("contact page", async ({ page }) => {
    await page.goto("/contact/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);
    expect(await matrixContains(page, "Contact")).toBe(true);
  });
});

test.describe("content pages render at desktop size", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test("about page", async ({ page }) => {
    await page.goto("/about/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);
    expect(await matrixContains(page, "About")).toBe(true);
  });

  test("projects page", async ({ page }) => {
    await page.goto("/projects/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);
    expect(await matrixContains(page, "Projects")).toBe(true);
  });

  test("contact page", async ({ page }) => {
    await page.goto("/contact/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);
    expect(await matrixContains(page, "Contact")).toBe(true);
  });
});
