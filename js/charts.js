// 图表配色：以 Wise 品牌色为锚的分类调色板（饼图为分类数据，非品牌CTA语境）
const CATEGORY_COLORS = [
  '#9fe870', // 餐饮 - Wise 主绿
  '#38c8ff', // 交通 - accent cyan
  '#ffc091', // 购物 - accent orange
  '#2ead4b', // 学习教育 - positive green
  '#ffd11a', // 娱乐休闲 - warning yellow
  '#163300', // 话费通讯 - ink deep forest
  '#c5edab', // 生活缴费 - primary neutral
  '#d03238', // 医疗健康 - negative red
  '#868685', // 人情往来 - mute
  '#cdffad', // 其他 - primary active
];

const INK = '#0e0f0c', MUTE = '#868685', GRID = '#e8ebe6';
let pie, trend;

export function renderCategoryPie(canvas, byCategory) {
  const labels = Object.keys(byCategory);
  const data = labels.map(k => byCategory[k]);
  if (pie) pie.destroy();
  pie = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{
      data,
      backgroundColor: CATEGORY_COLORS,
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 6,
    }] },
    options: {
      cutout: '62%',
      plugins: {
        legend: {
          position: 'right',
          labels: { color: INK, font: { family: 'Inter, system-ui', size: 13 },
            boxWidth: 12, boxHeight: 12, padding: 10, usePointStyle: true, pointStyle: 'circle' }
        },
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
