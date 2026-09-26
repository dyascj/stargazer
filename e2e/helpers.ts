import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const PLANETS = [
  'Sun',
  'Mercury',
  'Venus',
  'Earth',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune'
];

/** Phones and tablets, where the layout, gestures, and target sizes differ. */
export const isTouch = () => !!test.info().project.use.hasTouch;
/** The portrait phone layout: bottom sheet, icon-only search. */
export const isPhone = () => isTouch() && (test.info().project.use.viewport?.width ?? 0) < 640;

/** Fails the test on any uncaught page error. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return () => expect(errors, 'uncaught page errors').toEqual([]);
}

/** A fixed launch schedule, so the Launches tab never depends on the upstream API. */
export async function mockLaunches(page: Page) {
  await page.route('**/api/launches', (route) =>
    route.fulfill({
      json: {
        stale: false,
        fetchedAt: Date.UTC(2026, 8, 25),
        launches: [
          {
            id: 'test-launch',
            name: 'Falcon 9 | Test Mission',
            provider: 'SpaceX',
            pad: 'SLC-40, Cape Canaveral',
            date: '2026-10-01T12:00:00Z',
            status: 'Go for Launch'
          }
        ]
      }
    })
  );
}

/** Opens the explorer and waits for the chrome to settle in after the intro. */
export async function openExplorer(page: Page, search = '') {
  await mockLaunches(page);
  await page.goto(`/app${search}`);
  await expect(page.locator('main.explorer:not(.intro)')).toBeAttached({ timeout: 30_000 });
  await expect(searchButton(page)).toBeVisible();
}

export const searchButton = (page: Page) =>
  page.getByRole('button', { name: 'Search planets, moons, spacecraft' });

/** The details panel: a bottom sheet on phones, a card elsewhere. */
export const details = (page: Page, name: string) =>
  page.getByLabel(`${name} details`, { exact: true });

export async function searchFor(page: Page, query: string, option: string) {
  await searchButton(page).click();
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('combobox').fill(query);
  await dialog
    .getByRole('option', { name: new RegExp(`^${option}`) })
    .first()
    .click();
  await expect(dialog).toBeHidden();
}

/** Serious and critical axe findings. Contrast is tracked separately against the design tokens. */
export async function axeViolations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .disableRules(['color-contrast']);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      id: violation.id,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target.join(' ')).slice(0, 5)
    }));
}

/**
 * A real one-finger swipe through Chromium's touch pipeline, so native scrolling and
 * touch-action apply exactly as on a phone. WebKit cannot synthesize this.
 */
export async function swipe(page: Page, target: Locator, dx: number, dy: number) {
  const box = await target.boundingBox();
  if (!box) throw new Error('swipe target is not visible');
  const client = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const steps = 12;
  const point = (i: number) => [{ x: x + (dx * i) / steps, y: y + (dy * i) / steps }];
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(0) });
  for (let i = 1; i <= steps; i++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(i) });
    await page.waitForTimeout(16);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}
