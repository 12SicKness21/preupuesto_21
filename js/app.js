/**
 * Main Application Controller
 * Coordinates all modules and handles app initialization
 */

const App = {
    currentMonthKey: null,
    hasUnsavedChanges: false,
    previousMonthKey: null,

    /**
     * Initialize the application
     */
    init() {
        // Check authentication
        Auth.requireAuth();

        // Initialize theme
        this.initTheme();

        // Initialize currency
        Currency.init();
        Currency.populateSelector('currencySelect');

        // Set up currency change listener
        document.getElementById('currencySelect').addEventListener('change', (e) => {
            Currency.setCurrency(e.target.value);
            this.refreshView();
        });

        // Initialize calendar
        Calendar.init('calendarContainer', (monthKey) => {
            this.handleMonthNavigation(monthKey);
        });

        // Load current month and prepare next month
        this.currentMonthKey = Calendar.getCurrentMonthKey();
        this.previousMonthKey = this.currentMonthKey;
        this.loadMonth(this.currentMonthKey);

        // Pre-create next month's data if it doesn't exist
        // This ensures smooth navigation and prevents month-skipping issues
        const nextMonthKey = this.getNextMonthKey(this.currentMonthKey);
        const nextMonthData = Storage.getMonthData(nextMonthKey);
        if (!nextMonthData) {
            // Copy current month data to next month
            const currentData = Storage.getMonthData(this.currentMonthKey);
            if (currentData) {
                Storage.copyMonthDataToNext(this.currentMonthKey, nextMonthKey);
                console.log(`📋 Pre-creando datos para ${nextMonthKey}`);
            }
        }

        // Prevent accidental navigation away
        window.addEventListener('beforeunload', (e) => {
            if (this.currentMonthKey && Storage.isMonthModified && Storage.isMonthModified(this.currentMonthKey)) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        console.log('✅ Presupuesto Mensual 21 initialized successfully');
    },

    /**
     * Get next month key from current month key
     * @param {string} monthKey - Format: "YYYY-MM"
     * @returns {string} Next month key in "YYYY-MM" format
     */
    getNextMonthKey(monthKey) {
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        date.setMonth(date.getMonth() + 1);
        const nextYear = date.getFullYear();
        const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
        return `${nextYear}-${nextMonth}`;
    },

    /**
     * Handle month navigation with auto-save logic
     * @param {string} newMonthKey 
     */
    handleMonthNavigation(newMonthKey) {
        // If this is the first load or same month, just load it
        if (!this.previousMonthKey || this.previousMonthKey === newMonthKey) {
            this.loadMonth(newMonthKey);
            this.previousMonthKey = newMonthKey;
            return;
        }

        // Check if we're moving forward to next month
        const [prevYear, prevMonth] = this.previousMonthKey.split('-').map(Number);
        const prevDate = new Date(prevYear, prevMonth - 1);
        const [newYear, newMonth] = newMonthKey.split('-').map(Number);
        const newDate = new Date(newYear, newMonth - 1);
        const isMovingForward = newDate > prevDate;

        if (isMovingForward) {
            // Save current month data first
            if (Cards.currentMonthData && Cards.currentMonthKey) {
                Storage.saveMonthData(Cards.currentMonthKey, Cards.currentMonthData);
                console.log(`💾 Guardando cambios de ${Cards.currentMonthKey}`);
            }

            // Always ask user if they want to copy data to next month
            const shouldCopy = confirm('¿Deseas copiar los datos del mes actual al siguiente mes?');

            if (shouldCopy) {
                // Copy data to next month
                Storage.copyMonthDataToNext(this.currentMonthKey, newMonthKey);
                console.log(`📋 Copiando datos a ${newMonthKey}`);
            } else {
                console.log(`⏭️ Avanzando a ${newMonthKey} sin copiar datos`);
            }

            // Load the month (with or without copied data)
            this.loadMonth(newMonthKey);
            this.previousMonthKey = newMonthKey;
        } else {
            // Moving backward - just load the month
            this.loadMonth(newMonthKey);
            this.previousMonthKey = newMonthKey;
        }
    },

    /**
     * Check if current month data has been modified
     * @param {string} monthKey 
     * @returns {boolean}
     */
    hasMonthChanged(monthKey) {
        const currentData = Storage.getMonthData(monthKey);
        if (!currentData) return false;

        let referenceData;

        // Check if data was copied from another month
        if (currentData.copiedFrom) {
            // Compare with the source month
            referenceData = Storage.getMonthData(currentData.copiedFrom);
        } else {
            // Compare with default structure
            referenceData = Storage.getDefaultMonthStructure();
        }

        if (!referenceData) return false;

        // Compare ignoring dates (only check structure, names, and amounts)
        return this.hasDataChanged(currentData.cards, referenceData.cards);
    },

    /**
     * Compare two card arrays, ignoring dates
     * @param {Array} currentCards 
     * @param {Array} referenceCards 
     * @returns {boolean} true if data has changed
     */
    hasDataChanged(currentCards, referenceCards) {
        // Check if number of cards changed
        if (currentCards.length !== referenceCards.length) return true;

        // Check each card
        for (let i = 0; i < currentCards.length; i++) {
            const currentCard = currentCards[i];
            const referenceCard = referenceCards[i];

            if (!referenceCard) return true;
            if (currentCard.items.length !== referenceCard.items.length) return true;

            // Check if any item name or amount changed (ignore dates)
            for (let j = 0; j < currentCard.items.length; j++) {
                const currentItem = currentCard.items[j];
                const referenceItem = referenceCard.items[j];

                if (currentItem.amount !== referenceItem.amount) return true;
                if (currentItem.name !== referenceItem.name) return true;
                // Note: We intentionally ignore date differences
            }
        }

        return false;
    },

    /**
     * Auto-save current month and copy to next month with updated dates
     * @param {string} nextMonthKey 
     */
    autoSaveAndCopy(nextMonthKey) {
        const currentData = Storage.getMonthData(this.previousMonthKey);
        if (!currentData) {
            this.loadMonth(nextMonthKey);
            this.previousMonthKey = nextMonthKey;
            return;
        }


        // Copy current month data to next month (will overwrite if it already exists)
        const copiedData = JSON.parse(JSON.stringify(currentData));
        copiedData.copiedFrom = this.previousMonthKey;

        // Update all item dates to the next month
        const [nextYear, nextMonth] = nextMonthKey.split('-').map(Number);
        copiedData.cards.forEach(card => {
            if (card.items) {
                card.items.forEach(item => {
                    if (item.date) {
                        const dateParts = item.date.split('-');
                        if (dateParts.length === 3) {
                            const day = parseInt(dateParts[2]);
                            // Get the number of days in the next month
                            const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
                            // If the day exceeds the days in next month, use the last day
                            const adjustedDay = Math.min(day, daysInNextMonth);
                            item.date = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;
                        }
                    }
                });
            }
        });

        // Save to next month
        Storage.saveMonthData(nextMonthKey, copiedData);

        // Load the next month
        this.loadMonth(nextMonthKey);
        this.previousMonthKey = nextMonthKey;
        this.hasUnsavedChanges = false;

        console.log(`✅ Datos copiados automáticamente a ${nextMonthKey}`);
    },

    /**
     * Load data for a specific month
     * @param {string} monthKey 
     */
    loadMonth(monthKey) {
        this.currentMonthKey = monthKey;
        Cards.loadMonth(monthKey);
        this.hasUnsavedChanges = false;

        console.log(`📅 Loaded month: ${monthKey}`);
    },

    /**
     * Refresh the current view (useful after currency change)
     */
    refreshView() {
        Cards.renderAllCards();
        Cards.updateTotals();
    },

    /**
     * Save current month data
     */
    saveData() {
        // Data is already saved in real-time, but we ask about copying to next month
        const shouldCopy = confirm('✅ Datos guardados.\n\n¿Deseas copiar estos datos al siguiente mes?');

        if (shouldCopy) {
            const nextMonthKey = Storage.copyToNextMonth(this.currentMonthKey);
            if (nextMonthKey) {
                alert(`✅ Datos copiados al mes ${nextMonthKey}`);

                // Optionally navigate to next month
                const goToNext = confirm('¿Deseas ir al siguiente mes ahora?');
                if (goToNext) {
                    const [year, month] = nextMonthKey.split('-').map(Number);
                    Calendar.goToMonth(year, month);
                    this.loadMonth(nextMonthKey);
                }
            }
        }

        this.hasUnsavedChanges = false;
    },

    /**
     * Initialize theme from storage
     */
    initTheme() {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    /**
     * Toggle dark/light theme
     */
    toggleTheme() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }

        // Redraw charts with new theme
        Charts.destroyAll();
        setTimeout(() => {
            Cards.updateTotals(); // This will recreate charts
        }, 100);
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Make App available globally
if (typeof window !== 'undefined') {
    window.App = App;
}
