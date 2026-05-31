// 图表配色：按分类名固定映射（保证同一分类颜色恒定，不随数据顺序变化）
// 以 Wise 品牌色为锚扩展（饼图为分类数据可视化，非品牌CTA语境）
const CATEGORY_COLOR_MAP = {
  '餐饮': '#9fe870',      // Wise 主绿
  '交通': '#38c8ff',      // accent cyan
  '购物': '#ffc091',      // accent orange
  '学习教育': '#2ead4b',  // positive green
  '娱乐休闲': '#ffd11a',  // warning yellow
  '话费通讯': '#163300',  // ink deep forest
  '生活缴费': '#c5edab',  // primary neutral
  '医疗健康': '#d03238',  // negative red
  '转账': '#868685',      // mute
  '其他': '#cdffad',      // primary active
};
const FALLBACK_COLOR = '#b0b3b0';
export const colorForCategory = (name) => CATEGORY_COLOR_MAP[name] || FALLBACK_COLOR;

const INK = '#0e0f0c', MUTE = '#868685', GRID = '#e8ebe6';
let pie, trend;

export function renderCategoryPie(canvas, byCategory) {
  const labels = Object.keys(byCategory);
  const data = labels.map(k => byCategory[k]);
  const colors = labels.map(colorForCategory);
  if (pie) pie.destroy();
  pie = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{
      data,
      backgroundColor: colors,
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 6,
    }] },
    options: {
      cutout: '64%',
      animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              const total = data.reduce((a, b) => a + b, 0) || 1;
              const pct = (c.parsed / total * 100).toFixed(1);
              return ` ${c.label}：¥${c.parsed.toFixed(2)}（${pct}%）`;
            }
          }
        }
      }
    }
  });
}

export function renderTrend(canvas, byDay) {
  const labels = Object.keys(byDay).sort();
  const data = labels.map(k => byDay[k]);
  if (trend) trend.destroy();
  trend = new Chart(canvas, {
    type: 'bar',
    data: { labels: labels.map(d => d.slice(5)), datasets: [{
      label: '每日支出',
      data,
      backgroundColor: '#9fe870',
      hoverBackgroundColor: '#2ead4b',
      borderRadius: 6,
      maxBarThickness: 28,
    }] },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` ¥${c.parsed.y.toFixed(2)}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: MUTE, font: { size: 11 } } },
        y: { beginAtZero: true, grid: { color: GRID }, border: { display: false },
          ticks: { color: MUTE, font: { size: 11 } } }
      }
    }
  });
}
