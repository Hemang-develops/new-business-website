import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeRichText } from './sanitizeRichText.js';

test('strips script and event-handler HTML from rich text', () => {
  const html = '<p>Hello</p><script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)" onclick="alert(4)">Link</a>';

  const result = sanitizeRichText(html);

  assert.doesNotMatch(result, /<script/i);
  assert.doesNotMatch(result, /onerror=/i);
  assert.doesNotMatch(result, /onclick=/i);
  assert.doesNotMatch(result, /javascript:/i);
  assert.match(result, /<p>Hello<\/p>/i);
  assert.match(result, /<a/i);
});
