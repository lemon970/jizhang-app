// 依赖全局 Papa（浏览器由 vendor 脚本注入 window.Papa；Node 测试不调用 parseAlipayCsv，故不需要）

// 纯逻辑：定位表头行，返回从表头开始的 CSV 文本
export function stripAlipayHeader(text) {
  const lines = text.split(/\r?\n/);
  const headerIdx = lines.findIndex(l => l.trimStart().startsWith('交易时间'));
  if (headerIdx === -1) throw new Error('未找到支付宝表头行');
  return lines.slice(headerIdx).join('\n');
}

// 纯逻辑：清洗单行（键名/值去空白，订单号去尾部制表符）
export function cleanRow(r) {
  const out = {};
  for (const k of Object.keys(r)) out[k.trim()] = (r[k] ?? '').trim();
  return out;
}

// 集成：完整解析，使用全局 Papa（浏览器中运行）
export function parseAlipayCsv(text) {
  const body = stripAlipayHeader(text);
  const parsed = Papa.parse(body, { header: true, skipEmptyLines: true });
  return parsed.data
    .filter(r => (r['交易时间'] || '').trim())
    .map(cleanRow);
}
