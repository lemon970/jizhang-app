import { test } from 'node:test';
import assert from 'node:assert';
const { stripAlipayHeader, cleanRow } = await import('../js/parse-alipay.js');
import { ALIPAY_CSV_TEXT } from './fixtures.js';

test('定位表头行：丢弃前面的说明行，返回以表头开头的文本', () => {
  const body = stripAlipayHeader(ALIPAY_CSV_TEXT);
  assert.ok(body.startsWith('交易时间,交易分类'));
});

test('找不到表头时抛错', () => {
  assert.throws(() => stripAlipayHeader('没有表头的文本'), /未找到支付宝表头行/);
});

test('cleanRow 去除键名与值的空白、订单号尾部制表符', () => {
  const r = cleanRow({ '交易订单号': 'ALI0001\t', ' 金额 ': ' 21.92 ' });
  assert.strictEqual(r['交易订单号'], 'ALI0001');
  assert.strictEqual(r['金额'], '21.92');
});
