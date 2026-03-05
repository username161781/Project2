// script.js
// ===== ЗАГРУЗКА ДАННЫХ ИЗ localStorage =====
function loadFromStorage() {
    const savedTransactions = localStorage.getItem('finance_transactions');
    
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
        console.log("Загружено транзакций:", transactions.length);
    } else {
        transactions = [];
        console.log("Нет сохраненных данных, пустой массив");
    }
}

// ===== СОХРАНЕНИЕ ДАННЫХ В localStorage =====
function saveToStorage() {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
    console.log("Сохранено транзакций:", transactions.length);
}

// ===== ПЕРЕМЕННЫЕ ДЛЯ РЕДАКТИРОВАНИЯ =====
let editingTransactionId = null;

// ===== ПЕРЕМЕННЫЕ ДЛЯ СОРТИРОВКИ И ФИЛЬТРАЦИИ =====
let currentSort = {
    column: 'date',
    direction: 'desc' // 'asc' или 'desc'
};
let currentFilter = {
    type: 'all', // 'all', 'income', 'expense'
    category: 'all',
    search: ''
};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАСЧЕТОВ =====
function calculateTotalIncome() {
    return transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
}

function calculateTotalExpenses() {
    return transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

function calculateCategoryTotals() {
    const totals = {
        food: 0,
        entertainment: 0,
        shopping: 0,
        investment: 0,
        other: 0
    };
    
    transactions
        .filter(t => t.amount < 0)
        .forEach(transaction => {
            const category = transaction.category.toLowerCase();
            const amount = Math.abs(transaction.amount);
            
            if (category.includes('food') || category === 'food & health') {
                totals.food += amount;
            } else if (category.includes('entertainment')) {
                totals.entertainment += amount;
            } else if (category.includes('shopping')) {
                totals.shopping += amount;
            } else if (category.includes('investment')) {
                totals.investment += amount;
            } else {
                totals.other += amount;
            }
        });
    
    return totals;
}

// ===== ФУНКЦИИ ДЛЯ ГРАФИКОВ OVERVIEW =====
function calculateMonthlyData() {
    // Все 12 месяцев с правильными названиями
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    const monthlyData = [];
    
    // Берем данные за последние 12 месяцев
    for (let i = 0; i < 12; i++) {
        // Вычисляем месяц и год для каждого столбца
        let monthIndex = (currentMonth - 11 + i + 12) % 12; // Корректируем для отрицательных значений
        let year = currentYear;
        
        // Корректируем год для месяцев в прошлом году
        if (monthIndex > currentMonth) {
            year = currentYear - 1;
        }
        
        const monthName = months[monthIndex];
        
        // Собираем все транзакции за этот месяц и год
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === monthIndex && 
                   transactionDate.getFullYear() === year;
        });
        
        // Считаем доходы и расходы
        const income = monthTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = monthTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        monthlyData.push({
            month: monthName,
            income: income,
            expenses: expenses,
            total: income + expenses,
            year: year,
            isCurrentMonth: monthIndex === currentMonth && year === currentYear
        });
    }
    
    return monthlyData;
}

// ===== ФУНКЦИИ ДЛЯ ГРАФИКОВ OVERVIEW =====
function calculateMonthlyData() {
    // Все 12 месяцев по порядку от Января до Декабря
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    const monthlyData = [];
    
    // Проходим по всем месяцам года от Января до Декабря
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthName = months[monthIndex];
        
        // Собираем все транзакции за этот месяц в ТЕКУЩЕМ году
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === monthIndex && 
                   transactionDate.getFullYear() === currentYear;
        });
        
        // Считаем доходы и расходы
        const income = monthTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = monthTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        monthlyData.push({
            month: monthName,
            income: income,
            expenses: expenses,
            total: income + expenses,
            year: currentYear,
            isCurrentMonth: monthIndex === currentDate.getMonth() && currentYear === currentYear
        });
    }
    
    return monthlyData;
}

function updateOverviewChart() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    const monthlyData = calculateMonthlyData();
    
    // Находим максимальное значение для масштабирования
    const maxValue = Math.max(
        ...monthlyData.flatMap(d => [d.income, d.expenses]),
        1
    );
    
    // Очищаем контейнер
    chartContainer.innerHTML = '';
    
    // Максимальная высота столбца
    const MAX_BAR_HEIGHT = 170;
    
    monthlyData.forEach((data) => {
        // Создаем обертку для столбца и подписи
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';
        
        // Создаем контейнер для столбца
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';
        
        // Масштабируем высоты
        const scale = MAX_BAR_HEIGHT / maxValue;
        
        let incomeHeight = Math.min(data.income * scale, MAX_BAR_HEIGHT);
        let expenseHeight = Math.min(data.expenses * scale, MAX_BAR_HEIGHT);
        
        // Если сумма превышает MAX_BAR_HEIGHT, масштабируем
        if (incomeHeight + expenseHeight > MAX_BAR_HEIGHT) {
            const factor = MAX_BAR_HEIGHT / (incomeHeight + expenseHeight);
            incomeHeight = incomeHeight * factor;
            expenseHeight = expenseHeight * factor;
        }
        
        const totalHeight = incomeHeight + expenseHeight;
        barContainer.style.height = totalHeight + 'px';
        
        // Добавляем расходы (КРАСНЫЙ)
        if (data.expenses > 0) {
            const expenseBar = document.createElement('div');
            expenseBar.style.cssText = `
                height: ${expenseHeight}px;
                width: 100%;
                background-color: #ef4444;
                position: absolute;
                bottom: 0;
                left: 0;
                border-radius: 0;
            `;
            barContainer.appendChild(expenseBar);
        }
        
        // Добавляем доходы (ЗЕЛЕНЫЙ)
        if (data.income > 0) {
            const incomeBar = document.createElement('div');
            incomeBar.style.cssText = `
                height: ${incomeHeight}px;
                width: 100%;
                background-color: #10b981;
                position: absolute;
                bottom: ${expenseHeight}px;
                left: 0;
                border-radius: 0;
            `;
            barContainer.appendChild(incomeBar);
        }
        
        // Если нет данных
        if (data.income === 0 && data.expenses === 0) {
            barContainer.style.height = '4px';
            barContainer.style.backgroundColor = '#f1f5f9';
        }
        
        wrapper.appendChild(barContainer);
        
        // Добавляем подпись месяца
        const label = document.createElement('div');
        label.className = 'chart-label';
        if (data.isCurrentMonth) {
            label.classList.add('current-month');
        }
        label.textContent = data.month;
        
        wrapper.appendChild(label);
        chartContainer.appendChild(wrapper);
    });
}
// ===== ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ =====
window.openEditModal = function(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    editingTransactionId = id;
    
    // Определяем тип транзакции
    const isIncome = transaction.amount > 0;
    const modalId = isIncome ? 'editIncomeModal' : 'editExpenseModal';
    
    // Создаем модальное окно для редактирования, если его нет
    createEditModal(isIncome);
    
    // Заполняем поля
    if (isIncome) {
        document.getElementById('editIncomeAmount').value = Math.abs(transaction.amount);
        document.getElementById('editIncomeCategory').value = transaction.category.toLowerCase();
        document.getElementById('editIncomeDescription').value = transaction.description;
        document.getElementById('editIncomeDate').value = transaction.date;
    } else {
        document.getElementById('editExpenseAmount').value = Math.abs(transaction.amount);
        document.getElementById('editExpenseCategory').value = 
            transaction.category === 'Food & Health' ? 'food' : transaction.category.toLowerCase();
        document.getElementById('editExpenseDescription').value = transaction.description;
        document.getElementById('editExpenseDate').value = transaction.date;
    }
    
    // Показываем модальное окно
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.saveEdit = function() {
    if (!editingTransactionId) return;
    
    const transaction = transactions.find(t => t.id === editingTransactionId);
    if (!transaction) return;
    
    const isIncome = transaction.amount > 0;
    
    if (isIncome) {
        const amount = parseFloat(document.getElementById('editIncomeAmount').value);
        const category = document.getElementById('editIncomeCategory').value;
        const description = document.getElementById('editIncomeDescription').value;
        const date = document.getElementById('editIncomeDate').value;
        
        if (!amount || !category || !description || !date) {
            alert("Please fill in all fields");
            return;
        }
        
        // Обновляем транзакцию
        transaction.amount = amount;
        transaction.category = category.charAt(0).toUpperCase() + category.slice(1);
        transaction.description = description;
        transaction.date = date;
    } else {
        const amount = parseFloat(document.getElementById('editExpenseAmount').value);
        const category = document.getElementById('editExpenseCategory').value;
        const description = document.getElementById('editExpenseDescription').value;
        const date = document.getElementById('editExpenseDate').value;
        
        if (!amount || !category || !description || !date) {
            alert("Please fill in all fields");
            return;
        }
        
        // Обновляем транзакцию
        transaction.amount = -amount;
        transaction.category = category === 'food' ? 'Food & Health' : category.charAt(0).toUpperCase() + category.slice(1);
        transaction.description = description;
        transaction.date = date;
    }
    
    saveToStorage();
    updateDashboard();
    updateOverviewChart();
    updateTransactionsTable();
    closeModal(isIncome ? 'editIncomeModal' : 'editExpenseModal');
    showNotification('Transaction updated successfully!', 'success');
    
    editingTransactionId = null;
};

function createEditModal(isIncome) {
    const modalId = isIncome ? 'editIncomeModal' : 'editExpenseModal';
    
    // Проверяем, существует ли уже модальное окно
    if (document.getElementById(modalId)) return;
    
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    
    const title = isIncome ? 'Edit Income' : 'Edit Expense';
    const categories = isIncome 
        ? ['Salary', 'Freelance', 'Business', 'Investment', 'Other']
        : ['Food', 'Entertainment', 'Shopping', 'Transport', 'Utilities', 'Investment', 'Other'];
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <button class="close-btn" onclick="closeModal('${modalId}')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="${isIncome ? 'editIncomeForm' : 'editExpenseForm'}">
                    <div class="form-group">
                        <label class="form-label">Amount ($)</label>
                        <input type="number" class="form-input" id="${isIncome ? 'editIncomeAmount' : 'editExpenseAmount'}" placeholder="Enter amount" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-select" id="${isIncome ? 'editIncomeCategory' : 'editExpenseCategory'}" required>
                            <option value="">Select category</option>
                            ${categories.map(cat => {
                                const value = cat === 'Food' ? 'food' : cat.toLowerCase();
                                const text = cat === 'Food' ? 'Food & Health' : cat;
                                return `<option value="${value}">${text}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description (Name)</label>
                        <input type="text" class="form-input" id="${isIncome ? 'editIncomeDescription' : 'editExpenseDescription'}" placeholder="Enter description" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Date</label>
                        <input type="date" class="form-input" id="${isIncome ? 'editIncomeDate' : 'editExpenseDate'}" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
                <button class="btn btn-primary" onclick="saveEdit()">Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ===== РАСШИРЕННЫЕ ФУНКЦИИ ДЛЯ СОРТИРОВКИ =====
function sortTransactions(transactionsToSort, sortConfig) {
    return [...transactionsToSort].sort((a, b) => {
        let comparison = 0;
        
        switch(sortConfig.column) {
            case 'date':
                comparison = new Date(a.date) - new Date(b.date);
                break;
            case 'category':
                comparison = a.category.localeCompare(b.category);
                break;
            case 'amount':
                comparison = Math.abs(a.amount) - Math.abs(b.amount);
                break;
            case 'amount-desc':
                comparison = Math.abs(b.amount) - Math.abs(a.amount);
                break;
            case 'amount-asc':
                comparison = Math.abs(a.amount) - Math.abs(b.amount);
                break;
            case 'date-desc':
                comparison = new Date(b.date) - new Date(a.date);
                break;
            case 'date-asc':
                comparison = new Date(a.date) - new Date(b.date);
                break;
            default:
                comparison = 0;
        }
        
        if (!sortConfig.column.includes('-')) {
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        return comparison;
    });
}

// ===== ПРИМЕНЕНИЕ РАСШИРЕННОЙ СОРТИРОВКИ =====
window.applyAdvancedSort = function() {
    const sortType = document.getElementById('sortType').value;
    const sortDirection = document.getElementById('sortDirection').value;
    
    if (sortType === 'date') {
        currentSort.column = sortDirection === 'newest' ? 'date-desc' : 'date-asc';
        currentSort.direction = sortDirection === 'newest' ? 'desc' : 'asc';
    } else if (sortType === 'amount') {
        currentSort.column = sortDirection === 'highest' ? 'amount-desc' : 'amount-asc';
        currentSort.direction = sortDirection === 'highest' ? 'desc' : 'asc';
    } else if (sortType === 'category') {
        currentSort.column = 'category';
        currentSort.direction = sortDirection === 'az' ? 'asc' : 'desc';
    }
    
    updateTransactionsTable();
    updateSortBadge();
    document.getElementById('sortPanel').style.display = 'none';
    
    showNotification(`Sorted by ${getSortDescription()}`, 'info');
};

// ===== ПОЛУЧЕНИЕ ОПИСАНИЯ ТЕКУЩЕЙ СОРТИРОВКИ =====
function getSortDescription() {
    if (currentSort.column === 'date-desc') return 'newest first';
    if (currentSort.column === 'date-asc') return 'oldest first';
    if (currentSort.column === 'amount-desc') return 'highest amount';
    if (currentSort.column === 'amount-asc') return 'lowest amount';
    if (currentSort.column === 'category') {
        return currentSort.direction === 'asc' ? 'category A-Z' : 'category Z-A';
    }
    return 'date';
}

// ===== ОБНОВЛЕНИЕ БЕЙДЖА СОРТИРОВКИ =====
function updateSortBadge() {
    let sortBadge = document.querySelector('.sort-badge');
    if (!sortBadge) {
        sortBadge = document.createElement('div');
        sortBadge.className = 'sort-badge';
        sortBadge.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            background: #f3f4f6;
            border-radius: 16px;
            font-size: 0.875rem;
            color: #374151;
            margin-left: 1rem;
        `;
        
        const filtersDiv = document.querySelector('.filters');
        if (filtersDiv) {
            filtersDiv.appendChild(sortBadge);
        }
    }
    
    let icon = 'fa-calendar';
    if (currentSort.column.includes('amount')) icon = 'fa-dollar-sign';
    if (currentSort.column === 'category') icon = 'fa-font';
    
    let text = getSortDescription();
    
    sortBadge.innerHTML = `
        <i class="fas ${icon}" style="font-size: 0.75rem;"></i>
        <span>${text}</span>
        <i class="fas fa-times" style="cursor: pointer; font-size: 0.75rem; opacity: 0.7;" onclick="resetSort()"></i>
    `;
}

// ===== СБРОС СОРТИРОВКИ =====
window.resetSort = function() {
    currentSort = {
        column: 'date',
        direction: 'desc'
    };
    
    document.getElementById('sortType').value = 'date';
    document.getElementById('sortDirection').value = 'newest';
    
    updateTransactionsTable();
    
    const sortBadge = document.querySelector('.sort-badge');
    if (sortBadge) {
        sortBadge.remove();
    }
    
    showNotification('Sort reset to default', 'info');
};

// ===== ПОКАЗ/СКРЫТИЕ ПАНЕЛИ СОРТИРОВКИ =====
window.toggleSortPanel = function() {
    const panel = document.getElementById('sortPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

// ===== ПОКАЗ/СКРЫТИЕ ПАНЕЛИ ФИЛЬТРОВ =====
window.toggleFilterPanel = function() {
    const panel = document.getElementById('filterPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
};

// ===== ПРИМЕНЕНИЕ ФИЛЬТРОВ =====
window.applyFilters = function() {
    const typeFilter = document.getElementById('filterType').value;
    const categoryFilter = document.getElementById('filterCategory').value;
    const searchFilter = document.getElementById('filterSearch').value;
    
    currentFilter = {
        type: typeFilter,
        category: categoryFilter,
        search: searchFilter
    };
    
    updateTransactionsTable();
    document.getElementById('filterPanel').style.display = 'none';
    
    if (typeFilter !== 'all' || categoryFilter !== 'all' || searchFilter) {
        showNotification('Filters applied', 'info');
    }
};

// ===== СБРОС ФИЛЬТРОВ =====
window.resetFilters = function() {
    currentFilter = {
        type: 'all',
        category: 'all',
        search: ''
    };
    
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterSearch').value = '';
    
    updateTransactionsTable();
    document.getElementById('filterPanel').style.display = 'none';
    showNotification('Filters reset', 'info');
};

// ===== ОБНОВЛЕНИЕ КАТЕГОРИЙ В ФИЛЬТРЕ =====
window.updateFilterCategories = function() {
    const typeFilter = document.getElementById('filterType').value;
    const categorySelect = document.getElementById('filterCategory');
    
    const currentValue = categorySelect.value;
    categorySelect.innerHTML = '';
    
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Categories';
    categorySelect.appendChild(allOption);
    
    if (typeFilter === 'income') {
        const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investment', 'Other'];
        incomeCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.toLowerCase();
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    } else if (typeFilter === 'expense') {
        const expenseCategories = ['Food', 'Entertainment', 'Shopping', 'Transport', 'Utilities', 'Investment', 'Other'];
        expenseCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.toLowerCase();
            option.textContent = cat === 'Food' ? 'Food & Health' : cat;
            categorySelect.appendChild(option);
        });
    } else {
        const allCategories = ['Salary', 'Freelance', 'Business', 'Food', 'Entertainment', 'Shopping', 'Transport', 'Utilities', 'Investment', 'Other'];
        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.toLowerCase();
            option.textContent = cat === 'Food' ? 'Food & Health' : cat;
            categorySelect.appendChild(option);
        });
    }
    
    if (currentValue && currentValue !== 'all') {
        categorySelect.value = currentValue;
    }
};

// ===== ФУНКЦИИ ДЛЯ ФИЛЬТРАЦИИ =====
function filterTransactions() {
    let filtered = [...transactions];
    
    if (currentFilter.type === 'income') {
        filtered = filtered.filter(t => t.amount > 0);
    } else if (currentFilter.type === 'expense') {
        filtered = filtered.filter(t => t.amount < 0);
    }
    
    if (currentFilter.category !== 'all') {
        filtered = filtered.filter(t => {
            const categoryLower = t.category.toLowerCase();
            if (t.amount > 0) {
                return categoryLower === currentFilter.category.toLowerCase();
            } else {
                return categoryLower === currentFilter.category.toLowerCase() ||
                       (currentFilter.category === 'food' && categoryLower === 'food & health');
            }
        });
    }
    
    if (currentFilter.search) {
        const searchLower = currentFilter.search.toLowerCase();
        filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(searchLower) ||
            t.category.toLowerCase().includes(searchLower)
        );
    }
    
    return filtered;
}

// ===== ИНИЦИАЛИЗАЦИЯ ДАННЫХ =====
let transactions = [];
loadFromStorage();

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML =====
window.openIncomeModal = function() {
    document.getElementById("incomeModal").style.display = "block";
    document.body.style.overflow = "hidden";
};

window.openExpenseModal = function() {
    document.getElementById("expenseModal").style.display = "block";
    document.body.style.overflow = "hidden";
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = "none";
    document.body.style.overflow = "auto";
    
    const today = new Date().toISOString().split("T")[0];
    
    if (modalId === "incomeModal" || modalId === "editIncomeModal") {
        const formId = modalId === "incomeModal" ? "incomeForm" : "editIncomeForm";
        const form = document.getElementById(formId);
        if (form) form.reset();
        
        const dateInput = document.getElementById(modalId === "incomeModal" ? "incomeDate" : "editIncomeDate");
        if (dateInput) dateInput.value = today;
    } else if (modalId === "expenseModal" || modalId === "editExpenseModal") {
        const formId = modalId === "expenseModal" ? "expenseForm" : "editExpenseForm";
        const form = document.getElementById(formId);
        if (form) form.reset();
        
        const dateInput = document.getElementById(modalId === "expenseModal" ? "expenseDate" : "editExpenseDate");
        if (dateInput) dateInput.value = today;
    }
    
    if (modalId.includes('edit')) {
        editingTransactionId = null;
    }
};

window.addIncome = function() {
    const amount = parseFloat(document.getElementById("incomeAmount").value);
    const category = document.getElementById("incomeCategory").value;
    const description = document.getElementById("incomeDescription").value;
    const date = document.getElementById("incomeDate").value;

    if (!amount || !category || !description || !date) {
        alert("Please fill in all fields");
        return;
    }

    const newTransaction = {
        id: Date.now(),
        date: date,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        description: description,
        amount: amount,
        status: "Success",
        type: "income"
    };

    transactions.unshift(newTransaction);
    saveToStorage();
    
    updateDashboard();
    updateOverviewChart();
    updateTransactionsTable();
    closeModal("incomeModal");
    showNotification("Income added successfully!", "success");
};

window.addExpense = function() {
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const category = document.getElementById("expenseCategory").value;
    const description = document.getElementById("expenseDescription").value;
    const date = document.getElementById("expenseDate").value;

    if (!amount || !category || !description || !date) {
        alert("Please fill in all fields");
        return;
    }

    const newTransaction = {
        id: Date.now(),
        date: date,
        category: category === 'food' ? 'Food & Health' : category.charAt(0).toUpperCase() + category.slice(1),
        description: description,
        amount: -amount,
        status: "Success",
        type: "expense"
    };

    transactions.unshift(newTransaction);
    saveToStorage();
    
    updateDashboard();
    updateOverviewChart();
    updateTransactionsTable();
    closeModal("expenseModal");
    showNotification("Expense added successfully!", "success");
};

window.deleteTransaction = function(id) {
    if (confirm("Delete this transaction?")) {
        transactions = transactions.filter(t => t.id !== id);
        saveToStorage();
        updateDashboard();
        updateOverviewChart();
        updateTransactionsTable();
        showNotification("Transaction deleted", "info");
    }
};

window.clearAllData = function() {
    if (confirm("Are you sure you want to delete ALL transactions?")) {
        transactions = [];
        saveToStorage();
        updateDashboard();
        updateOverviewChart();
        updateTransactionsTable();
        showNotification("All data cleared", "info");
    }
};

// ===== ФУНКЦИИ ОБНОВЛЕНИЯ ИНТЕРФЕЙСА =====
// ===== ФУНКЦИИ ОБНОВЛЕНИЯ ИНТЕРФЕЙСА =====
function updateDashboard() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Доходы ТОЛЬКО за текущий месяц
    const currentMonthIncome = transactions
        .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear && 
                   t.amount > 0;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Расходы ТОЛЬКО за текущий месяц
    const currentMonthExpenses = transactions
        .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear && 
                   t.amount < 0;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Категории расходов ТОЛЬКО за текущий месяц
    const categoryTotals = {
        food: 0,
        entertainment: 0,
        shopping: 0,
        investment: 0,
        other: 0
    };
    
    transactions
        .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear && 
                   t.amount < 0;
        })
        .forEach(transaction => {
            const category = transaction.category.toLowerCase();
            const amount = Math.abs(transaction.amount);
            
            if (category.includes('food') || category === 'food & health') {
                categoryTotals.food += amount;
            } else if (category.includes('entertainment')) {
                categoryTotals.entertainment += amount;
            } else if (category.includes('shopping')) {
                categoryTotals.shopping += amount;
            } else if (category.includes('investment')) {
                categoryTotals.investment += amount;
            } else {
                categoryTotals.other += amount;
            }
        });
    
    // Обновляем основные суммы (ТОЛЬКО за текущий месяц)
    const incomeElement = document.querySelector(".income-amount");
    const expenseElement = document.querySelector(".expense-amount");
    const totalExpensesElement = document.querySelector(".total-expenses");
    
    if (incomeElement) incomeElement.textContent = `$${currentMonthIncome.toFixed(2)}`;
    if (expenseElement) expenseElement.textContent = `$${currentMonthExpenses.toFixed(2)}`;
    if (totalExpensesElement) totalExpensesElement.textContent = `$${currentMonthExpenses.toFixed(2)}`;
    
    // Расчет процентов по сравнению с прошлым месяцем
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Доходы за прошлый месяц
    const lastMonthIncome = transactions
        .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === lastMonth && 
                   date.getFullYear() === lastMonthYear && 
                   t.amount > 0;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Расходы за прошлый месяц
    const lastMonthExpenses = transactions
        .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === lastMonth && 
                   date.getFullYear() === lastMonthYear && 
                   t.amount < 0;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Расчет процентов для доходов
    let incomePercent = 0;
    let incomeIcon = 'fa-arrow-up';
    let incomeColor = '#10b981';
    
    if (lastMonthIncome > 0) {
        incomePercent = ((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1);
        if (incomePercent > 0) {
            incomeIcon = 'fa-arrow-up';
            incomeColor = '#10b981';
        } else if (incomePercent < 0) {
            incomeIcon = 'fa-arrow-down';
            incomeColor = '#ef4444';
            incomePercent = Math.abs(incomePercent);
        }
    } else if (currentMonthIncome > 0) {
        incomePercent = 100;
        incomeIcon = 'fa-arrow-up';
        incomeColor = '#10b981';
    }
    
    // Расчет процентов для расходов
    let expensePercent = 0;
    let expenseIcon = 'fa-arrow-up';
    let expenseColor = '#10b981';
    
    if (lastMonthExpenses > 0) {
        expensePercent = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1);
        if (expensePercent > 0) {
            expenseIcon = 'fa-arrow-up';
            expenseColor = '#ef4444'; // Красный для роста расходов
        } else if (expensePercent < 0) {
            expenseIcon = 'fa-arrow-down';
            expenseColor = '#10b981'; // Зеленый для падения расходов
            expensePercent = Math.abs(expensePercent);
        }
    } else if (currentMonthExpenses > 0) {
        expensePercent = 100;
        expenseIcon = 'fa-arrow-up';
        expenseColor = '#ef4444';
    }
    
    // Обновляем Monthly Income
    const incomeChangeElement = document.querySelector('.card:first-child .change');
    if (incomeChangeElement) {
        incomeChangeElement.innerHTML = `
            <i class="fas ${incomeIcon}" style="color: ${incomeColor}"></i>
            <span style="color: ${incomeColor}">${incomePercent}% vs Last month</span>
        `;
    }
    
    // Обновляем Monthly Expenses
    const expenseChangeElement = document.querySelector('.card:nth-child(2) .change');
    if (expenseChangeElement) {
        expenseChangeElement.innerHTML = `
            <i class="fas ${expenseIcon}" style="color: ${expenseColor}"></i>
            <span style="color: ${expenseColor}">${expensePercent}% vs Last month</span>
        `;
    }
    
    // Обновляем категории (ТОЛЬКО за текущий месяц)
    const foodElement = document.querySelector(".category-amount-food");
    const entertainmentElement = document.querySelector(".category-amount-entertainment");
    const shoppingElement = document.querySelector(".category-amount-shopping");
    const investmentElement = document.querySelector(".category-amount-investment");
    const otherElement = document.querySelector(".category-amount-other");
    
    if (foodElement) foodElement.textContent = `$${categoryTotals.food.toFixed(2)}`;
    if (entertainmentElement) entertainmentElement.textContent = `$${categoryTotals.entertainment.toFixed(2)}`;
    if (shoppingElement) shoppingElement.textContent = `$${categoryTotals.shopping.toFixed(2)}`;
    if (investmentElement) investmentElement.textContent = `$${categoryTotals.investment.toFixed(2)}`;
    if (otherElement) otherElement.textContent = `$${categoryTotals.other.toFixed(2)}`;
    
    // Обновляем период (ежедневные/еженедельные/ежемесячные значения)
    const periodValues = document.querySelectorAll(".period-values span");
    if (periodValues.length >= 3) {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        periodValues[0].textContent = `$${Math.round(currentMonthExpenses / daysInMonth) || 0}`;
        periodValues[1].textContent = `$${Math.round(currentMonthExpenses / 4) || 0}`;
        periodValues[2].textContent = `$${currentMonthExpenses.toFixed(2)}`;
    }
}

function updateTransactionsTable() {
    const tbody = document.querySelector(".transactions-table tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    let filteredTransactions = filterTransactions();
    const sortedTransactions = sortTransactions(filteredTransactions, currentSort);

    if (sortedTransactions.length === 0) {
        const row = document.createElement("tr");
        let message = "No transactions match your filters.";
        if (transactions.length === 0) {
            message = "No transactions yet. Click + or - to add your first transaction!";
        }
        row.innerHTML = `<td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">${message}</td>`;
        tbody.appendChild(row);
        return;
    }

    const recentTransactions = sortedTransactions.slice(0, 10);

    recentTransactions.forEach((transaction) => {
        const row = document.createElement("tr");
        const formattedDate = new Date(transaction.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

        const amountDisplay = transaction.amount > 0
            ? `+$${transaction.amount.toFixed(2)}`
            : `-$${Math.abs(transaction.amount).toFixed(2)}`;

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.category}</td>
            <td>${transaction.description || '-'}</td>
            <td style="color: ${transaction.amount > 0 ? "#10b981" : "#ef4444"}">${amountDisplay}</td>
            <td><span class="status-success">${transaction.status}</span></td>
            <td>
                <button class="action-btn" onclick="openEditModal(${transaction.id})" style="margin-right: 5px;" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteTransaction(${transaction.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
    
    updateFilterInfo(filteredTransactions.length);
}

function updateFilterInfo(filteredCount) {
    let filterInfo = document.querySelector('.filter-info');
    if (!filterInfo) {
        filterInfo = document.createElement('div');
        filterInfo.className = 'filter-info';
        filterInfo.style.cssText = `
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.5rem;
            padding: 0.5rem;
            background: #f9fafb;
            border-radius: 6px;
        `;
        const transactionsSection = document.querySelector('.transactions-section');
        if (transactionsSection) {
            transactionsSection.appendChild(filterInfo);
        }
    }
    
    if (currentFilter.type !== 'all' || currentFilter.category !== 'all' || currentFilter.search) {
        let filterText = 'Active filters: ';
        const filters = [];
        if (currentFilter.type !== 'all') filters.push(`Type: ${currentFilter.type === 'income' ? 'Income' : 'Expenses'}`);
        if (currentFilter.category !== 'all') filters.push(`Category: ${currentFilter.category}`);
        if (currentFilter.search) filters.push(`Search: "${currentFilter.search}"`);
        filterText += filters.join(', ');
        filterText += ` (showing ${filteredCount} of ${transactions.length} transactions)`;
        filterInfo.textContent = filterText;
        filterInfo.style.display = 'block';
    } else {
        filterInfo.style.display = 'none';
    }
}

function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === "success" ? "#10b981" : type === "info" ? "#3b82f6" : "#ef4444"};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ===== УСТАНОВКА ДАТЫ =====
function setCurrentDate() {
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options).replace(',', '');
    
    const datePicker = document.querySelector('.date-picker');
    if (datePicker) {
        datePicker.innerHTML = `<i class="fas fa-calendar"></i> ${formattedDate}`;
    }
}

function setTodayDates() {
    const today = new Date().toISOString().split("T")[0];
    const incomeDate = document.getElementById("incomeDate");
    const expenseDate = document.getElementById("expenseDate");
    
    if (incomeDate) incomeDate.value = today;
    if (expenseDate) expenseDate.value = today;
}

// ===== СОЗДАНИЕ ПАНЕЛЕЙ ФИЛЬТРОВ И СОРТИРОВКИ =====
function createFilterAndSortPanels() {
    const transactionsSection = document.querySelector('.transactions-section');
    if (!transactionsSection) return;
    
    // Панель сортировки
    const sortPanel = document.createElement('div');
    sortPanel.id = 'sortPanel';
    sortPanel.style.cssText = `
        display: none;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    `;
    
    sortPanel.innerHTML = `
        <h4 style="margin: 0 0 1rem 0; font-size: 1rem; color: #111827;">Sort Transactions</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div>
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;">Sort by</label>
                <select id="sortType" class="form-select" style="width: 100%;">
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="category">Category</option>
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;">Order</label>
                <select id="sortDirection" class="form-select" style="width: 100%;">
                    <!-- Date options -->
                    <option value="newest" data-type="date">Newest first</option>
                    <option value="oldest" data-type="date">Oldest first</option>
                    <!-- Amount options -->
                    <option value="highest" data-type="amount">Highest first</option>
                    <option value="lowest" data-type="amount">Lowest first</option>
                    <!-- Category options -->
                    <option value="az" data-type="category">A to Z</option>
                    <option value="za" data-type="category">Z to A</option>
                </select>
            </div>
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="document.getElementById('sortPanel').style.display='none'">Cancel</button>
            <button class="btn btn-primary" onclick="applyAdvancedSort()">Apply Sort</button>
        </div>
    `;
    
    // Панель фильтров
    const filterPanel = document.createElement('div');
    filterPanel.id = 'filterPanel';
    filterPanel.style.cssText = `
        display: none;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    `;
    
    filterPanel.innerHTML = `
        <h4 style="margin: 0 0 1rem 0; font-size: 1rem; color: #111827;">Filter Transactions</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
            <div>
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;">Type</label>
                <select id="filterType" class="form-select" style="width: 100%;" onchange="updateFilterCategories()">
                    <option value="all">All Transactions</option>
                    <option value="income">Income Only</option>
                    <option value="expense">Expenses Only</option>
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;">Category</label>
                <select id="filterCategory" class="form-select" style="width: 100%;">
                    <option value="all">All Categories</option>
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;">Search</label>
                <input type="text" id="filterSearch" class="form-input" placeholder="Search..." style="width: 100%;">
            </div>
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="resetFilters()">Reset</button>
            <button class="btn btn-primary" onclick="applyFilters()">Apply Filters</button>
        </div>
    `;
    
    transactionsSection.insertBefore(sortPanel, transactionsSection.querySelector('.transactions-table'));
    transactionsSection.insertBefore(filterPanel, transactionsSection.querySelector('.transactions-table'));
    
    // Обновляем направления сортировки при изменении типа
    document.getElementById('sortType').addEventListener('change', function() {
        const type = this.value;
        const directionSelect = document.getElementById('sortDirection');
        const options = directionSelect.options;
        
        for (let option of options) {
            option.style.display = option.dataset.type === type ? 'block' : 'none';
        }
        
        // Выбираем первый доступный вариант
        for (let option of options) {
            if (option.style.display !== 'none') {
                directionSelect.value = option.value;
                break;
            }
        }
    });
    
    // Инициализируем категории
    updateFilterCategories();
    
    // Триггерим событие change для правильного отображения
    document.getElementById('sortType').dispatchEvent(new Event('change'));
}

// ===== ОБНОВЛЕНИЕ КНОПОК =====
function enhanceButtons() {
    const filterBtn = document.querySelector('.filters .filter-btn:last-child');
    if (filterBtn) {
        filterBtn.onclick = toggleFilterPanel;
    }
    
    const sortBtn = document.querySelector('.filters .filter-btn:first-child');
    if (sortBtn) {
        sortBtn.innerHTML = '<i class="fas fa-sort"></i> Sort';
        sortBtn.onclick = toggleSortPanel;
    }
}

// ===== ЭКСПОРТ ТРАНЗАКЦИЙ =====
window.exportTransactions = function() {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `finance_transactions_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Transactions exported successfully!', 'success');
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener("DOMContentLoaded", function() {
    setCurrentDate();
    setTodayDates();
    createFilterAndSortPanels();
    enhanceButtons();
    updateDashboard();
    updateOverviewChart();
    updateTransactionsTable();
    updateSortBadge();
    
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.onclick = exportTransactions;
    }
    
    console.log("Dashboard initialized with", transactions.length, "transactions");
});

// ===== ЗАКРЫТИЕ МОДАЛЬНЫХ ОКОН =====
window.onclick = function(event) {
    const incomeModal = document.getElementById("incomeModal");
    const expenseModal = document.getElementById("expenseModal");
    const editIncomeModal = document.getElementById("editIncomeModal");
    const editExpenseModal = document.getElementById("editExpenseModal");

    if (event.target === incomeModal) {
        closeModal("incomeModal");
    }
    if (event.target === expenseModal) {
        closeModal("expenseModal");
    }
    if (event.target === editIncomeModal) {
        closeModal("editIncomeModal");
    }
    if (event.target === editExpenseModal) {
        closeModal("editExpenseModal");
    }
};

// ===== КЛАВИАТУРНЫЕ СОКРАЩЕНИЯ =====
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        closeModal("incomeModal");
        closeModal("expenseModal");
        closeModal("editIncomeModal");
        closeModal("editExpenseModal");
        document.getElementById('filterPanel').style.display = 'none';
        document.getElementById('sortPanel').style.display = 'none';
    }
    if (e.ctrlKey && e.key === "i") {
        e.preventDefault();
        openIncomeModal();
    }
    if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        openExpenseModal();
    }
    if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        toggleFilterPanel();
    }
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        toggleSortPanel();
    }
});

// ===== АНИМАЦИИ =====
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(100%); opacity: 1; }
        to { transform: translateX(0); opacity: 0; }
    }
    
    .filter-info, .sort-badge {
        transition: all 0.3s ease;
    }
    
    .form-select, .form-input {
        padding: 0.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 0.875rem;
    }
    
    .form-select:focus, .form-input:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    
    #sortPanel, #filterPanel {
        animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .chart-bar {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        background-color: #f3f4f6;
        border-radius: 4px;
        overflow: hidden;
        transition: height 0.3s ease;
    }
    
    .chart-bar-income, .chart-bar-expense {
        position: absolute;
        left: 0;
        width: 100%;
        transition: height 0.3s ease;
    }
    
    .chart-bar-income {
        background-color: #10b981;
        z-index: 2;
    }
    
    .chart-bar-expense {
        background-color: #ef4444;
        z-index: 1;
    }
    
    .chart-bar.active {
    }
    
    .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: all 0.2s ease;
    }
    
    .action-btn:hover {
        background-color: #f3f4f6;
    }
    
    .action-btn i.fa-edit {
        color: #3b82f6;
    }
    
    .action-btn i.fa-trash {
        color: #ef4444;
    }
`;
document.head.appendChild(style);
