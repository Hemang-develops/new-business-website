#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPA_URL || !ANON) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const client = createClient(SUPA_URL, ANON);
const admin = SERVICE ? createClient(SUPA_URL, SERVICE) : null;

const randomSuffix = Date.now();
const testEmail = `smoke+${randomSuffix}@example.com`;
const testPassword = 'Test1234!';

async function signup() {
  console.log('\n== Auth: sign-up test ==');
  try {
    const { data, error } = await client.auth.signUp({ email: testEmail, password: testPassword });
    if (error) {
      console.error('Sign-up error:', error.message || error);
      return { ok: false, error };
    }
    console.log('Sign-up result: user id=', data?.user?.id || 'created (email confirm may be required)');
    return { ok: true, data };
  } catch (err) {
    console.error('Sign-up exception:', err.message || err);
    return { ok: false, error: err };
  }
}

async function fetchCatalog() {
  console.log('\n== Catalog: fetch sections and offerings ==');
  try {
    const { data: sections, error: sErr } = await client.from('storefront_sections').select('id,title').limit(5);
    if (sErr) {
      console.error('Sections query error:', sErr.message || sErr);
    } else {
      console.log('Sections found:', (sections || []).length);
    }

    const { data: offerings, error: oErr } = await client.from('storefront_offerings').select('id,title').limit(5);
    if (oErr) {
      console.error('Offerings query error:', oErr.message || oErr);
    } else {
      console.log('Offerings found:', (offerings || []).length);
    }

    return { sections, offerings };
  } catch (err) {
    console.error('Catalog fetch exception:', err.message || err);
    return null;
  }
}

async function simulateFulfillment(offerings) {
  if (!admin) {
    console.log('\nNo SUPABASE_SERVICE_ROLE_KEY available locally; skipping fulfillment simulation.');
    return;
  }
  const offeringId = offerings?.[0]?.id;
  if (!offeringId) {
    console.log('No offering id available to simulate fulfillment.');
    return;
  }

  console.log(`\n== Fulfillment: invoke course-access-fulfill for offering ${offeringId} ==`);
  try {
    const payload = {
      productId: offeringId,
      email: testEmail,
      userId: null,
      stripeSessionId: `test_${randomSuffix}`,
      provider: 'test',
      amount: 0,
      currency: 'usd',
      customerName: 'Smoke Test',
    };
    const res = await admin.functions.invoke('course-access-fulfill', { body: payload });
    console.log('Fulfillment invoke raw response:', res);
    // Log structured fields that the client may return
    if (res && typeof res === 'object') {
      if ('status' in res) console.log('Fulfillment status:', res.status);
      if ('error' in res && res.error) console.error('Fulfillment error:', res.error);
      if ('data' in res) console.log('Fulfillment data:', res.data);
    }
    // If the response supports reading text (Response-like), attempt to read it for additional detail
    try {
      if (typeof res.text === 'function') {
        const text = await res.text();
        if (text) console.log('Fulfillment response body (text):', text);
      }
    } catch (e) {
      console.error('Error reading fulfillment response text:', e && e.message ? e.message : e);
    }
  } catch (err) {
    console.error('Fulfillment invoke error:', err.message || err);
  }
}

async function main() {
  console.log('Running smoke tests against', SUPA_URL);
  const signupRes = await signup();
  const catalog = await fetchCatalog();
  if (catalog && catalog.offerings && catalog.offerings.length) {
    await simulateFulfillment(catalog.offerings);
  }
  console.log('\nSmoke tests complete. Review output above for any failures.');
}

main().catch((err) => {
  console.error('Fatal error running smoke tests:', err);
  process.exit(1);
});
