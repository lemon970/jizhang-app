import { test } from 'node:test';
import assert from 'node:assert';
const { normalizeAlipay, normalizeWechat } = await import('../js/normalize.js');

test('支付宝归一：方向/金额/来源/ISO时间', () => {
  const t = normalizeAlipay({
    '交易时间':'2026-05-30 20:17:08','交易分类':'餐饮美食','交易对方':'商户A',
    '商品说明':'午餐','收/支':'支出','金额':'21.92','收/付方式':'中国银行',
    '交易状态':'交易成功','交易订单号':'ALI0001','备注':''
  });
  assert.strictEqual(t.source, '支付宝');
  assert.strictEqual(t.amount, 21.92);
  assert.strictEqual(t.direction, '支出');
  assert.strictEqual(t.id, 'ALI0001');
  assert.strictEqual(t.datetime, '2026-05-30T20:17:08');
});

test('支付宝不计收支 -> 中性', () => {
  const t = normalizeAlipay({'交易时间':'2026-05-28 12:00:00','收/支':'不计收支',
    '金额':'500.00','交易订单号':'ALI0003','交易分类':'','交易对方':'','商品说明':'',
    '收/付方式':'','交易状态':'交易成功','备注':''});
  assert.strictEqual(t.direction, '中性');
});

test('微信归一：Date转ISO，中性交易->中性', () => {
  const t = normalizeWechat({
    '交易时间':new Date('2026-05-31T12:48:45'),'交易类型':'商户消费','交易对方':'外卖',
    '商品':'订单','收/支':'支出','金额(元)':19.6,'支付方式':'零钱',
    '当前状态':'支付成功','交易单号':'WX0001','备注':'/'
  });
  assert.strictEqual(t.source, '微信');
  assert.strictEqual(t.amount, 19.6);
  assert.strictEqual(t.datetime, '2026-05-31T12:48:45');
});
