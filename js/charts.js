/**
 * Charts Module
 * Handles data visualization using Chart.js
 */

const Charts = {
    charts: {},

    /**
     * Initialize historical income/expense chart
     * @param {string} canvasId 
     */
    initHistoricalChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const historicalData = Storage.getHistoricalData(6);

        // Destroy existing chart if any
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#e2e8f0' : '#334155';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historicalData.map(d => {
                    const [year, month] = d.month.split('-');
                    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    return monthNames[parseInt(month) - 1];
                }),
                datasets: [
                    {
                        label: 'Ingresos',
                        data: historicalData.map(d => d.income),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: '#10b981'
                    },
                    {
                        label: 'Egresos',
                        data: historicalData.map(d => d.expenses),
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: '#f43f5e'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDark ? '#475569' : '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + Currency.format(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 11
                            },
                            callback: function (value) {
                                return Currency.format(value);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },

    /**
     * Initialize current month breakdown chart
     * @param {string} canvasId 
     * @param {object} monthData 
     */
    initBreakdownChart(canvasId, monthData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart if any
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // Calculate data from cards - include expenses and transfers (GIROS)
        const expenseCards = monthData.cards?.filter(c => c.type === 'expense' || c.type === 'transfer') || [];
        const labels = [];
        const data = [];
        const colors = [];

        // Contrasting color palette with darker tones for different expense cards
        const colorPalette = [
            '#dc2626',    // red-600 (GASTOS FIJOS - dark red)
            '#f97316',    // orange-500 (GASTOS VARIADOS - orange)
            '#7c3aed',    // violet-600 (GIROS - dark purple)
            '#0369a1',    // sky-700 (dark blue)
            '#047857',    // emerald-700 (dark green)
            '#b91c1c',    // red-700 (darker red)
            '#92400e',    // amber-800 (dark amber)
            '#be123c',    // rose-700 (dark rose)
            '#0e7490',    // cyan-700 (dark cyan)
            '#4338ca'     // indigo-700 (dark indigo)
        ];

        expenseCards.forEach((card, index) => {
            const total = card.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
            if (total > 0) {
                labels.push(card.title);
                data.push(total);
                // Assign unique color from palette
                colors.push(colorPalette[index % colorPalette.length]);
            }
        });

        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#e2e8f0' : '#334155';

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: isDark ? '#0f172a' : '#ffffff',
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: textColor,
                            font: {
                                size: 11
                            },
                            padding: 10,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDark ? '#475569' : '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = Currency.format(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return label + ': ' + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Update all charts
     * @param {object} monthData 
     */
    updateAll(monthData) {
        this.initHistoricalChart('historicalChart');
        this.initBreakdownChart('breakdownChart', monthData);
    },

    /**
     * Destroy all charts (useful when changing themes)
     */
    destroyAll() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    }
};

// Make Charts available globally
if (typeof window !== 'undefined') {
    window.Charts = Charts;
}
