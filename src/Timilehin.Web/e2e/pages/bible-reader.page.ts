import { type Locator, type Page, expect } from '@playwright/test';

export class BibleReaderPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly bookButtons: Locator;
  readonly searchInput: Locator;
  readonly readingPane: Locator;
  readonly chapterHeader: Locator;
  readonly verseItems: Locator;
  readonly chapterNav: Locator;
  readonly loadingIndicator: Locator;
  readonly placeholder: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('.bible-reader__sidebar');
    this.bookButtons = page.locator('.bible-reader__book-button');
    this.searchInput = page.locator('.bible-reader__search-input');
    this.readingPane = page.locator('.bible-reader__content');
    this.chapterHeader = page.locator('.bible-reader__header');
    this.verseItems = page.locator('gw-verse-item');
    this.chapterNav = page.locator('gw-chapter-nav');
    this.loadingIndicator = page.locator('.bible-reader__loading');
    this.placeholder = page.locator('.bible-reader__placeholder');
  }

  async goto() {
    await this.page.goto('/bible');
    await this.page.waitForLoadState('networkidle');
  }

  async expectSidebarVisible() {
    await expect(this.sidebar).toBeVisible();
  }

  async expectPlaceholderVisible() {
    await expect(this.placeholder).toBeVisible();
    await expect(this.placeholder).toContainText('Select a book');
  }

  async selectBook(bookName: string) {
    const bookButton = this.bookButtons.filter({ hasText: bookName }).first();
    await bookButton.click();
  }

  async expectBookActive(bookName: string) {
    const activeBook = this.page.locator('.bible-reader__book-button--active');
    await expect(activeBook).toContainText(bookName);
  }

  async waitForVersesLoaded() {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await expect(this.verseItems.first()).toBeVisible({ timeout: 15_000 });
  }

  async expectChapterHeader(text: string) {
    await expect(this.chapterHeader).toContainText(text);
  }

  async expectVersesVisible() {
    const count = await this.verseItems.count();
    expect(count).toBeGreaterThan(0);
  }

  async clickNextChapter() {
    await this.page.locator('.chapter-nav__next').first().click();
  }

  async searchBooks(term: string) {
    await this.searchInput.fill(term);
  }
}
