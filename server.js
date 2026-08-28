// ==========================================
// REPORT MODAL CONTROLLERS & DATA CALCULATIONS
// ==========================================

// Initial State Variables (Ensure these exist)
let activeSalesPeriod = 'daily';
let activeStockPeriod = 'daily';
let salesData = [];
let stockData = [];

// DOM Elements - Modals & Buttons
const salesReportModal = document.getElementById('sales-report-modal');
const stockReportModal = document.getElementById('stock-report-modal');
const metricDetailsModal = document.getElementById('metric-details-modal');

const btnOpenSalesReport = document.getElementById('btn-open-sales-report');
const btnCloseSalesReport = document.getElementById('btn-close-sales-report');
const btnOpenStockReport = document.getElementById('btn-open-stock-report');
const btnCloseStockReport = document.getElementById('btn-close-stock-report');
const btnCloseMetricDetails = document.getElementById('btn-close-metric-details');

// Filter Controls
const salesCalendarFilter = document.getElementById('sales-calendar-filter');
const stockCalendarFilter = document.getElementById('stock-calendar-filter');

// Helper function to safely update text content without throwing null errors
const setElementText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
};

// Modal Visibility Handlers
btnOpenSalesReport?.addEventListener('click', () => {
  salesReportModal?.classList.remove('hidden');
  updateSalesReport();
});

btnCloseSalesReport?.addEventListener('click', () => {
  salesReportModal?.classList.add('hidden');
});

btnOpenStockReport?.addEventListener('click', () => {
  stockReportModal?.classList.remove('hidden');
  updateStockReport();
});

btnCloseStockReport?.addEventListener('click', () => {
  stockReportModal?.classList.add('hidden');
});

btnCloseMetricDetails?.addEventListener('click', () => {
  metricDetailsModal?.classList.add('hidden');
});

// Date/Tab Change Listeners for Sales Report
salesCalendarFilter?.addEventListener('change', () => updateSalesReport());

document.querySelectorAll('.sales-report-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.sales-report-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    activeSalesPeriod = e.target.getAttribute('data-period') || 'daily';
    updateSalesReport();
  });
});

// Date/Tab Change Listeners for Stock Report
stockCalendarFilter?.addEventListener('change', () => updateStockReport());

document.querySelectorAll('.stock-report-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.stock-report-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    activeStockPeriod = e.target.getAttribute('data-period') || 'daily';
    updateStockReport();
  });
});

// Date Filter Logic (Daily, Monthly, Yearly)
function matchesPeriodFilter(itemDateStr, targetDateStr, period) {
  if (!itemDateStr || !targetDateStr) return true;
  const itemDate = new Date(itemDateStr);
  const targetDate = new Date(targetDateStr);

  if (period === 'daily') {
    return itemDate.toISOString().split('T')[0] === targetDateStr;
  } else if (period === 'monthly') {
    return (
      itemDate.getFullYear() === targetDate.getFullYear() &&
      itemDate.getMonth() === targetDate.getMonth()
    );
  } else if (period === 'yearly') {
    return itemDate.getFullYear() === targetDate.getFullYear();
  }
  return true;
}

// Update Sales Report UI Logic
function updateSalesReport() {
  const selectedDate = salesCalendarFilter?.value;
  const filteredSales = salesData.filter(item =>
    matchesPeriodFilter(item.timestamp || item.date, selectedDate, activeSalesPeriod)
  );

  let totalIncome = 0;
  let totalCost = 0;
  let roomsTotal = 0;
  let foodTotal = 0;
  let functionTotal = 0;
  let stockCostTotal = 0;

  filteredSales.forEach(item => {
    const price = parseFloat(item.price) || 0;
    if (item.type === 'Income') {
      totalIncome += price;
      if (item.category === 'Rooms') roomsTotal += price;
      if (item.category === 'Food') foodTotal += price;
      if (item.category === 'Function') functionTotal += price;
    } else if (item.type === 'Cost') {
      totalCost += price;
      if (item.category === 'Stock') stockCostTotal += price;
    }
  });

  const netProfit = totalIncome - totalCost;
  const netLoss = netProfit < 0 ? Math.abs(netProfit) : 0;

  // Update Dashboard & Modal Elements safely
  setElementText('sr-total-revenue', `Rs. ${totalIncome.toFixed(2)}`);
  setElementText('sr-total-cost', `Rs. ${totalCost.toFixed(2)}`);
  setElementText('sr-net-profit', `Rs. ${Math.max(0, netProfit).toFixed(2)}`);
  setElementText('sr-net-loss', `Rs. ${netLoss.toFixed(2)}`);

  setElementText('sr-cat-rooms', `Rs. ${roomsTotal.toFixed(2)}`);
  setElementText('sr-cat-food', `Rs. ${foodTotal.toFixed(2)}`);
  setElementText('sr-cat-function', `Rs. ${functionTotal.toFixed(2)}`);
  setElementText('sr-cat-stock', `Rs. ${stockCostTotal.toFixed(2)}`);

  // Update Summary Cards on main sales panel
  setElementText('report-total-income', `Rs. ${totalIncome.toFixed(2)}`);
  setElementText('report-total-cost', `Rs. ${totalCost.toFixed(2)}`);
  setElementText('report-net-profit', `Rs. ${Math.max(0, netProfit).toFixed(2)}`);
  setElementText('report-net-loss', `Rs. ${netLoss.toFixed(2)}`);
}

// Update Stock Report UI Logic
function updateStockReport() {
  const selectedDate = stockCalendarFilter?.value;
  const filteredStock = stockData.filter(item =>
    matchesPeriodFilter(item.timestamp || item.date, selectedDate, activeStockPeriod)
  );

  let totalVal = 0;
  const tbody = document.getElementById('stock-report-table-body');
  if (tbody) tbody.innerHTML = '';

  filteredStock.forEach(item => {
    const price = parseFloat(item.price) || 0;
    totalVal += price;

    if (tbody) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.code || '-'}</td>
        <td>${item.name || '-'}</td>
        <td>Rs. ${price.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    }
  });

  const count = filteredStock.length;
  const avgPrice = count > 0 ? totalVal / count : 0;

  setElementText('st-total-val', `Rs. ${totalVal.toFixed(2)}`);
  setElementText('st-table-total-val', `Rs. ${totalVal.toFixed(2)}`);
  setElementText('st-total-count', count.toString());
  setElementText('st-avg-price', `Rs. ${avgPrice.toFixed(2)}`);
}

// Metric Details Drilldown Handler
function openMetricDetails(title, categoryFilter) {
  const modal = document.getElementById('metric-details-modal');
  const tbody = document.getElementById('metric-details-tbody');

  setElementText('metric-details-title', `${title} Details`);

  if (tbody) tbody.innerHTML = '';
  let sum = 0;

  const filtered = salesData.filter(item => item.category === categoryFilter);
  filtered.forEach(item => {
    const price = parseFloat(item.price) || 0;
    sum += price;

    if (tbody) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.code || '-'}</td>
        <td>${item.name || '-'}</td>
        <td>${item.category || '-'}</td>
        <td>${item.type || '-'}</td>
        <td>Rs. ${price.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    }
  });

  setElementText('metric-details-total', `Rs. ${sum.toFixed(2)}`);
  modal?.classList.remove('hidden');
}