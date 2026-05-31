import { test } from 'node:test';
import assert from 'node:assert';
const { mergeTransactions, isCountableExpense } = await import('../js/dedup.js');

const mk = (id, dir='支出', status='交易成功', amount=10) =>
  ({ id, direction:dir, status, amount, source:'支付宝' });

test('按 id 去重，返回新增与跳过计数', () => {
  const existing = [mk('A'), mk('B')];
  const incoming = [mk('B'), mk('C')]; // B 重复
  const { merged, added, skipped } = mergeTransactions(existing, incoming);
  assert.strictEqual(merged.length, 3);
  assert.strictEqual(added, 1);
  assert.strictEqual(skipped, 1);
});

test('计入消费：仅支出且非交易关闭', () => {
  assert.strictEqual(isCountableExpense(mk('X','支出','交易成功')), true);
  assert.strictEqual(isCountableExpense(mk('X','支出','交易关闭')), false);
  assert.strictEqual(isCountableExpense(mk('X','中性','交易成功')), false);
  assert.strictEqual(isCountableExpense(mk('X','收入','交易成功')), false);
});
