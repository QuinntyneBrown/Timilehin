import { type Locator, type Page, expect } from '@playwright/test';

export class DevotionalsPage {
  readonly page: Page;
  readonly todaySection: Locator;
  readonly archiveSection: Locator;
  readonly devotionalCards: Locator;
  readonly loadMoreButton: Locator;
  readonly todayDevotionalCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.todaySection = page.locator('gw-today-devotional-container');
    this.archiveSection = page.locator('gw-devotional-archive-container');
    this.devotionalCards = page.locator('gw-devotional-summary-card');
    this.loadMoreButton = page.getByText('Load More');
    this.todayDevotionalCard = page.locator('gw-devotional-card');
  }

  async goto() {
    await this.page.goto('/devotionals');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded() {
    await expect(this.todaySection).toBeVisible({ timeout: 10_000 });
    await expect(this.archiveSection).toBeVisible({ timeout: 10_000 });
  }

  async expectArchiveVisible() {
    await expect(this.archiveSection).toBeVisible();
  }

  async getArchiveCardCount(): Promise<number> {
    return this.devotionalCards.count();
  }

  async clickArchiveCard(index: number) {
    await this.devotionalCards.nth(index).click();
  }
}
