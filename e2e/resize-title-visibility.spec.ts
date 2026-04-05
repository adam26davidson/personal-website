import { test, expect } from "@playwright/test";

/**
 * Regression test for title visibility on viewport resize:
 * When resizing from desktop to mobile (or vice versa), the title element
 * disappears and does not re-render in the new layout.
 *
 * Title variants:
 * - Large title (desktop title page): ASCII art containing "____"
 * - Medium title (mobile title page / desktop content sidebar): braille char "🬖"
 * - Small title (mobile content header): plain text "Adam Davidson"
 */

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MATRIX_SELECTOR = 'div[style*="white-space"]';

// Markers for each title variant
const LARGE_TITLE_MARKER = "____"; // from ASCII art
const MEDIUM_TITLE_MARKER = "🬖"; // braille character in medium title
const SMALL_TITLE_MARKER = "Adam\u00A0Davidson"; // plain text small title (uses &nbsp;)

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

test.describe("title visible after resize: desktop → mobile", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test("title page: title visible after resizing to mobile", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForMatrixReady(page);
    // Wait for the large title entrance animation to complete
    await page.waitForTimeout(8000);

    // Large ASCII art title should be visible at desktop size
    expect(await matrixContains(page, LARGE_TITLE_MARKER)).toBe(true);

    // Resize to mobile
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.waitForTimeout(8000);

    // After resize, medium title (braille) should appear
    expect(await matrixContains(page, MEDIUM_TITLE_MARKER)).toBe(true);
  });

  test("content page: title visible after resizing to mobile", async ({
    page,
  }) => {
    await page.goto("/about/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);

    // Desktop content page has medium title in sidebar
    expect(await matrixContains(page, MEDIUM_TITLE_MARKER)).toBe(true);

    // Resize to mobile
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.waitForTimeout(8000);

    // Mobile content page has small title "Adam Davidson" in header
    expect(await matrixContains(page, SMALL_TITLE_MARKER)).toBe(true);
  });
});

test.describe("title visible after resize: mobile → desktop", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test("title page: title visible after resizing to desktop", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);

    // Mobile title page shows medium braille title
    expect(await matrixContains(page, MEDIUM_TITLE_MARKER)).toBe(true);

    // Resize to desktop
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.waitForTimeout(8000);

    // After resize, large ASCII art title should appear
    expect(await matrixContains(page, LARGE_TITLE_MARKER)).toBe(true);
  });

  test("content page: title visible after resizing to desktop", async ({
    page,
  }) => {
    await page.goto("/about/");
    await waitForMatrixReady(page);
    await page.waitForTimeout(5000);

    // Mobile content page has small title
    expect(await matrixContains(page, SMALL_TITLE_MARKER)).toBe(true);

    // Resize to desktop
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.waitForTimeout(8000);

    // Desktop content page has medium braille title in sidebar
    expect(await matrixContains(page, MEDIUM_TITLE_MARKER)).toBe(true);
  });
});
