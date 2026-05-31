import { isCountableExpense } from './dedup.js';

export function summarize(transactions, range) {
  const inRange = t => {
    const d = t.datetime.slice(0, 10);
    return (!range?.start || d >= range.start) && (!range?.end || d <= range.end);
  };
  const s = { totalExpense: 0, totalIncome: 0, net: 0, byCategory: {}, byDay: {} };
  for (const t of transactions) {
    if (!inRange(t)) continue;
    if (isCountableExpense(t)) {
      s.totalExpense += t.amount;
      const cat = t.myCategory || '其他';
      s.byCategory[cat] = (s.byCategory[cat] || 0) + t.amount;
      const day = t.datetime.slice(0, 10);
      s.byDay[day] = (s.byDay[day] || 0) + t.amount;
    } else if (t.direction === '收入') {
      s.totalIncome += t.amount;
    }
  }
  // 浮点修正
  s.totalExpense = Math.round(s.totalExpense * 100) / 100;
  s.totalIncome = Math.round(s.totalIncome * 100) / 100;
  s.net = Math.round((s.totalIncome - s.totalExpense) * 100) / 100;
  return s;
}
