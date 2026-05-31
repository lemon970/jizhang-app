import { test } from 'node:test';
import assert from 'node:assert';
const { summarize } = await import('../js/aggregate.js');

const txns = [
  { datetime:'2026-05-01T10:00:00', amount:20, direction:'支出', status:'交易成功', myCategory:'餐饮' },
  { datetime:'2026-05-01T12:00:00', amount:5,  direction:'支出', status:'交易成功', myCategory:'交通' },
  { datetime:'2026-05-02T09:00:00', amount:30, direction:'支出', status:'交易成功', myCategory:'餐饮' },
  { datetime:'2026-05-02T09:30:00', amount:99, direction:'支出', status:'交易关闭', myCategory:'购物' }, // 废单不计
  { datetime:'2026-05-02T10:00:00', amount:500,direction:'中性', status:'交易成功', myCategory:'其他' }, // 中性不计
  { datetime:'2026-05-03T10:00:00', amount:200,direction:'收入', status:'交易成功', myCategory:'其他' },
];

test('总支出只计可计入消费', () => {
  const s = summarize(txns, { start:'2026-05-01', end:'2026-05-31' });
  assert.strictEqual(s.totalExpense, 55);   // 20+5+30
  assert.strictEqual(s.totalIncome, 200);
});

test('分类汇总', () => {
  const s = summarize(txns, { start:'2026-05-01', end:'2026-05-31' });
  assert.strictEqual(s.byCategory['餐饮'], 50);
  assert.strictEqual(s.byCategory['交通'], 5);
  assert.strictEqual(s.byCategory['购物'], undefined); // 废单未计
});

test('按日汇总', () => {
  const s = summarize(txns, { start:'2026-05-01', end:'2026-05-31' });
  assert.strictEqual(s.byDay['2026-05-01'], 25);
  assert.strictEqual(s.byDay['2026-05-02'], 30);
});

test('时间范围过滤', () => {
  const s = summarize(txns, { start:'2026-05-02', end:'2026-05-02' });
  assert.strictEqual(s.totalExpense, 30);
});
