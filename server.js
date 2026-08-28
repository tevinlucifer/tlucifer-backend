// ==========================================
    // REPORT MODAL CONTROLLERS & DATA CALCULATIONS
    // ==========================================

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
salesCalendarFilter?.addEventListener('change', () => updateSalesReport());    document.querySelectorAll('.sales-report-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.sales-report-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        activeSalesPeriod = e.target.getAttribute('data-period');
        updateSalesReport();
      });
    });

    // Date/Tab Change Listeners for Stock Report
    stockCalendarFilter?.addEventListener('change', updateStockReport);
    document.querySelectorAll('.stock-report-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.stock-report-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        activeStockPeriod = e.target.getAttribute('data-period');
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
        return itemDate.getFullYear() === targetDate.getFullYear() &&
               itemDate.getMonth() === targetDate.getMonth();
      } else if (period === 'yearly') {
        return itemDate.getFullYear() === targetDate.getFullYear();
      }
      return true;
    }

    // Update Sales Report UI Logic
    function updateSalesReport() {
      const selectedDate = salesCalendarFilter.value;
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

      // Update Dashboard & Modal Elements
      document.getElementById('sr-total-revenue').innerText = `Rs. ${totalIncome.toFixed(2)}`;
      document.getElementById('sr-total-cost').innerText = `Rs. ${totalCost.toFixed(2)}`;
      document.getElementById('sr-net-profit').innerText = `Rs. ${Math.max(0, netProfit).toFixed(2)}`;
      document.getElementById('sr-net-loss').innerText = `Rs. ${netLoss.toFixed(2)}`;

      document.getElementById('sr-cat-rooms').innerText = `Rs. ${roomsTotal.toFixed(2)}`;
      document.getElementById('sr-cat-food').innerText = `Rs. ${foodTotal.toFixed(2)}`;
      document.getElementById('sr-cat-function').innerText = `Rs. ${functionTotal.toFixed(2)}`;
      document.getElementById('sr-cat-stock').innerText = `Rs. ${stockCostTotal.toFixed(2)}`;

      // Update Summary Cards on main sales panel
      document.getElementById('report-total-income').innerText = `Rs. ${totalIncome.toFixed(2)}`;
      document.getElementById('report-total-cost').innerText = `Rs. ${totalCost.toFixed(2)}`;
      document.getElementById('report-net-profit').innerText = `Rs. ${Math.max(0, netProfit).toFixed(2)}`;
      document.getElementById('report-net-loss').innerText = `Rs. ${netLoss.toFixed(2)}`;
    }

    // Update Stock Report UI Logic
    function updateStockReport() {
      const selectedDate = stockCalendarFilter.value;
      const filteredStock = stockData.filter(item => 
        matchesPeriodFilter(item.timestamp || item.date, selectedDate, activeStockPeriod)
      );

      let totalVal = 0;
      const tbody = document.getElementById('stock-report-table-body');
      tbody.innerHTML = '';

      filteredStock.forEach(item => {
        const price = parseFloat(item.price) || 0;
        totalVal += price;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.code || '-'}</td>
          <td>${item.name || '-'}</td>
          <td>Rs. ${price.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
      });

      const count = filteredStock.length;
      const avgPrice = count > 0 ? (totalVal / count) : 0;

      document.getElementById('st-total-val').innerText = `Rs. ${totalVal.toFixed(2)}`;
      document.getElementById('st-table-total-val').innerText = `Rs. ${totalVal.toFixed(2)}`;
      document.getElementById('st-total-count').innerText = count;
      document.getElementById('st-avg-price').innerText = `Rs. ${avgPrice.toFixed(2)}`;
    }

    // Metric Details Drilldown Handler
    function openMetricDetails(title, categoryFilter) {
      const modal = document.getElementById('metric-details-modal');
      const titleEl = document.getElementById('metric-details-title');
      const tbody = document.getElementById('metric-details-tbody');
      const totalEl = document.getElementById('metric-details-total');

      titleEl.innerText = `${title} Details`;
      tbody.innerHTML = '';
      let sum = 0;

      const filtered = salesData.filter(item => item.category === categoryFilter);
      filtered.forEach(item => {
        const price = parseFloat(item.price) || 0;
        sum += price;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.code || '-'}</td>
          <td>${item.name || '-'}</td>
          <td>${item.category || '-'}</td>
          <td>${item.type || '-'}</td>
          <td>Rs. ${price.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
      });

      totalEl.innerText = `Rs. ${sum.toFixed(2)}`;
      modal?.classList.remove('hidden');
    }