// 图表配色：按分类名固定映射（同一分类颜色恒定）
// 暖莫兰迪色系：低饱和、暖调，呼应陶土点缀与暖白底（编辑风 B）
const CATEGORY_COLOR_MAP = {
  '餐饮': '#c47a5a',      // 暖陶土
  '交通': '#8a9a8c',      // 暖鼠尾草
  '购物': '#c9a07a',      // 沙驼
  '学习教育': '#9a8c9e',  // 暖藕灰
  '娱乐休闲': '#d0a96a',  // 金沙
  '话费通讯': '#7e9690',  // 暖灰青
  '生活缴费': '#a8a182',  // 橄榄卡其
  '医疗健康': '#bd8a8a',  // 灰玫
  '转账': '#a7a39c',      // 暖灰
  '其他': '#cfc6b8',      // 浅暖灰
};
const FALLBACK_COLOR = '#cfc6b8';
export const colorForCategory = (name) => CATEGORY_COLOR_MAP[name] || FALLBACK_COLOR;

const INK = '#1a1a1a', MUTE = '#9b9b96', GRID = '#e8e8e2';
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
      backgroundColor: '#2a2a28',
      hoverBackgroundColor: '#c2603f',
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
