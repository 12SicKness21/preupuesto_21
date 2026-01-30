/**
 * Calendar Module
 * Interactive calendar component with month navigation
 */

const Calendar = {
    currentDate: new Date(),
    selectedDate: null,
    onDateSelect: null,

    /**
     * Initialize calendar
     * @param {string} containerId - ID of container element
     * @param {function} onDateSelectCallback - Callback when date is selected
     */
    init(containerId, onDateSelectCallback) {
        this.container = document.getElementById(containerId);
        this.onDateSelect = onDateSelectCallback;
        this.selectedDate = new Date();
        this.render();
    },

    /**
     * Get current month key
     * @returns {string} Format: "YYYY-MM"
     */
    getCurrentMonthKey() {
        const year = this.currentDate.getFullYear();
        const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },

    /**
     * Navigate to previous month
     */
    previousMonth() {
        // CRITICAL: Set to day 1 first to prevent month overflow
        this.currentDate.setDate(1);
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
        if (this.onDateSelect) {
            this.onDateSelect(this.getCurrentMonthKey());
        }
    },

    /**
     * Navigate to next month
     */
    nextMonth() {
        // CRITICAL: Set to day 1 first to prevent month overflow
        this.currentDate.setDate(1);
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
        if (this.onDateSelect) {
            this.onDateSelect(this.getCurrentMonthKey());
        }
    },

    /**
     * Go to specific month
     * @param {number} year 
     * @param {number} month - 1-indexed (1 = January)
     */
    goToMonth(year, month) {
        this.currentDate = new Date(year, month - 1, 1);
        this.render();
    },

    /**
     * Select a specific date
     * @param {number} day 
     */
    selectDate(day) {
        this.selectedDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth(),
            day
        );
        this.render();
        if (this.onDateSelect) {
            this.onDateSelect(this.getCurrentMonthKey(), this.selectedDate);
        }
    },

    /**
     * Get month name in Spanish
     * @param {number} month - 0-indexed
     * @returns {string}
     */
    getMonthName(month) {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[month];
    },

    /**
     * Get day name in Spanish
     * @param {number} day - 0-indexed (0 = Sunday)
     * @returns {string}
     */
    getDayName(day) {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[day];
    },

    /**
     * Render calendar - Simplified to show only month/year
     */
    render() {
        if (!this.container) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        let html = `
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <!-- Calendar Header -->
                <div class="text-white p-3" style="background: linear-gradient(to right, #0066CC, #0052A3);">

                    <div class="flex items-center justify-between">
                        <button onclick="Calendar.previousMonth()" class="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Mes anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <h3 class="text-xl font-bold">${this.getMonthName(month)} ${year}</h3>
                        <button onclick="Calendar.nextMonth()" class="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Mes siguiente">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;



        this.container.innerHTML = html;
    },

    /**
     * Get formatted date string
     * @returns {string}
     */
    getFormattedDate() {
        if (!this.selectedDate) return '';

        const day = this.selectedDate.getDate();
        const month = this.getMonthName(this.selectedDate.getMonth());
        const year = this.selectedDate.getFullYear();

        return `${day} de ${month} de ${year}`;
    }
};

// Make Calendar available globally
if (typeof window !== 'undefined') {
    window.Calendar = Calendar;
}
