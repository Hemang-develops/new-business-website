import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.PLAYWRIGHT_SUPA_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON = process.env.PLAYWRIGHT_ANON || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const FULFILLMENT_SECRET = process.env.FULFILLMENT_SECRET;

test.describe('API & Fulfillment checks', () => {
  test('catalog tables return sections and offerings', async () => {
    test.skip(!SUPA_URL || !ANON, 'Missing Supabase URL or anon key in environment');
    const client = createClient(SUPA_URL, ANON);
    const { data: sections, error: sErr } = await client.from('storefront_sections').select('id,title').limit(5);
    expect(sErr).toBeNull();
    expect(Array.isArray(sections)).toBeTruthy();
    expect((sections || []).length).toBeGreaterThanOrEqual(0);

    const { data: offerings, error: oErr } = await client.from('storefront_offerings').select('id,title').limit(5);
    expect(oErr).toBeNull();
    expect(Array.isArray(offerings)).toBeTruthy();
    expect((offerings || []).length).toBeGreaterThanOrEqual(0);
  });

  test('invoke course-access-fulfill when secret provided', async ({ request }) => {
    test.skip(!FULFILLMENT_SECRET || !SUPA_URL, 'Missing FULFILLMENT_SECRET or SUPABASE URL');
    const offeringId = 'test-offering';
    const payload = {
      productId: offeringId,
      customerEmail: `e2e+${Date.now()}@example.com`,
      provider: 'playwright-test',
      amount: 0,
      currency: 'usd',
      customerName: 'E2E Test',
    };

    const url = `${SUPA_URL.replace(/\/$/, '')}/functions/v1/course-access-fulfill`;
    const res = await request.post(url, {
      headers: {
        Authorization: `Bearer ${FULFILLMENT_SECRET}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    });

    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(300);
    const body = await res.json().catch(() => null);
    expect(body).not.toBeNull();
  });
});
