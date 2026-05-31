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
