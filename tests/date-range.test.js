import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDatePart, validDateRange, dateHeading } from '../src/date-range.js';

const today = { y: 2026, m: 11, d: 8 };

test('two year selections produce a searchable January 1 range', () => {
  const start = selectDatePart(today, 'year', 2024, today);
  const end = selectDatePart(today, 'year', 2026, today);
  assert.deepEqual(start, { y: 2024, m: 1, d: 1 });
  assert.deepEqual(end, { y: 2026, m: 1, d: 1 });
  assert.equal(validDateRange([start, end]), true);
  assert.equal(dateHeading(end), '2026년 1월 1일');
});

test('a directly selected end day updates its full heading', () => {
  const end = selectDatePart({ y: 2026, m: 2, d: 1 }, 'day', 18, today);
  assert.equal(dateHeading(end), '2026년 2월 18일');
});

test('changing year replaces the previous month and day', () => {
  const date = selectDatePart({ y: 2024, m: 12, d: 31 }, 'year', 2025, today);
  assert.deepEqual(date, { y: 2025, m: 1, d: 1 });
  assert.equal(dateHeading(date), '2025년 1월 1일');
});

test('changing month starts at day 1 and selecting a day refines it', () => {
  const month = selectDatePart({ y: 2024, m: 1, d: 31 }, 'month', 2, today);
  assert.deepEqual(month, { y: 2024, m: 2, d: 1 });
  assert.deepEqual(selectDatePart(month, 'day', 29, today), { y: 2024, m: 2, d: 29 });
});

test('missing or reversed endpoints cannot be searched', () => {
  const start = { y: 2026, m: 2, d: 18 };
  assert.equal(validDateRange([null, null]), false);
  assert.equal(validDateRange([start, null]), false);
  assert.equal(validDateRange([start, { y: 2026, m: 1, d: 1 }]), false);
  assert.equal(validDateRange([start, start]), true);
  assert.equal(dateHeading(null), '날짜를 선택해 주세요');
});

test('future and nonexistent dates are rejected', () => {
  assert.equal(selectDatePart(today, 'year', 2027, today), null);
  assert.equal(selectDatePart(today, 'month', 12, today), null);
  assert.equal(selectDatePart({ y: 2025, m: 2, d: 1 }, 'day', 29, today), null);
  assert.equal(selectDatePart(today, 'year', 1989, today), null);
});
