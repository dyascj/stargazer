import { expect, test } from '@playwright/test';
import { axeViolations, isTouch, watchErrors } from './helpers';

test('landing page renders without errors or sideways scrolling', async ({ page }) => {
  const noErrors = watchErrors(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/Stargazer/);
  await expect(page.getByRole('link', { name: 'Launch explorer' }).first()).toBeVisible();

  // Walk the whole page so every chapter mounts and reveals.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, 'page is wider than the screen').toBeLessThanOrEqual(0);
  noErrors();
});

test('landing page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Launch explorer' }).first()).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

test('the year slider is a comfortable touch target', async ({ page }) => {
  test.skip(!isTouch(), 'touch sizing only');
  await page.goto('/');
  const slider = page.getByRole('slider').first();
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test('launch explorer link opens the explorer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Launch explorer' }).first().click();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.locator('main.explorer')).toBeVisible();
});

test('section reveals skip the blur on touch screens', async ({ page }) => {
  test.skip(!isTouch(), 'touch devices only');
  await page.goto('/');
  const blurred = await page.evaluate(
    () =>
      [...document.querySelectorAll('[data-reveal]')].filter(
        (element) => getComputedStyle(element).filter !== 'none'
      ).length
  );
  expect(blurred).toBe(0);
});
