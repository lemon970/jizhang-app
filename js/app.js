import { decodeSmart } from './decode.js';
import { parseAlipayCsv } from './parse-alipay.js';
import { readWechatFile, parseWechatRows } from './parse-wechat.js';
import { normalizeAlipay, normalizeWechat } from './normalize.js';
import { mergeTransactions } from './dedup.js';
import { classify, CATEGORIES } from './classify.js';
import { summarize } from './aggregate.js';
import { renderCategoryPie, renderTrend } from './charts.js';
import {
  saveTransactions, loadAllTransactions, saveMemory, loadMemory,
  clearAllData, exportBackup, importBackup
} from './storage.js';

// ===== 状态 =====
let transactions = [];
let memory = {};
let range = currentMonthRange();

function currentMonthRange() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return { start: `${ym}-01`, end: `${ym}-31`, label: ym };
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ===== 文件 -> 交易 =====
async function fileToTransactions(file) {
  if (file.name.endsWith('.csv')) {
    const text = decodeSmart(await file.arrayBuffer());
    return parseAlipayCsv(text).map(normalizeAlipay);
  }
  if (file.name.endsWith('.xlsx')) {
    const rows = await readWechatFile(file);
    return parseWechatRows(rows).map(normalizeWechat);
  }
  throw new Error('不支持的文件类型：' + file.name);
}

function classifyAll() {
  for (const t of transactions) t.myCategory = classify(t, memory);
}

// ===== 标签切换 =====
function switchView(name) {
  document.querySelectorAll('.tab').forEach(b =>
    b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach(v =>
    v.classList.toggle('active', v.id === `view-${name}`));
}
document.getElementById('tabs').addEventListener('click', e => {
  if (e.target.classList.contains('tab')) switchView(e.target.dataset.view);
});

// ===== 导入 =====
async function onFiles(files) {
  const msg = document.getElementById('importMsg');
  msg.className = 'import-msg';
  try {
    let incoming = [];
    for (const f of files) incoming.push(...await fileToTransactions(f));
    const { merged, added, skipped } = mergeTransactions(transactions, incoming);
    transactions = merged;
    classifyAll();
    await saveTransactions(transactions);
    refreshAll();
    msg.textContent = `本次新增 ${added} 条，去重跳过 ${skipped} 条，共 ${transactions.length} 条。`;
    msg.classList.add('ok');
    switchView('overview');
  } catch (err) {
    msg.textContent = '导入失败：' + err.message;
    msg.classList.add('error');
  }
}
document.getElementById('fileInput').addEventListener('change', e => onFiles(e.target.files));

// ===== 明细表格 =====
function filteredTransactions() {
  const src = document.getElementById('filterSource').value;
  const cat = document.getElementById('filterCategory').value;
  const onlyUncat = document.getElementById('onlyUncat').checked;
  return transactions.filter(t =>
    (!src || t.source === src) &&
    (!cat || t.myCategory === cat) &&
    (!onlyUncat || t.myCategory === '其他'));
}

function renderTable() {
  const tbody = document.querySelector('#txnTable tbody');
  const empty = document.getElementById('tableEmpty');
  const rows = filteredTransactions()
    .sort((a, b) => b.datetime.localeCompare(a.datetime));
  document.getElementById('detailCount').textContent = `${rows.length} 条`;
  empty.hidden = rows.length > 0;
  tbody.innerHTML = rows.map(t => {
    const opts = CATEGORIES.map(c =>
      `<option value="${c}"${c === t.myCategory ? ' selected' : ''}>${c}</option>`).join('');
    const hl = t.myCategory === '其他' ? ' class="hl"' : '';
    return `<tr${hl}>
      <td>${esc(t.datetime.replace('T', ' ').slice(5))}</td>
      <td>${esc(t.source)}</td>
      <td class="num">${t.amount.toFixed(2)}</td>
      <td>${esc(t.counterparty)}</td>
      <td>${esc(t.description)}</td>
      <td><select class="cat-select" data-id="${esc(t.id)}">${opts}</select></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('.cat-select').forEach(sel =>
    sel.addEventListener('change', onChangeCategory));
}

async function onChangeCategory(e) {
  const id = e.target.dataset.id, cat = e.target.value;
  const t = transactions.find(x => x.id === id);
  if (!t) return;
  memory[t.counterparty] = cat;
  await saveMemory(t.counterparty, cat);
  // 同商户的所有记录一并更新
  const touched = [];
  for (const o of transactions)
    if (o.counterparty === t.counterparty) { o.myCategory = cat; touched.push(o); }
  await saveTransactions(touched);
  refreshAll();
}

function populateCategoryFilter() {
  const sel = document.getElementById('filterCategory');
  const cur = sel.value;
  sel.innerHTML = '<option value="">全部分类</option>' +
    CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  sel.value = cur;
}
['filterSource', 'filterCategory', 'onlyUncat'].forEach(id =>
  document.getElementById(id).addEventListener('change', renderTable));

// ===== 仪表盘 =====
function refreshDashboard() {
  const s = summarize(transactions, range);
  document.getElementById('sumExpense').textContent = '¥' + s.totalExpense.toFixed(2);
  document.getElementById('sumIncome').textContent = '¥' + s.totalIncome.toFixed(2);
  document.getElementById('sumNet').textContent = '¥' + s.net.toFixed(2);
  document.getElementById('rangeLabel').textContent = range.label === '全部' ? '全部时间' : range.label;
  const hasData = Object.keys(s.byCategory).length > 0;
  document.getElementById('pieEmpty').hidden = hasData;
  document.getElementById('pieChart').style.display = hasData ? '' : 'none';
  if (hasData) renderCategoryPie(document.getElementById('pieChart'), s.byCategory);
  renderTrend(document.getElementById('trendChart'), s.byDay);
}

document.getElementById('monthPick').addEventListener('change', e => {
  const ym = e.target.value;
  if (!ym) return;
  range = { start: `${ym}-01`, end: `${ym}-31`, label: ym };
  refreshDashboard();
});
document.getElementById('allRange').addEventListener('click', () => {
  range = { start: null, end: null, label: '全部' };
  refreshDashboard();
});

function refreshAll() {
  populateCategoryFilter();
  renderTable();
  refreshDashboard();
}

// ===== 备份 / 清空 =====
document.getElementById('exportBtn').addEventListener('click', exportBackup);
document.getElementById('importBackup').addEventListener('change', async e => {
  if (!e.target.files[0]) return;
  await importBackup(e.target.files[0]);
  memory = await loadMemory();
  transactions = await loadAllTransactions();
  classifyAll();
  await saveTransactions(transactions);
  refreshAll();
  switchView('overview');
});
document.getElementById('clearBtn').addEventListener('click', async () => {
  if (!confirm('确定清空所有账单与商户记忆？此操作不可撤销。')) return;
  await clearAllData();
  transactions = []; memory = {};
  refreshAll();
});

// ===== 启动 =====
(async () => {
  document.getElementById('monthPick').value = range.label;
  memory = await loadMemory();
  transactions = await loadAllTransactions();
  classifyAll();
  refreshAll();
})();

// ===== Service Worker =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./sw.js').catch(console.error));
}
