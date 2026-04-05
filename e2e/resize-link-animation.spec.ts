import { test, expect } from "@playwright/test";

/**
 * Regression test for link entrance animation on viewport resize:
 * When resizing the title page between desktop and mobile, the nav links
 * (ABOUT, PROJECTS, etc.) should play their entrance animation rather than
 * appearing instantly. Because React reuses the link elements (stable keys),
 * they remain in "main" stage and skip the entrance animation.
 *
 * These tests verify that immediately after a resize, the links are NOT yet
 * visible (they should be queued for entrance animation), and only appear
 * after the animation has had time to run.
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
        return el ? el.textContent?.includes(t) ?? false : false;
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

test.describe("title page: links should animate in after resize", () => {
  test("desktop → mobile: links not visible immediately after resize", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(8000);

    // Links should be visible at desktop size
    expect(await matrixContains(page, "ABOUT")).toBe(true);

    // Resize to mobile — wait for the 50ms resize debounce + processing
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.waitForTimeout(200);

    // After layout switch, links should NOT be visible yet —
    // they should be queued for their entrance animation
    expect(await matrixContains(page, "ABOUT", 500)).toBe(false);

    // After animations complete, links should be visible
    expect(await matrixContains(page, "ABOUT", 15000)).toBe(true);
  });

  test("mobile → desktop: links not visible immediately after resize", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);

    // Links should be visible at mobile size
    expect(await matrixContains(page, "ABOUT")).toBe(true);

    // Resize to desktop — wait for the 50ms resize debounce + processing
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.waitForTimeout(200);

    // After layout switch, links should NOT be visible yet
    expect(await matrixContains(page, "ABOUT", 500)).toBe(false);

    // After animations complete, links should be visible
    expect(await matrixContains(page, "ABOUT", 15000)).toBe(true);
  });
});
