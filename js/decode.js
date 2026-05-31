// 支付宝 CSV 为 GBK 编码；浏览器内置 TextDecoder 支持 'gbk'
export function decodeGbk(arrayBuffer) {
  return new TextDecoder('gbk').decode(new Uint8Array(arrayBuffer));
}

// 自动嗅探：UTF-8 解码若出现替换符(�)则回退 GBK
export function decodeSmart(arrayBuffer) {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
  if (utf8.includes('�')) return new TextDecoder('gbk').decode(arrayBuffer);
  return utf8;
}
