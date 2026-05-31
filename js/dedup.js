export function mergeTransactions(existing, incoming) {
  const seen = new Set(existing.map(t => t.id));
  let added = 0, skipped = 0;
  const merged = existing.slice();
  for (const t of incoming) {
    if (!t.id) { skipped++; continue; }     // 无订单号的记录跳过
    if (seen.has(t.id)) { skipped++; continue; }
    seen.add(t.id); merged.push(t); added++;
  }
  return { merged, added, skipped };
}

export function isCountableExpense(t) {
  return t.direction === '支出' && t.status !== '交易关闭';
}
