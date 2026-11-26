import assert from 'node:assert/strict';
import test from 'node:test';

import { formatPlace, photoPlaceLine } from './format.ts';
import { buildReportHtml, escapeHtml } from './report.ts';

test('place lines prefer a formatted address', () => {
  assert.equal(formatPlace({ formattedAddress: ' 14 King Street, London ' }), '14 King Street, London');
  assert.equal(
    formatPlace({ streetNumber: '14', street: 'King Street', city: 'London', postalCode: 'EC1V' }),
    '14 King Street, London, EC1V',
  );
  assert.equal(photoPlaceLine(null, '14 King Street'), '14 King Street (home address)');
});

test('the report prints time, address, and a preview mark', () => {
  const html = buildReportHtml(
    {
      propertyName: 'Maple',
      propertyAddress: '14 King Street',
      title: 'Move-in',
      generatedLabel: '10 Nov 2026, 18:04',
      watermark: true,
      rooms: [
        {
          name: 'Kitchen',
          figures: [
            {
              src: 'data:image/jpeg;base64,aaaa',
              when: '10 Nov 2026, 18:04',
              place: '14 King Street, London',
              note: '<script>',
            },
          ],
        },
      ],
    },
    false,
  );
  assert.match(html, /PREVIEW/);
  assert.match(html, /14 King Street, London/);
  assert.match(html, /10 Nov 2026, 18:04/);
  assert.match(html, /Maple/);
  assert.equal(html.includes('<script>'), false);
  assert.match(html, new RegExp(escapeHtml('<script>')));
});

test('comparison report keeps both visits', () => {
  const html = buildReportHtml(
    {
      propertyName: 'Maple',
      propertyAddress: '14 King Street',
      title: 'Move-in and move-out',
      generatedLabel: '10 Nov 2026',
      watermark: false,
      rooms: [
        {
          name: 'Kitchen',
          figures: [
            { src: 'data:image/jpeg;base64,aaaa', when: '1 Jan 2026, 09:00', place: 'In', note: '' },
          ],
          companion: [
            { src: 'data:image/jpeg;base64,bbbb', when: '1 Feb 2026, 09:00', place: 'Out', note: '' },
          ],
        },
      ],
    },
    true,
  );
  assert.equal(html.includes('PREVIEW'), false);
  assert.match(html, /Move-in/);
  assert.match(html, /Move-out/);
  assert.match(html, /1 Feb 2026, 09:00/);
});
