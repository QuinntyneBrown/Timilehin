import { test, expect, request } from '@playwright/test';
import { DevotionalsPage } from '../pages/devotionals.page';

test.describe('Devotionals', () => {
  test.beforeAll(async () => {
    // Seed a devotional for today via the API so tests have data
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:5256',
    });

    const today = new Date().toISOString().split('T')[0];

    // Create today's devotional (ignore if already exists)
    await apiContext.post('/api/devotionals', {
      data: {
        title: 'Walking in Faith',
        date: today,
        scriptureReference: 'Proverbs 3:5-6',
        reflectionText:
          'Trust in the Lord with all your heart and lean not on your own understanding.',
        prayerPrompt:
          'Lord, help me to trust in Your plan for my life. Amen.',
      },
    });

    // Create a past devotional
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];
    await apiContext.post('/api/devotionals', {
      data: {
        title: 'The Strength in Stillness',
        date: yesterday,
        scriptureReference: 'Psalm 46:10',
        reflectionText:
          'Be still and know that I am God. In a world that never stops moving.',
        prayerPrompt:
          'Father, teach me to be still in Your presence. Amen.',
      },
    });

    await apiContext.dispose();
  });

  test('should display the devotionals page', async ({ page }) => {
    const devotionalsPage = new DevotionalsPage(page);
    await devotionalsPage.goto();
    await devotionalsPage.expectPageLoaded();
  });

  test('should display the archive section', async ({ page }) => {
    const devotionalsPage = new DevotionalsPage(page);
    await devotionalsPage.goto();
    await devotionalsPage.expectArchiveVisible();
  });

  test('should show seeded devotionals in the archive', async ({ page }) => {
    const devotionalsPage = new DevotionalsPage(page);
    await devotionalsPage.goto();

    // Wait for archive to load
    await page.waitForTimeout(2000);
    const count = await devotionalsPage.getArchiveCardCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
