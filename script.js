document.addEventListener("DOMContentLoaded", () => {
  // === ELEMEN DOM ===
  const list = document.getElementById("list");
  const incomeForm = document.getElementById("income-form");
  const expenseForm = document.getElementById("expense-form");
  const incomeText = document.getElementById("income-text");
  const expenseText = document.getElementById("expense-text");
  const incomeAmount = document.getElementById("income-amount");
  const expenseAmount = document.getElementById("expense-amount");
  const incomeCategory = document.getElementById("income-category");
  const expenseCategory = document.getElementById("expense-category");
  const incomeDate = document.getElementById("income-date");
  const expenseDate = document.getElementById("expense-date");
  const incomeTab = document.getElementById("income-tab");
  const expenseTab = document.getElementById("expense-tab");

  const startingBalanceEl = document.getElementById("starting-balance");
  const balanceEl = document.getElementById("balance");
  const moneyPlusEl = document.getElementById("money-plus");
  const moneyMinusEl = document.getElementById("money-minus");

  const currentMonthDisplay = document.getElementById("current-month-display");
  const prevMonthBtn = document.getElementById("prev-month-btn");
  const nextMonthBtn = document.getElementById("next-month-btn");

  const editModal = document.getElementById("edit-modal");
  const editForm = document.getElementById("edit-form");
  const closeEditModalBtn = document.getElementById("close-edit-modal-btn");
  const editId = document.getElementById("edit-id");
  const editType = document.getElementById("edit-type");
  const editText = document.getElementById("edit-text");
  const editAmount = document.getElementById("edit-amount");
  const editCategory = document.getElementById("edit-category");
  const editDate = document.getElementById("edit-date");

  const balanceModal = document.getElementById("balance-modal");
  const balanceForm = document.getElementById("balance-form");
  const balanceModalTitle = document.getElementById("balance-modal-title");
  const initialBalanceInput = document.getElementById("initial-balance-input");

  const infoModal = document.getElementById("info-modal");
  const infoBtn = document.getElementById("info-btn");
  const closeInfoModalBtn = document.getElementById("close-info-modal-btn");

  const resetBtn = document.getElementById("reset-btn");
  const confirmResetModal = document.getElementById("confirm-reset-modal");
  const cancelResetBtn = document.getElementById("cancel-reset");
  const confirmResetBtn = document.getElementById("confirm-reset");

  const filterType = document.getElementById("filter-type");
  const filterCategory = document.getElementById("filter-category");

  const toggleChartsBtn = document.getElementById("toggle-charts");
  const chartsContainer = document.getElementById("charts-container");

  const pieChartCanvas = document
    .getElementById("expense-pie-chart")
    .getContext("2d");
  const barChartCanvas = document
    .getElementById("monthly-bar-chart")
    .getContext("2d");

  // === STATE APLIKASI ===
  let currentDate = new Date();
  let expensePieChart, monthlyBarChart;
  let chartsVisible = true;

  const APP_STORAGE_KEY = "financeApp_data";
  const INCOME_CATEGORIES = ["Gaji", "Bonus", "Investasi", "Hadiah", "Lainnya"];
  const EXPENSE_CATEGORIES = [
    "Makanan & Minuman",
    "Transportasi",
    "Belanja",
    "Hiburan",
    "Kesehatan",
    "Pendidikan",
    "Tagihan",
    "Lainnya",
  ];

  // === INISIALISASI ===
  // Set tanggal default ke hari ini
  const today = new Date().toISOString().split("T")[0];
  incomeDate.value = today;
  expenseDate.value = today;

  // Isi opsi kategori
  updateCategoryFilters();

  // Event listeners untuk tab form
  incomeTab.addEventListener("click", () => {
    incomeTab.classList.add("active");
    expenseTab.classList.remove("active");
    incomeForm.classList.add("active");
    expenseForm.classList.remove("active");
  });

  expenseTab.addEventListener("click", () => {
    expenseTab.classList.add("active");
    incomeTab.classList.remove("active");
    expenseForm.classList.add("active");
    incomeForm.classList.remove("active");
  });

  // === FUNGSI UTILITAS ===
  function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  }

  function parseRupiahInput(input) {
    const cleanInput = input.replace(/[^0-9]/g, "");
    return parseInt(cleanInput) || 0;
  }

  function formatRupiahInput(input) {
    const number = parseRupiahInput(input);
    if (isNaN(number)) return "";

    const formatted = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return formatted;
  }

  function getMonthString(date) {
    return date.toISOString().slice(0, 7);
  }

  function updateCategoryFilters() {
    // Kosongkan dulu
    filterCategory.innerHTML = '<option value="all">Semua Kategori</option>';

    // Tambahkan kategori yang ada di transaksi
    const appData = loadData();
    const allCategories = new Set(appData.transactions.map((t) => t.category));

    allCategories.forEach((cat) => {
      if (INCOME_CATEGORIES.includes(cat)) {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        option.dataset.type = "income";
        filterCategory.appendChild(option);
      } else if (EXPENSE_CATEGORIES.includes(cat)) {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        option.dataset.type = "expense";
        filterCategory.appendChild(option);
      }
    });
  }

  // === LOCAL STORAGE OPERATIONS ===
  function loadData() {
    const data = localStorage.getItem(APP_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }

    // Data default jika tidak ada
    return {
      transactions: [],
      monthly_balances: {},
    };
  }

  function saveData(appData) {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appData));
  }

  function resetData() {
    localStorage.removeItem(APP_STORAGE_KEY);
    currentDate = new Date();
    navigateToMonth(currentDate);
    updateCategoryFilters();
  }

  // === FUNGSI UTAMA ===
  function navigateToMonth(date) {
    currentDate = new Date(date);
    const monthString = getMonthString(currentDate);

    // Update tampilan bulan
    currentMonthDisplay.textContent = currentDate.toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    });

    // Load data dari localStorage
    const appData = loadData();
    const startingBalance = appData.monthly_balances[monthString];

    // Filter transaksi untuk bulan ini
    const allTransactions = appData.transactions || [];
    let monthlyTransactions = allTransactions.filter((t) =>
      t.date.startsWith(monthString)
    );

    // Filter berdasarkan tipe dan kategori
    const typeFilter = filterType.value;
    const categoryFilter = filterCategory.value;

    if (typeFilter !== "all") {
      monthlyTransactions = monthlyTransactions.filter((t) =>
        typeFilter === "income" ? t.amount > 0 : t.amount < 0
      );
    }

    if (categoryFilter !== "all") {
      monthlyTransactions = monthlyTransactions.filter(
        (t) => t.category === categoryFilter
      );
    }

    // Jika belum ada saldo awal, tampilkan modal
    if (startingBalance === undefined) {
      balanceModalTitle.innerHTML = `<i class="fas fa-piggy-bank"></i> Masukkan Saldo Awal ${currentMonthDisplay.textContent}`;
      showModal(balanceModal);
      renderUI(0, []); // Render UI sementara
    } else {
      renderUI(startingBalance, monthlyTransactions);
    }
  }

  function saveInitialBalance(e) {
    e.preventDefault();
    const appData = loadData();
    const monthString = getMonthString(currentDate);
    const newBalance = parseRupiahInput(initialBalanceInput.value);

    if (isNaN(newBalance)) {
      alert("Masukkan jumlah saldo yang valid");
      return;
    }

    appData.monthly_balances[monthString] = newBalance;
    saveData(appData);

    hideModal(balanceModal);
    initialBalanceInput.value = "";
    navigateToMonth(currentDate);
  }

  function addIncome(e) {
    e.preventDefault();

    if (incomeText.value.trim() === "" || incomeAmount.value.trim() === "") {
      alert("Harap isi deskripsi dan jumlah pemasukan");
      return;
    }

    const transactionAmount = parseRupiahInput(incomeAmount.value);
    if (transactionAmount === 0) {
      alert("Masukkan jumlah pemasukan yang valid");
      return;
    }

    const appData = loadData();
    const transactionDate = incomeDate.value || today;

    const newTransaction = {
      id: new Date().getTime(),
      text: incomeText.value,
      amount: transactionAmount,
      category: incomeCategory.value,
      date: transactionDate,
    };

    appData.transactions.push(newTransaction);
    saveData(appData);

    // Reset form
    incomeText.value = "";
    incomeAmount.value = "";
    incomeDate.value = today;
    incomeText.focus();

    // Update UI
    navigateToMonth(currentDate);
    updateCategoryFilters();
  }

  function addExpense(e) {
    e.preventDefault();

    if (expenseText.value.trim() === "" || expenseAmount.value.trim() === "") {
      alert("Harap isi deskripsi dan jumlah pengeluaran");
      return;
    }

    const transactionAmount = parseRupiahInput(expenseAmount.value) * -1; // Pastikan negatif
    if (transactionAmount === 0) {
      alert("Masukkan jumlah pengeluaran yang valid");
      return;
    }

    const appData = loadData();
    const transactionDate = expenseDate.value || today;

    const newTransaction = {
      id: new Date().getTime(),
      text: expenseText.value,
      amount: transactionAmount,
      category: expenseCategory.value,
      date: transactionDate,
    };

    appData.transactions.push(newTransaction);
    saveData(appData);

    // Reset form
    expenseText.value = "";
    expenseAmount.value = "";
    expenseDate.value = today;
    expenseText.focus();

    // Update UI
    navigateToMonth(currentDate);
    updateCategoryFilters();
  }

  window.removeTransaction = function (id) {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      const appData = loadData();
      appData.transactions = appData.transactions.filter((t) => t.id !== id);
      saveData(appData);
      navigateToMonth(currentDate);
      updateCategoryFilters();
    }
  };

  window.openEditModal = function (id) {
    const appData = loadData();
    const transaction = appData.transactions.find((t) => t.id === id);

    if (transaction) {
      editId.value = transaction.id;
      editType.value = transaction.amount > 0 ? "income" : "expense";
      editText.value = transaction.text;
      editAmount.value = formatRupiahInput(
        Math.abs(transaction.amount).toString()
      );
      editDate.value = transaction.date.split("T")[0];

      // Update kategori berdasarkan tipe transaksi
      editCategory.innerHTML = "";
      const categories =
        transaction.amount > 0 ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        editCategory.appendChild(option);
      });
      editCategory.value = transaction.category;

      showModal(editModal);
    }
  };

  function saveEditedTransaction(e) {
    e.preventDefault();

    const appData = loadData();
    const id = parseInt(editId.value);
    const type = editType.value;
    const editedAmount =
      parseRupiahInput(editAmount.value) * (type === "income" ? 1 : -1);

    if (isNaN(editedAmount)) {
      alert("Masukkan jumlah transaksi yang valid");
      return;
    }

    appData.transactions = appData.transactions.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          text: editText.value,
          amount: editedAmount,
          category: editCategory.value,
          date: editDate.value || new Date().toISOString().split("T")[0],
        };
      }
      return t;
    });

    saveData(appData);
    hideModal(editModal);
    navigateToMonth(currentDate);
    updateCategoryFilters();
  }

  function closeEditModal() {
    hideModal(editModal);
  }

  function showModal(modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function hideModal(modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  function toggleCharts() {
    chartsVisible = !chartsVisible;
    chartsContainer.style.display = chartsVisible ? "flex" : "none";
    toggleChartsBtn.innerHTML = chartsVisible
      ? '<i class="fas fa-eye-slash"></i> Sembunyikan'
      : '<i class="fas fa-eye"></i> Tampilkan';
  }

  // === FUNGSI RENDER UI ===
  function renderUI(startingBalance, transactions) {
    renderTransactionList(transactions);
    renderSummary(startingBalance, transactions);
    renderCharts(transactions);
  }

  function renderTransactionList(transactions) {
    list.innerHTML = "";

    // Urutkan berdasarkan tanggal (terbaru pertama)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (transactions.length === 0) {
      const emptyMsg = document.createElement("li");
      emptyMsg.className = "empty-message";
      emptyMsg.innerHTML =
        '<i class="fas fa-info-circle"></i> Tidak ada transaksi untuk bulan ini';
      list.appendChild(emptyMsg);
      return;
    }

    transactions.forEach((transaction) => {
      addTransactionDOM(transaction);
    });
  }

  function addTransactionDOM(transaction) {
    const item = document.createElement("li");
    item.classList.add(transaction.amount < 0 ? "minus" : "plus");

    const transactionDate = new Date(transaction.date);
    const formattedDate = transactionDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    item.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-description">
          ${transaction.text}
          <span class="transaction-category">${transaction.category}</span>
        </div>
        <div class="transaction-date">${formattedDate}</div>
      </div>
      <div class="transaction-amount">
        ${transaction.amount < 0 ? "-" : "+"}${formatRupiah(
      Math.abs(transaction.amount)
    )}
      </div>
      <div class="transaction-controls">
        <button class="action-btn edit-btn" onclick="openEditModal(${
          transaction.id
        })" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" onclick="removeTransaction(${
          transaction.id
        })" title="Hapus">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;

    list.appendChild(item);
  }

  function renderSummary(startingBalance, transactions) {
    const amounts = transactions.map((t) => t.amount);

    const income = amounts
      .filter((amount) => amount > 0)
      .reduce((sum, amount) => sum + amount, 0);

    const expense =
      amounts
        .filter((amount) => amount < 0)
        .reduce((sum, amount) => sum + amount, 0) * -1; // Konversi ke positif

    const currentBalance = startingBalance + income - expense;

    startingBalanceEl.textContent = formatRupiah(startingBalance);
    moneyPlusEl.textContent = `+${formatRupiah(income)}`;
    moneyMinusEl.textContent = `-${formatRupiah(expense)}`;
    balanceEl.textContent = formatRupiah(currentBalance);
  }

  function renderCharts(transactions) {
    renderPieChart(transactions);
    renderBarChart(transactions);
  }

  function renderPieChart(transactions) {
    const expenses = transactions.filter((t) => t.amount < 0);

    // Kelompokkan pengeluaran berdasarkan kategori
    const expenseByCategory = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    const categories = Object.keys(expenseByCategory);
    const amounts = Object.values(expenseByCategory);

    // Buat warna untuk setiap kategori
    const backgroundColors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#8AC24A",
      "#607D8B",
    ].slice(0, categories.length);

    if (expensePieChart) expensePieChart.destroy();

    if (categories.length > 0) {
      expensePieChart = new Chart(pieChartCanvas, {
        type: "pie",
        data: {
          labels: categories,
          datasets: [
            {
              data: amounts,
              backgroundColor: backgroundColors,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${formatRupiah(value)} (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    } else {
      // Tampilkan pesan jika tidak ada data pengeluaran
      pieChartCanvas.textContent = "Tidak ada data pengeluaran";
      pieChartCanvas.style.textAlign = "center";
      pieChartCanvas.style.padding = "20px";
    }
  }

  function renderBarChart(transactions) {
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (monthlyBarChart) monthlyBarChart.destroy();

    monthlyBarChart = new Chart(barChartCanvas, {
      type: "bar",
      data: {
        labels: ["Total Bulan Ini"],
        datasets: [
          {
            label: "Pemasukan",
            data: [income],
            backgroundColor: "#2ecc71",
            borderWidth: 1,
          },
          {
            label: "Pengeluaran",
            data: [expense],
            backgroundColor: "#e74c3c",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatRupiah(value);
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || "";
                const value = context.raw || 0;
                return `${label}: ${formatRupiah(value)}`;
              },
            },
          },
        },
      },
    });
  }

  // === EVENT LISTENERS ===
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    navigateToMonth(currentDate);
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    navigateToMonth(currentDate);
  });

  incomeForm.addEventListener("submit", addIncome);
  expenseForm.addEventListener("submit", addExpense);
  balanceForm.addEventListener("submit", saveInitialBalance);
  editForm.addEventListener("submit", saveEditedTransaction);

  closeEditModalBtn.addEventListener("click", closeEditModal);
  infoBtn.addEventListener("click", () => showModal(infoModal));
  closeInfoModalBtn.addEventListener("click", () => hideModal(infoModal));

  resetBtn.addEventListener("click", () => showModal(confirmResetModal));
  cancelResetBtn.addEventListener("click", () => hideModal(confirmResetModal));
  confirmResetBtn.addEventListener("click", () => {
    resetData();
    hideModal(confirmResetModal);
  });

  filterType.addEventListener("change", () => navigateToMonth(currentDate));
  filterCategory.addEventListener("change", () => navigateToMonth(currentDate));

  toggleChartsBtn.addEventListener("click", toggleCharts);

  // Format input jumlah uang secara otomatis
  [incomeAmount, expenseAmount, editAmount, initialBalanceInput].forEach(
    (input) => {
      input.addEventListener("input", (e) => {
        const cursorPos = e.target.selectionStart;
        const cleanValue = e.target.value.replace(/[^0-9]/g, "");

        if (cleanValue === "") {
          e.target.value = "";
          return;
        }

        // Format dengan titik pemisah ribuan
        const formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        e.target.value = formattedValue;

        // Kembalikan posisi kursor setelah format
        const diff = formattedValue.length - e.target.value.length;
        e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
      });
    }
  );

  // === INISIALISASI APLIKASI ===
  navigateToMonth(new Date());
});
