import { test } from 'node:test';
import assert from 'node:assert';
const { summarize, prevMonthRange, matchesSearch, groupByCounterparty } = await import('../js/aggregate.js');

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

test('topExpenses 按金额降序取大额支出（不含中性/废单）', () => {
  const s = summarize(txns, { start:'2026-05-01', end:'2026-05-31' });
  assert.strictEqual(s.topExpenses[0].amount, 30);
  assert.strictEqual(s.topExpenses[1].amount, 20);
  assert.strictEqual(s.topExpenses[2].amount, 5);
  // 废单(99,交易关闭)与中性(500)都不应出现
  assert.ok(!s.topExpenses.some(t => t.amount === 99 || t.amount === 500));
});

test('count 统计计入消费的笔数', () => {
  const s = summarize(txns, { start:'2026-05-01', end:'2026-05-31' });
  assert.strictEqual(s.count, 3);
});

test('matchesSearch 跨字段包含匹配，空查询全通过', () => {
  const t = { counterparty:'美团', description:'午餐', note:'', myCategory:'餐饮', amount:21.92 };
  assert.strictEqual(matchesSearch(t, ''), true);
  assert.strictEqual(matchesSearch(t, '美团'), true);
  assert.strictEqual(matchesSearch(t, '午餐'), true);
  assert.strictEqual(matchesSearch(t, '餐饮'), true);
  assert.strictEqual(matchesSearch(t, '21.9'), true);
  assert.strictEqual(matchesSearch(t, '肯德基'), false);
});

test('groupByCounterparty 按对方汇总并按金额降序', () => {
  const list = [
    { counterparty:'美团', amount:20 },
    { counterparty:'食堂', amount:5 },
    { counterparty:'美团', amount:30 },
  ];
  const groups = groupByCounterparty(list);
  assert.strictEqual(groups.length, 2);
  assert.strictEqual(groups[0].counterparty, '美团');
  assert.strictEqual(groups[0].total, 50);
  assert.strictEqual(groups[0].count, 2);
  assert.strictEqual(groups[1].counterparty, '食堂');
  assert.strictEqual(groups[1].total, 5);
});
