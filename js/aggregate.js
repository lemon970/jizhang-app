import { isCountableExpense } from './dedup.js';

export function summarize(transactions, range) {
  const inRange = t => {
    const d = t.datetime.slice(0, 10);
    return (!range?.start || d >= range.start) && (!range?.end || d <= range.end);
  };
  const s = { totalExpense: 0, totalIncome: 0, net: 0, count: 0,
    byCategory: {}, byDay: {}, topExpenses: [] };
  const expenses = [];
  for (const t of transactions) {
    if (!inRange(t)) continue;
    if (isCountableExpense(t)) {
      s.totalExpense += t.amount;
      s.count += 1;
      const cat = t.myCategory || '其他';
      s.byCategory[cat] = (s.byCategory[cat] || 0) + t.amount;
      const day = t.datetime.slice(0, 10);
      s.byDay[day] = (s.byDay[day] || 0) + t.amount;
      expenses.push(t);
    } else if (t.direction === '收入') {
      s.totalIncome += t.amount;
    }
  }
  // 大额支出 Top5（金额降序）
  s.topExpenses = expenses.sort((a, b) => b.amount - a.amount).slice(0, 5);
  // 浮点修正
  s.totalExpense = Math.round(s.totalExpense * 100) / 100;
  s.totalIncome = Math.round(s.totalIncome * 100) / 100;
  s.net = Math.round((s.totalIncome - s.totalExpense) * 100) / 100;
  return s;
}

// 上一个月的范围（用于环比）。传入 {start:'2026-05-01'} -> 返回 2026-04 的范围
export function prevMonthRange(range) {
  if (!range?.start) return null;
  const [y, m] = range.start.slice(0, 7).split('-').map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  const ym = `${py}-${String(pm).padStart(2, '0')}`;
  return { start: `${ym}-01`, end: `${ym}-31`, label: ym };
}

// 搜索匹配：跨"对方/商品/备注/分类/金额"字段做包含匹配。空查询全通过。
export function matchesSearch(t, query) {
  if (!query) return true;
  const s = String(query).trim().toLowerCase();
  if (!s) return true;
  const fields = [t.counterparty, t.description, t.note, t.myCategory, String(t.amount)];
  return fields.some(f => String(f ?? '').toLowerCase().includes(s));
}

// 按"交易对方"汇总，返回 [{counterparty, total, count, items}]，按金额降序。
export function groupByCounterparty(transactions) {
  const map = new Map();
  for (const t of transactions) {
    const key = t.counterparty || '（未填对方）';
    if (!map.has(key)) map.set(key, {
      counterparty: key,
      total: 0,
      expense: 0,
      income: 0,
      net: 0,
      count: 0,
      expenseCount: 0,
      incomeCount: 0,
      neutralCount: 0,
      items: []
    });
    const g = map.get(key);
    if (isCountableExpense(t)) {
      g.expense += t.amount;
      g.expenseCount += 1;
    } else if (t.direction === '收入') {
      g.income += t.amount;
      g.incomeCount += 1;
    } else {
      g.neutralCount += 1;
    }
    g.count += 1; g.items.push(t);
  }
  const groups = [...map.values()];
  for (const g of groups) {
    g.expense = Math.round(g.expense * 100) / 100;
    g.income = Math.round(g.income * 100) / 100;
    g.net = Math.round((g.income - g.expense) * 100) / 100;
    g.total = g.expense;
  }
  return groups.sort((a, b) => b.expense - a.expense || b.income - a.income);
}

export function buildPeriodTable(transactions, mode = 'month') {
  const len = mode === 'year' ? 4 : 7;
  const map = new Map();
  for (const t of transactions) {
    const period = String(t.datetime || '').slice(0, len);
    if (!period) continue;
    if (!map.has(period)) map.set(period, {
      period,
      expense: 0,
      income: 0,
      net: 0,
      expenseCount: 0,
      incomeCount: 0,
      count: 0
    });
    const row = map.get(period);
    if (isCountableExpense(t)) {
      row.expense += t.amount;
      row.expenseCount += 1;
    } else if (t.direction === '收入') {
      row.income += t.amount;
      row.incomeCount += 1;
    }
    row.count += 1;
  }
  return [...map.values()].map(row => ({
    ...row,
    expense: Math.round(row.expense * 100) / 100,
    income: Math.round(row.income * 100) / 100,
    net: Math.round((row.income - row.expense) * 100) / 100
  })).sort((a, b) => b.period.localeCompare(a.period));
}
