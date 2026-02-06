/**
 * Storage Module
 * Handles all data persistence in localStorage
 */

const Storage = {
    DATA_KEY: 'pm21_budget_data',
    CONFIG_KEY: 'pm21_config',

    /**
     * Get all budget data
     * @returns {object} Data structure: { "2026-01": { cards: [...], metadata: {...} }, ... }
     */
    getData() {
        const data = localStorage.getItem(this.DATA_KEY);
        return data ? JSON.parse(data) : {};
    },

    /**
     * Get data for a specific month
     * @param {string} monthKey - Format: "YYYY-MM"
     * @returns {object|null}
     */
    getMonthData(monthKey) {
        const allData = this.getData();
        return allData[monthKey] || null;
    },

    /**
     * Save data for a specific month
     * @param {string} monthKey - Format: "YYYY-MM"
     * @param {object} monthData
     */
    saveMonthData(monthKey, monthData) {
        const allData = this.getData();
        allData[monthKey] = {
            ...monthData,
            lastModified: new Date().toISOString()
        };
        localStorage.setItem(this.DATA_KEY, JSON.stringify(allData));
    },

    /**
     * Copy current month data to next month
     * @param {string} currentMonthKey - Format: "YYYY-MM"
     * @returns {string} Next month key
     */
    copyToNextMonth(currentMonthKey) {
        const currentData = this.getMonthData(currentMonthKey);
        if (!currentData) return null;

        // Calculate next month
        const [year, month] = currentMonthKey.split('-').map(Number);
        const nextDate = new Date(year, month, 1); // month is 0-indexed in Date
        const nextMonthKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

        // Copy data (deep clone)
        const nextMonthData = JSON.parse(JSON.stringify(currentData));
        nextMonthData.copiedFrom = currentMonthKey;

        // Reset all checkboxes to unchecked state for the new month
        nextMonthData.cards.forEach(card => {
            if (card.items) {
                card.items.forEach(item => {
                    item.completed = false;
                });
            }
        });

        this.saveMonthData(nextMonthKey, nextMonthData);
        return nextMonthKey;
    },

    /**
     * Initialize default cards structure for a new month
     * @returns {object}
     */
    getDefaultMonthStructure() {
        // Get current month for building date strings
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        // Helper function to create date for specific day of current month
        const getDate = (day) => `${year}-${month}-${String(day).padStart(2, '0')}`;

        return {
            cards: [
                {
                    id: 'ingreso',
                    title: 'INGRESO',
                    type: 'income',
                    editable: true,
                    items: [
                        { id: 'ingreso1', name: 'Salario', amount: 1500, notes: '', date: getDate(1), completed: false },
                        { id: 'ingreso2', name: 'Freelance', amount: 300, notes: '', date: getDate(15), completed: false }
                    ]
                },
                {
                    id: 'ahorros',
                    title: 'AHORROS',
                    type: 'savings',
                    editable: true,
                    cumulative: true,
                    items: [
                        { id: 'ahorro1', name: 'Fondo Emergencia', amount: 200, notes: '', date: getDate(1), completed: false },
                        { id: 'ahorro2', name: 'Inversiones', amount: 100, notes: '', date: getDate(1), completed: false }
                    ]
                },
                {
                    id: 'gastos-fijos',
                    title: 'GASTOS FIJOS',
                    type: 'expense',
                    editable: true,
                    items: [
                        { id: 'fijo1', name: 'Alquiler / Hipoteca', amount: 900, notes: '', date: getDate(5), completed: false },
                        { id: 'fijo2', name: 'Servicios', amount: 100, notes: '', date: getDate(10), completed: false },
                        { id: 'fijo3', name: 'Abono transporte', amount: 40, notes: '', date: getDate(1), completed: false },
                        { id: 'fijo4', name: 'Suscripciones', amount: 50, notes: '', date: getDate(15), completed: false }
                    ]
                },
                {
                    id: 'gastos-variados',
                    title: 'GASTOS VARIADOS',
                    type: 'expense',
                    editable: true,
                    items: [
                        { id: 'var1', name: 'Comida', amount: 200, notes: '', date: getDate(1), completed: false },
                        { id: 'var2', name: 'Aseo personal', amount: 20, notes: '', date: getDate(1), completed: false },
                        { id: 'var3', name: 'Salidas', amount: 150, notes: '', date: getDate(1), completed: false }
                    ]
                },
                {
                    id: 'giros',
                    title: 'GIROS',
                    type: 'transfer',
                    editable: true,
                    items: []
                }
            ],
            metadata: {
                created: new Date().toISOString()
            }
        };
    },

    /**
     * Get or create month data
     * @param {string} monthKey 
     * @returns {object}
     */
    getOrCreateMonthData(monthKey) {
        let data = this.getMonthData(monthKey);
        if (!data) {
            data = this.getDefaultMonthStructure();
            this.saveMonthData(monthKey, data);
        }
        return data;
    },

    /**
     * Calculate cumulative savings up to a specific month
     * @param {string} monthKey - Format: "YYYY-MM"
     * @param {string} savingsCardId - ID of savings card
     * @returns {number}
     */
    getCumulativeSavings(monthKey, savingsCardId = 'ahorros') {
        const allData = this.getData();
        const monthKeys = Object.keys(allData).sort();

        let total = 0;
        for (const key of monthKeys) {
            if (key > monthKey) break;

            const monthData = allData[key];
            const savingsCard = monthData.cards?.find(c => c.id === savingsCardId);
            if (savingsCard && savingsCard.items) {
                savingsCard.items.forEach(item => {
                    if (item.completed) {
                        total += parseFloat(item.amount) || 0;
                    }
                });
            }
        }

        return total;
    },

    /**
     * Calculate remaining loan balance
     * @param {string} monthKey 
     * @param {string} loanCardId 
     * @returns {number}
     */
    getRemainingLoan(monthKey, loanCardId = 'prestamo') {
        const allData = this.getData();
        const monthKeys = Object.keys(allData).sort();

        let loanTotal = 0;
        let totalPayments = 0;

        for (const key of monthKeys) {
            if (key > monthKey) break;

            const monthData = allData[key];
            const loanCard = monthData.cards?.find(c => c.id === loanCardId);

            if (loanCard) {
                // Get initial loan total from the first month it appears
                if (loanCard.loanTotal && loanTotal === 0) {
                    loanTotal = parseFloat(loanCard.loanTotal) || 0;
                }

                // Sum all payments
                if (loanCard.items) {
                    loanCard.items.forEach(item => {
                        totalPayments += parseFloat(item.amount) || 0;
                    });
                }
            }
        }

        return Math.max(0, loanTotal - totalPayments);
    },

    /**
     * Get app configuration
     * @returns {object}
     */
    getConfig() {
        const config = localStorage.getItem(this.CONFIG_KEY);
        return config ? JSON.parse(config) : {
            currency: 'EUR',
            theme: localStorage.theme || 'light'
        };
    },

    /**
     * Save app configuration
     * @param {object} config 
     */
    saveConfig(config) {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    },

    /**
     * Reset all data (nuclear option)
     */
    resetAll() {
        if (confirm('⚠️ ¿Estás seguro de que deseas eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            localStorage.removeItem(this.DATA_KEY);
            localStorage.removeItem(this.CONFIG_KEY);
            window.location.reload();
        }
    },

    /**
     * Get historical data for charts (last N months)
     * @param {number} months - Number of months to retrieve
     * @returns {array}
     */
    getHistoricalData(months = 6) {
        const allData = this.getData();
        const monthKeys = Object.keys(allData).sort().slice(-months);

        return monthKeys.map(key => {
            const monthData = allData[key];
            let income = 0;
            let expenses = 0;

            monthData.cards?.forEach(card => {
                let total = 0;

                // For savings cards, only sum checked items
                if (card.type === 'savings') {
                    total = card.items?.reduce((sum, item) => {
                        if (item.completed) {
                            return sum + (parseFloat(item.amount) || 0);
                        }
                        return sum;
                    }, 0) || 0;
                } else {
                    // For other cards, sum all items
                    total = card.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
                }

                if (card.type === 'income') {
                    income += total;
                } else if (card.type === 'expense' || card.type === 'savings' || card.type === 'transfer') {
                    expenses += total;
                }
            });

            return {
                month: key,
                income,
                expenses,
                balance: income - expenses
            };
        });
    },

    /**
     * Copy month data to a specific target month with date adjustments
     * @param {string} sourceMonthKey - Source month in "YYYY-MM" format
     * @param {string} targetMonthKey - Target month in "YYYY-MM" format
     */
    copyMonthDataToNext(sourceMonthKey, targetMonthKey) {
        const sourceData = this.getMonthData(sourceMonthKey);
        if (!sourceData) {
            console.warn(`No data found for source month ${sourceMonthKey}`);
            return;
        }

        // Deep clone the source data
        const copiedData = JSON.parse(JSON.stringify(sourceData));
        copiedData.copiedFrom = sourceMonthKey;

        // Update all item dates to the target month and reset checkboxes
        const [targetYear, targetMonth] = targetMonthKey.split('-').map(Number);
        copiedData.cards.forEach(card => {
            if (card.items) {
                card.items.forEach(item => {
                    // Reset checkbox state for new month
                    item.completed = false;

                    // Update date to target month
                    if (item.date) {
                        const dateParts = item.date.split('-');
                        if (dateParts.length === 3) {
                            const day = parseInt(dateParts[2]);
                            // Get the number of days in the target month
                            const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
                            // If the day exceeds the days in target month, use the last day
                            const adjustedDay = Math.min(day, daysInTargetMonth);
                            item.date = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;
                        }
                    }
                });
            }
        });

        // Save to target month
        this.saveMonthData(targetMonthKey, copiedData);
        console.log(`✅ Datos copiados desde ${sourceMonthKey} a ${targetMonthKey}`);
    }
};

// Make Storage available globally
if (typeof window !== 'undefined') {
    window.Storage = Storage;
}
