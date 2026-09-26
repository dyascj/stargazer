import { expect, test } from '@playwright/test';
import {
  PLANETS,
  axeViolations,
  details,
  isPhone,
  isTouch,
  openExplorer,
  searchButton,
  searchFor,
  watchErrors
} from './helpers';

test.describe('explorer', () => {
  test('boots to a calm Earth view without errors', async ({ page }) => {
    const noErrors = watchErrors(page);
    await openExplorer(page);
    await expect(page).toHaveTitle('Earth · Stargazer');
    await expect(page.getByRole('navigation', { name: 'Location' })).toContainText('Earth');
    await expect(page.getByRole('button', { name: /^(Play|Pause)$/ })).toBeVisible();
    await expect(details(page, 'Earth')).toBeHidden();
    noErrors();
  });

  test('deep links select a body and open its details', async ({ page }) => {
    await openExplorer(page, '?body=saturn');
    await expect(page).toHaveTitle('Saturn · Stargazer');
    await expect(
      details(page, 'Saturn').getByRole('heading', { name: 'Saturn', exact: true })
    ).toBeVisible();
  });

  test('search finds a body and flies there', async ({ page }) => {
    const noErrors = watchErrors(page);
    await openExplorer(page);
    await searchFor(page, 'mars', 'Mars');
    await expect(page).toHaveTitle('Mars · Stargazer');
    await expect(
      details(page, 'Mars').getByRole('heading', { name: 'Mars', exact: true })
    ).toBeVisible();
    noErrors();
  });

  test('search shows an empty state for no matches', async ({ page }) => {
    await openExplorer(page);
    await searchButton(page).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await dialog.getByRole('combobox').fill('zzzzqqq');
    await expect(dialog.getByText('No matches for')).toBeVisible();
  });

  test('every planet in the search shortcuts is on screen without swiping', async ({ page }) => {
    await openExplorer(page);
    await searchButton(page).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    const viewport = page.viewportSize()!;
    for (const name of PLANETS) {
      const tile = dialog.getByRole('option', { name, exact: true });
      await expect(tile).toBeVisible();
      const box = (await tile.boundingBox())!;
      expect(box.x, `${name} starts on screen`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${name} ends on screen`).toBeLessThanOrEqual(viewport.width);
    }
    await dialog.getByRole('option', { name: 'Neptune', exact: true }).click();
    await expect(page).toHaveTitle('Neptune · Stargazer');
  });

  test('search keyboard flow: slash, arrows, enter, escape', async ({ page }) => {
    test.skip(isTouch(), 'keyboard shortcuts are for hardware keyboards');
    await openExplorer(page);
    await page.keyboard.press('/');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page).toHaveTitle('Mercury · Stargazer');
    await page.keyboard.press('/');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('launches tab lists the schedule', async ({ page }) => {
    await openExplorer(page);
    await searchButton(page).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await dialog.getByRole('radio', { name: 'Launches' }).click();
    await expect(dialog.getByText('Falcon 9 | Test Mission')).toBeVisible();
  });

  test('breadcrumbs walk back up the hierarchy', async ({ page }) => {
    await openExplorer(page, '?body=moon');
    const crumbs = page.getByRole('navigation', { name: 'Location' });
    await crumbs.getByRole('button', { name: 'Earth' }).click();
    await expect(page).toHaveTitle('Earth · Stargazer');
  });

  test('nearby chips navigate between siblings', async ({ page }) => {
    await openExplorer(page, '?body=mars');
    const panel = details(page, 'Mars');
    if (isPhone()) {
      // Half height, then full, where the sheet scrolls down to the row.
      await panel.getByRole('button', { name: 'Expand details' }).click();
      await panel.getByRole('button', { name: 'Expand details' }).click();
    }
    await panel.getByRole('button', { name: 'Phobos' }).click();
    await expect(page).toHaveTitle('Phobos · Stargazer');
  });

  test('details close and come back from the current crumb', async ({ page }) => {
    await openExplorer(page, '?body=jupiter');
    const panel = details(page, 'Jupiter');
    await panel.getByRole('button', { name: 'Close details' }).click();
    await expect(panel).toBeHidden();
    await page
      .getByRole('navigation', { name: 'Location' })
      .getByRole('button', { name: 'Jupiter' })
      .click();
    await expect(panel).toBeVisible();
  });

  test('compare sizes opens, compares, and closes', async ({ page }) => {
    await openExplorer(page, '?body=earth');
    const panel = details(page, 'Earth');
    if (isPhone()) await panel.getByRole('button', { name: 'Expand details' }).click();
    await panel.getByRole('button', { name: 'Compare sizes' }).click();
    const dialog = page.getByRole('dialog', { name: 'Compare sizes' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Second world').selectOption('mars');
    await expect(dialog).toContainText('Earth is');
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });

  test('time control: speed, date jump, and back to now', async ({ page }) => {
    await openExplorer(page);
    await page.locator('.readout').click();
    const sheet = page.locator('#time-sheet');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('radio', { name: '1 day' }).click();
    await expect(page.locator('.rate')).toHaveText('1 day/s');

    await sheet.getByLabel('Date and time, UTC').fill('1969-07-20T20:17');
    await sheet.getByRole('button', { name: 'Go' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.locator('.readout .date')).toHaveText('Jul 20, 1969');

    await page.locator('.readout').click();
    await sheet.getByRole('button', { name: 'Back to now' }).click();
    await expect(page.getByRole('button', { name: 'Showing live time' })).toBeVisible();
  });

  test('time sheet refuses dates outside the model range', async ({ page }) => {
    await openExplorer(page);
    const date = await page.locator('.readout .date').innerText();
    await page.locator('.readout').click();
    const sheet = page.locator('#time-sheet');
    const field = sheet.getByLabel('Date and time, UTC');
    await field.fill('1700-01-01T00:00');
    await sheet.getByRole('button', { name: 'Go' }).click();
    expect(await field.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
    await expect(sheet).toBeVisible();
    await expect(page.locator('.readout .date')).toHaveText(date);
  });

  test('settings toggle layers and hide the interface', async ({ page }) => {
    await openExplorer(page);
    await page.getByRole('button', { name: 'View settings' }).click();
    const menu = page.locator('#settings-menu');
    const grid = menu.getByRole('switch', { name: 'Reference grid' });
    await expect(grid).not.toBeChecked();
    await grid.click();
    await expect(grid).toBeChecked();

    await menu.getByRole('button', { name: 'Controls and shortcuts' }).click();
    await expect(menu.getByRole('heading', { name: 'Controls and shortcuts' })).toBeVisible();
    await menu.getByRole('button', { name: 'Back to settings' }).click();

    await menu.getByRole('button', { name: 'Hide interface' }).click();
    await expect(searchButton(page)).toBeHidden();
    await page.getByRole('button', { name: /Show interface/ }).click();
    await expect(searchButton(page)).toBeVisible();
  });

  test('solar system overview offers framing', async ({ page }) => {
    await openExplorer(page, '?body=solarSystem');
    const framing = page.getByRole('radiogroup', { name: 'Framing' });
    await framing.getByRole('radio', { name: 'All planets' }).click();
    await expect(framing.getByRole('radio', { name: 'All planets' })).toBeChecked();
  });

  test('explorer has no serious accessibility violations', async ({ page }) => {
    await openExplorer(page, '?body=mars');
    await expect(details(page, 'Mars')).toBeVisible();
    // The WebGL canvas and its positioned labels are covered by the rest of the suite.
    expect(await axeViolations(page, 'main.explorer > :not(.viewport)')).toEqual([]);
    await searchButton(page).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
    expect(await axeViolations(page, 'dialog.search')).toEqual([]);
  });
});
