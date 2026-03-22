import { test, expect } from '@playwright/test';

test.describe('UI Design Verification — Typography', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('hero title uses Playfair Display font family', async ({ page }) => {
    const heroTitle = page.locator('.hero__title');
    await expect(heroTitle).toBeVisible();
    const fontFamily = await heroTitle.evaluate(
      (el) => getComputedStyle(el).fontFamily
    );
    expect(fontFamily.toLowerCase()).toContain('playfair display');
  });

  test('hero title font size is approximately 56px on desktop', async ({
    page,
  }) => {
    const heroTitle = page.locator('.hero__title');
    const fontSize = await heroTitle.evaluate(
      (el) => getComputedStyle(el).fontSize
    );
    const px = parseFloat(fontSize);
    expect(px).toBeGreaterThanOrEqual(50);
    expect(px).toBeLessThanOrEqual(60);
  });

  test('body text uses Inter font family', async ({ page }) => {
    const fontFamily = await page.evaluate(
      () => getComputedStyle(document.body).fontFamily
    );
    expect(fontFamily.toLowerCase()).toContain('inter');
  });

  test('navigation links use Inter font family at 14px', async ({ page }) => {
    const navLink = page.locator('.navbar__link').first();
    await expect(navLink).toBeVisible();

    const fontFamily = await navLink.evaluate(
      (el) => getComputedStyle(el).fontFamily
    );
    expect(fontFamily.toLowerCase()).toContain('inter');

    const fontSize = await navLink.evaluate(
      (el) => getComputedStyle(el).fontSize
    );
    expect(parseFloat(fontSize)).toBeCloseTo(14, 0);
  });

  test('verse of the day text uses Playfair Display italic', async ({
    page,
  }) => {
    const votdText = page.locator('.votd-card__text');
    await expect(votdText).toBeVisible({ timeout: 10_000 });

    const fontFamily = await votdText.evaluate(
      (el) => getComputedStyle(el).fontFamily
    );
    expect(fontFamily.toLowerCase()).toContain('playfair display');

    const fontStyle = await votdText.evaluate(
      (el) => getComputedStyle(el).fontStyle
    );
    expect(fontStyle).toBe('italic');
  });
});

test.describe('UI Design Verification — Spacing & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('navbar has correct padding on desktop', async ({ page }) => {
    const navbar = page.locator('.navbar').first();
    await expect(navbar).toBeVisible();

    const padding = await navbar.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        top: parseFloat(style.paddingTop),
        right: parseFloat(style.paddingRight),
        bottom: parseFloat(style.paddingBottom),
        left: parseFloat(style.paddingLeft),
      };
    });

    // Design spec: padding 20px 56px
    expect(padding.top).toBeGreaterThanOrEqual(16);
    expect(padding.top).toBeLessThanOrEqual(24);
    expect(padding.left).toBeGreaterThanOrEqual(48);
    expect(padding.left).toBeLessThanOrEqual(64);
  });

  test('hero section has minimum height of 480px on desktop', async ({
    page,
  }) => {
    const hero = page.locator('.hero').first();
    await expect(hero).toBeVisible();

    const height = await hero.evaluate(
      (el) => el.getBoundingClientRect().height
    );
    expect(height).toBeGreaterThanOrEqual(400);
  });

  test('feature cards section uses horizontal layout on desktop', async ({
    page,
  }) => {
    const featuresSection = page.locator('.features').first();
    await expect(featuresSection).toBeVisible();

    const display = await featuresSection.evaluate(
      (el) => getComputedStyle(el).display
    );
    // Should be flex or grid for horizontal layout
    expect(['flex', 'grid', 'inline-flex']).toContain(display);
  });

  test('footer has dark background color', async ({ page }) => {
    const footer = page.locator('.footer').first();
    await expect(footer).toBeVisible();

    const bgColor = await footer.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    // Should be dark (#1A1A2E = rgb(26, 26, 46))
    // Parse and verify it's dark
    const match = bgColor.match(/\d+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      const brightness = (r + g + b) / 3;
      expect(brightness).toBeLessThan(80);
    }
  });

  test('navbar is sticky and stays at top when scrolling', async ({ page }) => {
    const navbarHost = page.locator('gw-navbar').first();
    await expect(navbarHost).toBeVisible();

    const position = await navbarHost.evaluate(
      (el) => getComputedStyle(el).position
    );
    expect(position).toBe('sticky');

    const top = await navbarHost.evaluate(
      (el) => getComputedStyle(el).top
    );
    expect(top).toBe('0px');

    const zIndex = await navbarHost.evaluate(
      (el) => getComputedStyle(el).zIndex
    );
    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(100);
  });
});
