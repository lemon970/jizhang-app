import { test } from 'node:test';
import assert from 'node:assert';
const { parseWechatRows } = await import('../js/parse-wechat.js');
import { WECHAT_ROWS } from './fixtures.js';

test('定位微信表头行并解析数据', () => {
  const rows = parseWechatRows(WECHAT_ROWS);
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0]['交易对方'], '测试外卖');
  assert.strictEqual(rows[0]['金额(元)'], 19.6);
  assert.strictEqual(rows[0]['收/支'], '支出');
});

test('交易时间保留为 Date 对象', () => {
  const rows = parseWechatRows(WECHAT_ROWS);
  assert.ok(rows[0]['交易时间'] instanceof Date);
});
