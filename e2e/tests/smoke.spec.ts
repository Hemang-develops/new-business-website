import { test, expect } from '@playwright/test';

test('basic smoke: root loads and has offerings or main content', async ({ page, baseURL }) => {
  const response = await page.goto('/');
  // page.goto may return null in some contexts; assert load via content check
  if (response) {
    expect(response.ok()).toBeTruthy();
  }

  await page.waitForLoadState('networkidle');
  const content = await page.content();
  // Basic heuristic checks to ensure we loaded an app page
  expect(content.length).toBeGreaterThan(100);
});
