/**
 * Currency Module
 * Handles currency selection and formatting
 */

const Currency = {
    currencies: {
        USD: { symbol: '$', name: 'Dólar (USD)', locale: 'en-US' },
        EUR: { symbol: '€', name: 'Euro (EUR)', locale: 'es-ES' },
        MXN: { symbol: '$', name: 'Peso Mexicano (MXN)', locale: 'es-MX' },
        COP: { symbol: '$', name: 'Peso Colombiano (COP)', locale: 'es-CO' },
        ARS: { symbol: '$', name: 'Peso Argentino (ARS)', locale: 'es-AR' },
        CLP: { symbol: '$', name: 'Peso Chileno (CLP)', locale: 'es-CL' },
        PEN: { symbol: 'S/', name: 'Sol Peruano (PEN)', locale: 'es-PE' }
    },

    current: 'EUR',

    /**
     * Initialize currency from storage
     */
    init() {
        const config = Storage.getConfig();
        this.current = config.currency || 'USD';
    },

    /**
     * Set current currency
     * @param {string} code - Currency code
     */
    setCurrency(code) {
        if (this.currencies[code]) {
            this.current = code;
            const config = Storage.getConfig();
            config.currency = code;
            Storage.saveConfig(config);
        }
    },

    /**
     * Get current currency symbol
     * @returns {string}
     */
    getSymbol() {
        return this.currencies[this.current]?.symbol || '$';
    },

    /**
     * Format amount with current currency
     * @param {number} amount 
     * @param {boolean} showSymbol 
     * @returns {string}
     */
    format(amount, showSymbol = true) {
        const num = parseFloat(amount) || 0;
        const currencyInfo = this.currencies[this.current];

        // Format number with locale
        let formatted = num.toLocaleString(currencyInfo.locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return showSymbol ? `${currencyInfo.symbol}${formatted}` : formatted;
    },

    /**
     * Populate currency selector
     * @param {string} selectId - ID of select element
     */
    populateSelector(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '';

        Object.entries(this.currencies).forEach(([code, info]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = info.name;
            if (code === this.current) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
};

// Make Currency available globally
if (typeof window !== 'undefined') {
    window.Currency = Currency;
}
