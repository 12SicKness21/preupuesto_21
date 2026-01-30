/**
 * Mi Presupuesto 2.0 - Main Logic
 */

const app = (() => {
    // --- Configuration & State ---
    const CONFIG = {
        defaultCategories: {
            income: ['Salario', 'Freelance', 'Venta', 'Otros'],
            expense: ['Vivienda', 'Alimentación', 'Transporte', 'Servicios', 'Ocio', 'Salud', 'Educación'],
            saving: ['Fondo de Emergencia', 'Vacaciones', 'Inversión']
        },
        currencyLocales: {
            'USD': 'en-US',
            'EUR': 'de-DE', // Euro usually uses commas for decimals
            'MXN': 'es-MX',
            'COP': 'es-CO'
        }
    };

    let state = {
        currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
        currency: 'USD',
        transactions: [], // Array of { id, type, category, description, amount, date (YYYY-MM-DD) }
        customCategories: {
            income: [],
            expense: [],
            saving: []
        }
    };

    let charts = {
        cashFlow: null,
        distribution: null,
        history: null
    };

    // --- Initialization ---

    function init() {
        loadState();
        setupEventListeners();
        setupCharts();
        renderApp();
    }

    // --- Storage Modules ---

    function loadState() {
        const savedState = localStorage.getItem('miPresupuestoState');
        if (savedState) {
            state = JSON.parse(savedState);

            // Migration/Safety check: Ensure current month exists if app opens
            // If user opens app in a new month for the first time, logic to auto-copy could go here or in render
        } else {
            // First time load
            saveState();
        }

        // Check if we need to initialize the current month relative to real time? 
        // No, let's stick to state.currentMonth but if it's null (fresh start), set to now.
        if (!state.currentMonth) state.currentMonth = new Date().toISOString().slice(0, 7);

        // Apply Theme
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    function saveState() {
        localStorage.setItem('miPresupuestoState', JSON.stringify(state));
    }

    function resetData() {
        if (confirm('¿Estás seguro de borrar TODOS los datos? Esta acción es irreversible.')) {
            localStorage.removeItem('miPresupuestoState');
            location.reload();
        }
    }

    // --- Core Logic ---

    function getDataForMonth(monthStr) {
        return state.transactions.filter(t => t.date.startsWith(monthStr));
    }

    function getCategories(type) {
        return [...CONFIG.defaultCategories[type], ...state.customCategories[type]];
    }

    function addTransaction(type, category, description, amount) {
        // Use last day of selected month or today if matches? 
        // Simplification: Always add to the currently VIEWED month (fictional date: 01 of month)
        // Or better: If view month == real month, use today. Else use 01.

        let dateStr = state.currentMonth + '-01';
        const now = new Date();
        const currentRealMonth = now.toISOString().slice(0, 7);

        if (state.currentMonth === currentRealMonth) {
            dateStr = now.toISOString().slice(0, 10);
        }

        const newTx = {
            id: Date.now().toString(),
            type,
            category,
            description,
            amount: parseFloat(amount),
            date: dateStr
        };

        state.transactions.push(newTx);
        saveState();
        renderApp();
    }

    function editTransaction(id, updates) {
        const idx = state.transactions.findIndex(t => t.id === id);
        if (idx !== -1) {
            state.transactions[idx] = { ...state.transactions[idx], ...updates };
            saveState();
            renderApp();
        }
    }

    function deleteTransaction(id) {
        if (confirm('¿Eliminar esta transacción?')) {
            state.transactions = state.transactions.filter(t => t.id !== id);
            saveState();
            renderApp();
        }
    }

    function changeMonth(offset) {
        const [year, month] = state.currentMonth.split('-').map(Number);
        const newDate = new Date(year, month - 1 + offset, 1);
        const newMonthStr = newDate.toISOString().slice(0, 7);

        // Smart Persistence: Copy logic
        // Check if new month has data. If NOT, and we are moving FORWARD to a month that "doesn't exist yet" in data
        // (conceptually), we might want to copy recurring? 
        // For this MVP, let's check: if moving forward and target month has 0 transactions, 
        // ask or auto-copy "Fixed Expenses"? 
        // Let's implement the simpler requirement: "Copy structure automatically"
        // We will just copy layout? No, user usually wants previous recurring expenses.
        // Let's just switch for now. The requirement said "copy structure of previous month".
        // That means if I go from Jan to Feb, and Feb is empty, copy Jan's items but updated to Feb dates? 
        // That creates data automatically. Let's be careful.
        // Let's do: If target month is empty AND is immediately next to a month with data, COPY items marked as "Fixed"?
        // Since we don't have "Fixed" tag formally in the item object (only category list), let's skip complex auto-gen 
        // to avoid duplicate data bugs, unless explicitly requested.
        // Re-reading req: "Al cambiar a un mes nuevo sin datos, la app debe copiar automáticamente la estructura..."

        const targetData = state.transactions.filter(t => t.date.startsWith(newMonthStr));
        if (targetData.length === 0 && offset > 0) {
            // We are moving forward to an empty month. Copy from the month we just left.
            // Filter user's current view transactions
            const sourceData = getDataForMonth(state.currentMonth);
            if (sourceData.length > 0) {
                // Clone them with new date
                const clones = sourceData.map(t => ({
                    ...t,
                    id: Math.random().toString(36).substr(2, 9), // New ID
                    date: newMonthStr + '-01' // Set to first of new month
                }));
                // Confirm with user? Or just do it locally? Req says "automatically".
                // Let's do it but maybe notify?
                console.log(`Auto-copied ${clones.length} transactions to ${newMonthStr}`);
                state.transactions.push(...clones);
                saveState();
            }
        }

        state.currentMonth = newMonthStr;
        saveState();
        renderApp();
    }

    // --- UI Rendering ---

    function formatMoney(amount) {
        return new Intl.NumberFormat(CONFIG.currencyLocales[state.currency], {
            style: 'currency',
            currency: state.currency
        }).format(amount);
    }

    function renderApp() {
        // Update Header
        const [year, month] = state.currentMonth.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        document.getElementById('currentMonthDisplay').textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        document.getElementById('currencySelect').value = state.currency;

        // Process Data
        const monthTransactions = getDataForMonth(state.currentMonth);

        let income = 0;
        let expenses = 0;
        let savings = 0; // Treated as "Out" for flow? Or separate? 
        // Usually Savings reduces "Available" but is an asset.
        // Req: "Available = Income - Expenses". 
        // Let's count Savings as an "Expense" to cash flow (money leaves pocket to bank), 
        // or keep separate. Let's treat Savings as separate category visually, 
        // but for "Available" math: Available = Income - (Expenses + Savings).

        const incomeList = [];
        const expenseList = [];
        const savingList = [];

        monthTransactions.forEach(t => {
            if (t.type === 'income') {
                income += t.amount;
                incomeList.push(t);
            } else if (t.type === 'expense') {
                expenses += t.amount;
                expenseList.push(t);
            } else if (t.type === 'saving') {
                savings += t.amount;
                savingList.push(t);
            }
        });

        const totalOut = expenses + savings;
        const available = income - totalOut;

        // Render Cards
        document.getElementById('totalAvailable').textContent = formatMoney(available);
        document.getElementById('totalIncome').textContent = formatMoney(income);
        document.getElementById('totalExpenses').textContent = formatMoney(totalOut); // Including savings in total out flow? 
        // Actually, "Egresos" usually means expenses. Savings are preserved. 
        // Let's show Total Egresos = Expenses only? 
        // But then Available calculation matches? 
        // If Available = Income - Expenses, then Savings is part of Available? 
        // Decisions... Let's stick to standard budget: Available to Spend = Income - (Expenses + Savings).
        // So Savings are "commited". 
        // Let's display "Total Egresos" as Expenses + Savings for the math to balance visually in "Flow".

        // Budget Health Bar
        const bar = document.getElementById('budgetHealthBar');
        if (income > 0) {
            const percentAvailable = Math.max(0, Math.min(100, (available / income) * 100));
            bar.style.width = `${percentAvailable}%`;
            // Color coding
            if (percentAvailable < 20) bar.className = 'h-2 rounded-full bg-rose-500';
            else if (percentAvailable < 50) bar.className = 'h-2 rounded-full bg-yellow-500';
            else bar.className = 'h-2 rounded-full bg-emerald-500';
        } else {
            bar.style.width = '0%';
        }

        // Render Tables
        renderTable('incomeTableBody', incomeList);
        renderTable('expenseTableBody', expenseList);
        renderTable('savingsTableBody', savingList);

        // Update Charts
        updateCharts(income, expenses, savings, monthTransactions);
    }

    function renderTable(elementId, list) {
        const tbody = document.getElementById(elementId);
        tbody.innerHTML = '';

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400 italic">Sin datos</td></tr>`;
            return;
        }

        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors';
            tr.innerHTML = `
                <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">${item.category}</td>
                <td class="px-4 py-3 text-slate-500 dark:text-slate-400">${item.description}</td>
                <td class="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">${formatMoney(item.amount)}</td>
                <td class="px-4 py-3 text-center">
                    <button class="text-indigo-600 hover:text-indigo-900 mx-1" onclick="app.editModal('${item.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="text-rose-600 hover:text-rose-900 mx-1" onclick="app.deleteItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- Charts (Chart.js) ---

    function getChartTheme() {
        // Check if dark mode is active
        const isDark = document.documentElement.classList.contains('dark');
        return {
            color: isDark ? '#cbd5e1' : '#475569', // text-slate-300 vs slate-600
            grid: isDark ? '#334155' : '#e2e8f0' // slate-700 vs slate-200
        };
    }

    function setupCharts() {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: getChartTheme().color }
                }
            },
            scales: {
                x: {
                    ticks: { color: getChartTheme().color },
                    grid: { color: getChartTheme().grid }
                },
                y: {
                    ticks: { color: getChartTheme().color },
                    grid: { color: getChartTheme().grid }
                }
            }
        };

        // 1. Cash Flow
        const ctxFlow = document.getElementById('cashFlowChart').getContext('2d');
        charts.cashFlow = new Chart(ctxFlow, {
            type: 'bar',
            data: {
                labels: ['Ingresos', 'Gastos', 'Ahorros'],
                datasets: [{
                    label: 'Flujo',
                    data: [0, 0, 0],
                    backgroundColor: ['#10b981', '#f43f5e', '#06b6d4'],
                    borderRadius: 8
                }]
            },
            options: commonOptions
        });

        // 2. Distribution (Donut)
        const ctxDist = document.getElementById('distributionChart').getContext('2d');
        charts.distribution = new Chart(ctxDist, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#f43f5e', '#facc15', '#a855f7', '#3b82f6', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: getChartTheme().color }
                    }
                }
            }
        });

        // 3. History
        const ctxHist = document.getElementById('historyChart').getContext('2d');
        charts.history = new Chart(ctxHist, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Ingresos',
                        borderColor: '#10b981',
                        backgroundColor: '#10b981',
                        borderWidth: 2,
                        tension: 0.4,
                        data: []
                    },
                    {
                        label: 'Egresos',
                        borderColor: '#f43f5e',
                        backgroundColor: '#f43f5e',
                        borderWidth: 2,
                        tension: 0.4,
                        data: []
                    }
                ]
            },
            options: commonOptions
        });
    }

    function updateCharts(income, expenses, savings, transactions) {
        const theme = getChartTheme();

        // Update Colors (if theme changed)
        [charts.cashFlow, charts.history].forEach(chart => {
            chart.options.scales.x.ticks.color = theme.color;
            chart.options.scales.y.ticks.color = theme.color;
            chart.options.scales.x.grid.color = theme.grid;
            chart.options.scales.y.grid.color = theme.grid;
            chart.options.plugins.legend.labels.color = theme.color;
        });
        charts.distribution.options.plugins.legend.labels.color = theme.color;

        // 1. Cash Flow
        charts.cashFlow.data.datasets[0].data = [income, expenses, savings];
        charts.cashFlow.update();

        // 2. Distribution (Expenses by Category)
        const expenseMap = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
        });
        charts.distribution.data.labels = Object.keys(expenseMap);
        charts.distribution.data.datasets[0].data = Object.values(expenseMap);
        charts.distribution.update();

        // 3. History (Last 6 months)
        // This requires getting data for previous months from state
        const historyLabels = [];
        const historyIncome = [];
        const historyExpenses = [];

        const [currY, currM] = state.currentMonth.split('-').map(Number);

        for (let i = 5; i >= 0; i--) {
            const date = new Date(currY, currM - 1 - i, 1);
            const monStr = date.toISOString().slice(0, 7);
            const label = date.toLocaleString('es-ES', { month: 'short' });

            historyLabels.push(label);

            // Calc totals for that month
            const txs = state.transactions.filter(t => t.date.startsWith(monStr));
            const inc = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const exp = txs.filter(t => t.type === 'expense' || t.type === 'saving').reduce((acc, t) => acc + t.amount, 0); // Treating saving as egress for chart

            historyIncome.push(inc);
            historyExpenses.push(exp);
        }

        charts.history.data.labels = historyLabels;
        charts.history.data.datasets[0].data = historyIncome;
        charts.history.data.datasets[1].data = historyExpenses;
        charts.history.update();
    }

    // --- Modal & Form Handling ---

    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');

    function openModal(type) {
        document.getElementById('formType').value = type;
        document.getElementById('formId').value = ''; // clear ID
        document.getElementById('modalTitle').textContent = type === 'income' ? 'Agregar Ingreso' : (type === 'expense' ? 'Agregar Gasto' : 'Agregar Ahorro');
        form.reset();
        fillCategories(type);
        modal.classList.remove('hidden');
    }

    function editModal(id) {
        const t = state.transactions.find(tx => tx.id === id);
        if (!t) return;

        document.getElementById('formType').value = t.type;
        document.getElementById('formId').value = t.id;
        document.getElementById('modalTitle').textContent = 'Editar Transacción';

        fillCategories(t.type);
        document.getElementById('category').value = t.category;
        document.getElementById('amount').value = t.amount;
        document.getElementById('description').value = t.description;

        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    function fillCategories(type) {
        const select = document.getElementById('category');
        select.innerHTML = '';
        getCategories(type).forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
    }

    function promptNewCategory() {
        const newCat = prompt('Nombre de la nueva categoría:');
        if (newCat) {
            const type = document.getElementById('formType').value;
            if (!state.customCategories[type].includes(newCat)) {
                state.customCategories[type].push(newCat);
                saveState();
                fillCategories(type); // refresh
                document.getElementById('category').value = newCat; // select it
            }
        }
    }

    function saveTransaction() {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const type = document.getElementById('formType').value;
        const id = document.getElementById('formId').value;
        const category = document.getElementById('category').value;
        const amount = document.getElementById('amount').value;
        const description = document.getElementById('description').value;

        if (id) {
            editTransaction(id, { category, amount: parseFloat(amount), description });
        } else {
            addTransaction(type, category, description, amount);
        }

        closeModal();
    }

    // --- Event Listeners ---

    function setupEventListeners() {
        document.getElementById('prevMonthBtn').addEventListener('click', () => changeMonth(-1));
        document.getElementById('nextMonthBtn').addEventListener('click', () => changeMonth(1));

        document.getElementById('currencySelect').addEventListener('change', (e) => {
            state.currency = e.target.value;
            saveState();
            renderApp();
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            renderApp(); // re-render to update charts theme
        });

        document.getElementById('resetAppBtn').addEventListener('click', resetData);

        document.getElementById('exportBtn').addEventListener('click', () => {
            window.print();
        });
    }

    // Expose public methods for HTML onclick attributes
    return {
        init,
        openModal,
        closeModal,
        saveTransaction,
        editModal,
        deleteItem: deleteTransaction,
        promptNewCategory
    };

})();

// Start App
document.addEventListener('DOMContentLoaded', app.init);
