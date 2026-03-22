import { test, expect } from '@playwright/test';

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

test.describe('Devotionals Spacing - Desktop (1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/devotionals');
    await page.waitForLoadState('networkidle');
  });

  test('devotional page container should have correct padding on desktop', async ({ page }) => {
    const container = page.locator('.devotional-page-layout');
    await expect(container).toBeVisible();

    const styles = await container.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
      };
    });
    expectClose(parsePx(styles.paddingTop), 48);
    expectClose(parsePx(styles.paddingBottom), 48);
    expectClose(parsePx(styles.paddingLeft), 56);
    expectClose(parsePx(styles.paddingRight), 56);
  });

  test('grid layout should have two columns on desktop', async ({ page }) => {
    const grid = page.locator('.devotional-page-layout');
    await expect(grid).toBeVisible();

    const gridTemplateColumns = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    const columns = gridTemplateColumns.trim().split(/\s+/);
    expect(columns.length).toBe(2);
  });

  test('grid layout should have 32px gap on desktop', async ({ page }) => {
    const grid = page.locator('.devotional-page-layout');
    const gap = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });
    expectClose(parsePx(gap), 32);
  });
});

test.describe('Devotionals Spacing - Tablet (768x1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/devotionals');
    await page.waitForLoadState('networkidle');
  });

  test('devotional page container should have correct padding on tablet', async ({ page }) => {
    const container = page.locator('.devotional-page-layout');
    await expect(container).toBeVisible();

    const styles = await container.evaluate((el) => {
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
    expectClose(parsePx(styles.paddingLeft), 32);
    expectClose(parsePx(styles.paddingRight), 32);
  });

  test('grid layout should have single column on tablet', async ({ page }) => {
    const grid = page.locator('.devotional-page-layout');
    await expect(grid).toBeVisible();

    const gridTemplateColumns = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    const columns = gridTemplateColumns.trim().split(/\s+/);
    expect(columns.length).toBe(1);
  });

  test('grid layout should have 24px gap on tablet', async ({ page }) => {
    const grid = page.locator('.devotional-page-layout');
    const gap = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });
    expectClose(parsePx(gap), 24);
  });
});

test.describe('Devotionals Spacing - Mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/devotionals');
    await page.waitForLoadState('networkidle');
  });

  test('devotional page container should have correct padding on mobile', async ({ page }) => {
    const container = page.locator('.devotional-page-layout');
    await expect(container).toBeVisible();

    const styles = await container.evaluate((el) => {
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
    expectClose(parsePx(styles.paddingLeft), 16);
    expectClose(parsePx(styles.paddingRight), 16);
  });

  test('grid layout should have single column on mobile', async ({ page }) => {
    const grid = page.locator('.devotional-page-layout');
    await expect(grid).toBeVisible();

    const gridTemplateColumns = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    const columns = gridTemplateColumns.trim().split(/\s+/);
    expect(columns.length).toBe(1);
  });

  test('grid layout should have 16px gap on mobile', async ({ page }) => {
    const grid = page.locator('.devotional-page-layout');
    const gap = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });
    expectClose(parsePx(gap), 16);
  });
});
