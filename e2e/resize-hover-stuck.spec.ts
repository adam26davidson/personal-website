import { test, expect } from "@playwright/test";

/**
 * Regression test for hover state getting stuck after viewport resize:
 * When resizing from mobile to desktop on the title page, hovering over a nav
 * link and then moving the mouse away should remove the bold (hover) styling.
 *
 * Root cause: When hovering a link while a parent container is in "entering"
 * stage, the parent's mouseIsInside flag is never set (blocked by the
 * "entering" guard in handleMouseMove). Later, when the mouse exits, the
 * parent's gate check (pointIsInside || mouseIsInside) evaluates to
 * (false || false), skipping child event propagation entirely — so the link
 * never receives the mouse-exit and stays bold.
 *
 * The character matrix renders hover state by substituting normal Unicode
 * characters with Mathematical Bold characters (e.g. "ABOUT" → "𝐀𝐁𝐎𝐔𝐓").
 */

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MATRIX_SELECTOR = 'div[style*="white-space"]';

// Bold Unicode for "ABOUT" (Mathematical Bold: U+1D400 range)
const BOLD_ABOUT = "\u{1D400}\u{1D401}\u{1D40E}\u{1D414}\u{1D413}";

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

async function waitForLinks(
  page: import("@playwright/test").Page,
  timeout = 20000
): Promise<void> {
  await page.waitForFunction(
    ([sel, t]) => {
      const el = document.querySelector(sel);
      return el ? el.textContent?.includes(t) ?? false : false;
    },
    [MATRIX_SELECTOR, "ABOUT"] as const,
    { timeout }
  );
}

async function matrixContainsBold(
  page: import("@playwright/test").Page,
  boldText: string,
  timeout = 2000
): Promise<boolean> {
  try {
    await page.waitForFunction(
      ([sel, t]) => {
        const el = document.querySelector(sel);
        return el ? el.textContent?.includes(t) ?? false : false;
      },
      [MATRIX_SELECTOR, boldText] as const,
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Find the pixel position of a text string in the character matrix.
 * Waits for the text to be locatable (animation may be in progress).
 * Returns the center of the match.
 */
async function findTextPosition(
  page: import("@playwright/test").Page,
  text: string,
  timeout = 10000
): Promise<{ x: number; y: number }> {
  return page
    .waitForFunction(
      ([sel, t]) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const content = el.textContent ?? "";
        const lines = content.split("\n");

        const charWidth = 8;
        const charHeight = 16;

        for (let row = 0; row < lines.length; row++) {
          const col = lines[row].indexOf(t);
          if (col >= 0) {
            return {
              x: rect.left + (col + t.length / 2) * charWidth,
              y: rect.top + (row + 0.5) * charHeight,
            };
          }
        }
        return null;
      },
      [MATRIX_SELECTOR, text] as const,
      { timeout }
    )
    .then((handle) => handle.jsonValue());
}

test.describe("title page: hover state after resize", () => {
  test("mobile → desktop: link hover should clear on mouse exit", async ({
    page,
  }) => {
    // Load at desktop first to learn where ABOUT appears
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/");
    await waitForMatrixReady(page);
    await waitForLinks(page);
    await page.waitForTimeout(3000);
    const aboutPos = await findTextPosition(page, "ABOUT");

    // Now reload at mobile
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");
    await waitForMatrixReady(page);
    await waitForLinks(page);

    // Resize to desktop — entrance animations begin.
    // Links enter in series (about → projects → contact → blog).
    // The parent linkContainer stays in "entering" until the LAST link
    // finishes. We want to hover "ABOUT" in the window after the link
    // itself reaches "main" but while a parent is still "entering".
    await page.setViewportSize(DESKTOP_VIEWPORT);

    // Wait just for the resize debounce to process
    await page.waitForTimeout(300);

    // Start moving the mouse to the ABOUT position immediately.
    // Fire repeated pointer events so that one of them lands in the
    // critical window: ABOUT link is "main" but parent is "entering".
    // We use the pre-computed position since we know where ABOUT will be.
    let boldAppeared = false;
    for (let i = 0; i < 100 && !boldAppeared; i++) {
      await page.mouse.move(aboutPos.x + (i % 2), aboutPos.y);
      boldAppeared = await matrixContainsBold(page, BOLD_ABOUT, 50);
    }
    expect(boldAppeared).toBe(true);

    // Now wait for ALL entrance animations to fully complete.
    // The mouse hasn't moved to a new position, so the parent's mouseIsInside
    // may never have been set (if the hover landed during "entering").
    await page.waitForTimeout(8000);

    // Move mouse far away from any link
    await page.mouse.move(10, 10, { steps: 3 });

    // Bold should be cleared. If the parent's mouseIsInside was never set,
    // moving the mouse out causes the parent to skip child event propagation,
    // leaving the link stuck in bold.
    await page.waitForTimeout(500);
    expect(await matrixContainsBold(page, BOLD_ABOUT, 3000)).toBe(false);
  });
});
