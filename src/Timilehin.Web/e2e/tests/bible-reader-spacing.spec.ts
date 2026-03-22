import { test, expect } from '@playwright/test';
import { BibleReaderPage } from '../pages/bible-reader.page';

/**
 * Helper to parse a CSS px value like "32px" to a number.
 */
function parsePx(value: string): number {
  return parseFloat(value.replace('px', ''));
}

/**
 * Assert that a numeric value is within ±tolerance of expected.
 */
function expectClose(actual: number, expected: number, tolerance = 2) {
  expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
  expect(actual).toBeLessThanOrEqual(expected + tolerance);
}

test.describe('Bible Reader Spacing - Desktop (1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let biblePage: BibleReaderPage;

  test.beforeEach(async ({ page }) => {
    biblePage = new BibleReaderPage(page);
    await biblePage.goto();
  });

  test('sidebar should have correct width and padding', async ({ page }) => {
    const sidebar = biblePage.sidebar;
    await expect(sidebar).toBeVisible();

    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    expectClose(box!.width, 280);

    const styles = await sidebar.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
      };
    });
    expectClose(parsePx(styles.paddingTop), 24);
    expectClose(parsePx(styles.paddingBottom), 24);
    expectClose(parsePx(styles.paddingLeft), 0);
    expectClose(parsePx(styles.paddingRight), 0);
  });

  test('sidebar should have correct background and border', async () => {
    const styles = await biblePage.sidebar.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        borderRight: cs.borderRightWidth + ' ' + cs.borderRightStyle,
      };
    });
    // #f7f0e8 = rgb(247, 240, 232)
    expect(styles.backgroundColor).toBe('rgb(247, 240, 232)');
    expect(styles.borderRight).toContain('1px');
    expect(styles.borderRight).toContain('solid');
  });

  test('reading pane should have correct padding on desktop', async () => {
    const styles = await biblePage.readingPane.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
      };
    });
    expectClose(parsePx(styles.paddingTop), 32);
    expectClose(parsePx(styles.paddingBottom), 32);
    expectClose(parsePx(styles.paddingLeft), 64);
    expectClose(parsePx(styles.paddingRight), 64);
  });

  test('reading pane should have white background', async () => {
    const bg = await biblePage.readingPane.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // #ffffff = rgb(255, 255, 255)
    expect(bg).toBe('rgb(255, 255, 255)');
  });

  test('verses container should have 32px gap on desktop', async ({ page }) => {
    await biblePage.selectBook('Genesis');
    await biblePage.waitForVersesLoaded();

    const versesSection = page.locator('.bible-reader__verses');
    const gap = await versesSection.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });
    expectClose(parsePx(gap), 32);
  });
});

test.describe('Bible Reader Spacing - Tablet (768x1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  let biblePage: BibleReaderPage;

  test.beforeEach(async ({ page }) => {
    biblePage = new BibleReaderPage(page);
    await biblePage.goto();
  });

  test('sidebar should be hidden on tablet', async () => {
    await expect(biblePage.sidebar).toBeHidden();
  });

  test('reading pane should have correct padding on tablet', async () => {
    const styles = await biblePage.readingPane.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
      };
    });
    expectClose(parsePx(styles.paddingTop), 28);
    expectClose(parsePx(styles.paddingBottom), 28);
    expectClose(parsePx(styles.paddingLeft), 32);
    expectClose(parsePx(styles.paddingRight), 32);
  });

  test('verses container should have 24px gap on tablet', async ({ page }) => {
    // On tablet without sidebar, we need another way to select a book.
    // The sidebar is hidden, so we navigate directly to a book chapter via URL if possible.
    await page.goto('/bible');
    await page.waitForLoadState('networkidle');

    // Since sidebar is hidden at 768px, check if there's still a way to load verses.
    // Try clicking the sidebar book button even if hidden (it may be in DOM).
    // If the sidebar is display:none, we can use page.evaluate to force a click or navigate via URL.
    // Let's try direct navigation or evaluate-click.
    const sidebar = page.locator('.bible-reader__sidebar');
    const isVisible = await sidebar.isVisible();

    if (!isVisible) {
      // Force-click the button within the hidden sidebar
      await page.locator('.bible-reader__book-button', { hasText: 'Genesis' }).first().evaluate((el: HTMLElement) => el.click());
      await biblePage.waitForVersesLoaded();
    }

    const versesSection = page.locator('.bible-reader__verses');
    const gap = await versesSection.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });
    expectClose(parsePx(gap), 24);
  });
});

test.describe('Bible Reader Spacing - Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  let biblePage: BibleReaderPage;

  test.beforeEach(async ({ page }) => {
    biblePage = new BibleReaderPage(page);
    await biblePage.goto();
  });

  test('sidebar should be hidden on mobile', async () => {
    await expect(biblePage.sidebar).toBeHidden();
  });

  test('reading pane should have correct padding on mobile', async () => {
    const styles = await biblePage.readingPane.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
      };
    });
    expectClose(parsePx(styles.paddingTop), 20);
    expectClose(parsePx(styles.paddingBottom), 20);
    expectClose(parsePx(styles.paddingLeft), 16);
    expectClose(parsePx(styles.paddingRight), 16);
  });

  test('verses container should have 16px gap on mobile', async ({ page }) => {
    // Force-click Genesis since sidebar is hidden
    await page.locator('.bible-reader__book-button', { hasText: 'Genesis' }).first().evaluate((el: HTMLElement) => el.click());
    await biblePage.waitForVersesLoaded();

    const versesSection = page.locator('.bible-reader__verses');
    const gap = await versesSection.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });
    expectClose(parsePx(gap), 16);
  });
});
