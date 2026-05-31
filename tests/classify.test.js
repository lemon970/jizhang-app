import { test } from 'node:test';
import assert from 'node:assert';
const { classify, CATEGORIES } = await import('../js/classify.js');

const base = { counterparty:'', description:'', rawCategory:'', source:'支付宝', direction:'支出' };

test('商户记忆优先级最高', () => {
  const t = { ...base, counterparty:'神秘小店', rawCategory:'餐饮美食' };
  assert.strictEqual(classify(t, { '神秘小店':'学习教育' }), '学习教育');
});

test('支付宝原始分类映射', () => {
  assert.strictEqual(classify({ ...base, rawCategory:'餐饮美食' }, {}), '餐饮');
  assert.strictEqual(classify({ ...base, rawCategory:'交通出行' }, {}), '交通');
});

test('关键词规则（微信无好分类时）', () => {
  const t = { ...base, source:'微信', counterparty:'美团', rawCategory:'商户消费' };
  assert.strictEqual(classify(t, {}), '餐饮');
});

test('地铁关键词 -> 交通', () => {
  const t = { ...base, source:'微信', counterparty:'北京轨道交通', rawCategory:'扫二维码付款' };
  assert.strictEqual(classify(t, {}), '交通');
});

test('都未命中 -> 其他', () => {
  assert.strictEqual(classify({ ...base, counterparty:'xyz', description:'zzz' }, {}), '其他');
});

test('CATEGORIES 含学生版分类', () => {
  assert.ok(CATEGORIES.includes('学习教育'));
  assert.ok(CATEGORIES.includes('人情往来'));
});
