import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('Homepage', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display the hero section with title and CTA buttons', async () => {
    await homePage.expectHeroVisible();
    await expect(homePage.primaryCta).toBeVisible();
    await expect(homePage.primaryCta).toContainText('Start Reading');
    await expect(homePage.secondaryCta).toBeVisible();
  });

  test('should display the verse of the day section', async () => {
    await homePage.expectVerseOfTheDayVisible();
  });

  test('should display feature cards', async () => {
    await homePage.expectFeatureCardsVisible();
  });

  test('should display icons inside feature cards', async () => {
    await homePage.expectFeatureCardIconsVisible();
  });

  test('should display the footer', async () => {
    await homePage.expectFooterVisible();
  });

  test('should navigate to Bible reader when clicking Start Reading', async ({ page }) => {
    await homePage.clickStartReading();
    await expect(page).toHaveURL(/\/bible/);
  });

  test('should navigate to Devotionals when clicking Explore Devotionals', async ({ page }) => {
    await homePage.clickExploreDevotionals();
    await expect(page).toHaveURL(/\/devotionals/);
  });

  test('should navigate via navbar links', async ({ page }) => {
    await homePage.clickNavLink('Read Bible');
    await expect(page).toHaveURL(/\/bible/);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    homePage = new HomePage(page);
    await homePage.clickNavLink('Devotionals');
    await expect(page).toHaveURL(/\/devotionals/);
  });
});
