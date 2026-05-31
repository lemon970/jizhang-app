function mapDirection(raw) {
  if (raw === '支出') return '支出';
  if (raw === '收入') return '收入';
  return '中性'; // 不计收支 / 中性交易
}

function toIso(v) {
  if (v instanceof Date) {
    const p = n => String(n).padStart(2, '0');
    return `${v.getFullYear()}-${p(v.getMonth()+1)}-${p(v.getDate())}` +
           `T${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`;
  }
  return String(v).trim().replace(' ', 'T');
}

export function normalizeAlipay(r) {
  return {
    id: String(r['交易订单号']).trim(),
    source: '支付宝',
    datetime: toIso(r['交易时间']),
    amount: parseFloat(r['金额']) || 0,
    direction: mapDirection(r['收/支']),
    counterparty: r['交易对方'] || '',
    description: r['商品说明'] || '',
    rawCategory: r['交易分类'] || '',
    myCategory: '',
    status: r['交易状态'] || '',
    payMethod: r['收/付方式'] || '',
    note: r['备注'] || ''
  };
}

export function normalizeWechat(r) {
  return {
    id: String(r['交易单号']).trim(),
    source: '微信',
    datetime: toIso(r['交易时间']),
    amount: parseFloat(r['金额(元)']) || 0,
    direction: mapDirection(r['收/支']),
    counterparty: r['交易对方'] || '',
    description: r['商品'] || '',
    rawCategory: r['交易类型'] || '',
    myCategory: '',
    status: r['当前状态'] || '',
    payMethod: r['支付方式'] || '',
    note: r['备注'] || ''
  };
}
