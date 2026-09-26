import { expect, test } from '@playwright/test';
import { details, isPhone, isTouch, openExplorer, searchButton, swipe } from './helpers';

test.describe('touch devices', () => {
  test.beforeEach(() => test.skip(!isTouch(), 'touch devices only'));

  test('core controls are finger-sized', async ({ page }) => {
    await openExplorer(page, '?body=mars');
    const controls = [
      searchButton(page),
      page.getByRole('button', { name: 'View settings' }),
      page.getByRole('button', { name: /^(Play|Pause)$/ }),
      page.getByRole('button', { name: 'Showing live time' }),
      details(page, 'Mars').getByRole('button', { name: 'Close details' })
    ];
    for (const control of controls) {
      const box = (await control.boundingBox())!;
      // Half a pixel of slack for subpixel layout.
      expect(Math.min(box.width, box.height), await control.innerText()).toBeGreaterThan(43.5);
    }
  });

  test('form fields are 16px or larger so iOS never zooms on focus', async ({ page }) => {
    await openExplorer(page, '?body=earth');
    await page.locator('.readout').click();
    await expect(page.locator('#time-sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('input:not([type=checkbox]):not([type=range]), select')]
        .filter((field) => parseFloat(getComputedStyle(field).fontSize) < 16)
        .map((field) => field.outerHTML.slice(0, 80))
    );
    expect(small).toEqual([]);
  });

  test('no lingering entrance animations wrap the sideways scrollers', async ({ page }) => {
    await openExplorer(page, '?body=sun');
    await searchButton(page).click();
    // Entrances run about a second; afterwards none should remain attached.
    await expect
      .poll(() =>
        page.evaluate(() =>
          document
            .getAnimations()
            .map((animation) => (animation as CSSAnimation).animationName)
            .filter((name) => name === 'rise')
        )
      )
      .toEqual([]);
  });

  test('scene labels take a finger-sized tap', async ({ page }) => {
    await openExplorer(page, '?body=solarSystem');
    const label = page.locator('.label.shown').first();
    await expect(label).toBeVisible();
    const hit = await label.evaluate((element) => {
      const before = getComputedStyle(element, '::before');
      return element.getBoundingClientRect().height - 2 * parseFloat(before.top);
    });
    expect(hit).toBeGreaterThanOrEqual(44);
  });
});

test.describe('phone bottom sheet', () => {
  test.beforeEach(() => test.skip(!isPhone(), 'portrait phones only'));

  test('grip cycles peek, half, full, and the close button dismisses', async ({ page }) => {
    await openExplorer(page, '?body=mars');
    const sheet = details(page, 'Mars');
    const grip = sheet.locator('[data-sheet-grip]');
    await expect(grip).toHaveAttribute('aria-expanded', 'false');
    await grip.click();
    await expect(grip).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.time-dock')).toHaveClass(/hidden/);
    await grip.click();
    await expect(grip).toHaveAttribute('aria-label', 'Collapse details');
    await grip.click();
    await expect(grip).toHaveAttribute('aria-expanded', 'false');
    await sheet.getByRole('button', { name: 'Close details' }).click();
    await expect(sheet).toBeHidden();
  });

  test('the Sun sheet lists every planet in a sideways row', async ({ page, browserName }) => {
    await openExplorer(page, '?body=sun');
    const sheet = details(page, 'Sun');
    await sheet.locator('[data-sheet-grip]').click();
    const row = sheet.getByRole('region', { name: 'Around Sun' }).locator('.chips');
    await expect(row).toBeVisible();
    const style = await row.evaluate((element) => ({
      overflow: getComputedStyle(element).overflowX,
      touch: getComputedStyle(element).touchAction,
      scrollable: element.scrollWidth > element.clientWidth
    }));
    expect(style).toEqual({ overflow: 'auto', touch: 'pan-x', scrollable: true });

    if (browserName === 'chromium') {
      // A real finger swipe scrolls the row and leaves the sheet where it was.
      const top = (await sheet.boundingBox())!.y;
      await swipe(page, row, -220, 4);
      await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(60);
      expect((await sheet.boundingBox())!.y).toBeCloseTo(top, 0);
    }
  });

  test('swiping the sheet down dismisses it', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'needs synthesized touch');
    await openExplorer(page, '?body=venus');
    const sheet = details(page, 'Venus');
    await expect(sheet).toBeVisible();
    await swipe(page, sheet.getByRole('heading', { name: 'Venus' }), 0, 260);
    await expect(sheet).toBeHidden();
  });

  test('swiping the sheet up expands it', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'needs synthesized touch');
    await openExplorer(page, '?body=venus');
    const sheet = details(page, 'Venus');
    const grip = sheet.locator('[data-sheet-grip]');
    await swipe(page, sheet.getByRole('heading', { name: 'Venus' }), 0, -300);
    await expect(grip).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('phones on their side', () => {
  test.beforeEach(() =>
    test.skip(test.info().project.name !== 'iphone-landscape', 'landscape phone only')
  );

  test('details card and time control sit side by side', async ({ page }) => {
    await openExplorer(page, '?body=saturn');
    const card = details(page, 'Saturn');
    await expect(card).toBeVisible();
    const cardBox = (await card.boundingBox())!;
    const timeBox = (await page.locator('.time-dock').boundingBox())!;
    expect(timeBox.x + timeBox.width, 'time control clears the card').toBeLessThanOrEqual(
      cardBox.x
    );
    expect(cardBox.height, 'card uses the height it has').toBeGreaterThan(260);
  });

  test('time sheet fits the short screen', async ({ page }) => {
    await openExplorer(page);
    await page.locator('.readout').click();
    const box = (await page.locator('#time-sheet').boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
  });
});
