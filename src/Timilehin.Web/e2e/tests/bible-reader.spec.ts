import { test, expect } from '@playwright/test';
import { BibleReaderPage } from '../pages/bible-reader.page';

test.describe('Bible Reader', () => {
  let biblePage: BibleReaderPage;

  test.beforeEach(async ({ page }) => {
    biblePage = new BibleReaderPage(page);
    await biblePage.goto();
  });

  test('should display sidebar with book list', async () => {
    await biblePage.expectSidebarVisible();
    const bookCount = await biblePage.bookButtons.count();
    expect(bookCount).toBeGreaterThan(0);
  });

  test('should show placeholder before book selection', async () => {
    await biblePage.expectPlaceholderVisible();
  });

  test('should load Genesis chapter 1 when selecting Genesis', async () => {
    await biblePage.selectBook('Genesis');
    await biblePage.expectBookActive('Genesis');
    await biblePage.waitForVersesLoaded();
    await biblePage.expectChapterHeader('Genesis 1');
    await biblePage.expectVersesVisible();
  });

  test('should navigate to next chapter', async ({ page }) => {
    await biblePage.selectBook('Genesis');
    await biblePage.waitForVersesLoaded();
    await biblePage.expectChapterHeader('Genesis 1');

    await biblePage.clickNextChapter();
    // Wait for the new chapter to load
    await page.waitForTimeout(1000);
    await biblePage.waitForVersesLoaded();
    await biblePage.expectChapterHeader('Genesis 2');
  });

  test('should filter books via search', async () => {
    await biblePage.searchBooks('Psalm');
    // After filtering, fewer books should be visible
    const filteredCount = await biblePage.bookButtons.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(66);
  });
});
