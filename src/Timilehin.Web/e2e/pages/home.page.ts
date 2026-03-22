import { type Locator, type Page, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly navbar: Locator;
  readonly heroTitle: Locator;
  readonly heroDescription: Locator;
  readonly primaryCta: Locator;
  readonly secondaryCta: Locator;
  readonly verseOfTheDaySection: Locator;
  readonly featureCards: Locator;
  readonly featureCardIcons: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navbar = page.locator('gw-navbar');
    this.heroTitle = page.locator('.hero__title');
    this.heroDescription = page.locator('.hero__description');
    this.primaryCta = page.locator('.hero__button--primary');
    this.secondaryCta = page.locator('.hero__button--secondary');
    this.verseOfTheDaySection = page.locator('gw-verse-of-the-day-card');
    this.featureCards = page.locator('gw-feature-card');
    this.featureCardIcons = page.locator('.feature-card__icon svg');
    this.footer = page.locator('gw-footer');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async expectHeroVisible() {
    await expect(this.heroTitle).toBeVisible();
    await expect(this.heroTitle).toContainText("Discover God's Word");
  }

  async expectVerseOfTheDayVisible() {
    await expect(this.verseOfTheDaySection).toBeVisible({ timeout: 10_000 });
  }

  async clickStartReading() {
    await this.primaryCta.click();
  }

  async clickExploreDevotionals() {
    await this.secondaryCta.click();
  }

  async expectFeatureCardsVisible() {
    await expect(this.featureCards.first()).toBeVisible();
  }

  async expectFeatureCardIconsVisible() {
    await expect(this.featureCardIcons).toHaveCount(2);
    for (const icon of await this.featureCardIcons.all()) {
      await expect(icon).toBeVisible();
    }
  }

  async expectFooterVisible() {
    await expect(this.footer).toBeVisible();
  }

  async clickNavLink(label: string) {
    await this.navbar.getByText(label, { exact: true }).click();
  }
}
