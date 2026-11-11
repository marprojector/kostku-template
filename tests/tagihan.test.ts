import { test, expect } from 'node:test';
import assert from 'node:assert/strict';
import { hitungJatuhTempo } from '../src/lib/tagihan';

test('hitungJatuhTempo normal case', () => {
  const result = hitungJatuhTempo('2024-01-15', '2024-01');
  assert.strictEqual(result, '2024-02-15');
});

test('hitungJatuhTempo Desember ke Januari', () => {
  const result = hitungJatuhTempo('2024-12-20', '2024-12');
  assert.strictEqual(result, '2025-01-20');
});

test('hitungJatuhTempo 31 Feb clamp to 28', () => {
  const result = hitungJatuhTempo('2025-01-31', '2025-01');
  assert.strictEqual(result, '2025-02-28');
});

test('hitungJatuhTempo leap year 2028', () => {
  const result = hitungJatuhTempo('2028-02-29', '2028-02');
  assert.strictEqual(result, '2028-03-29');
});

test('hitungJatuhTempo periode Januari', () => {
  const result = hitungJatuhTempo('2024-01-05', '2024-01');
  assert.strictEqual(result, '2024-02-05');
});

test('hitungJatuhTempo 29 Feb case', () => {
  const result = hitungJatuhTempo('2024-02-29', '2024-02');
  assert.strictEqual(result, '2024-03-29');
});