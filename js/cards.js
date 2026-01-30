/**
 * Budget Cards Module
 * Manages budget cards and their items with new checkbox and date features
 */

const Cards = {
    currentMonthData: null,
    currentMonthKey: null,
    currentEditingCard: null,

    /**
     * Load and render cards for a specific month
     * @param {string} monthKey 
     */
    loadMonth(monthKey) {
        this.currentMonthKey = monthKey;
        this.currentMonthData = Storage.getOrCreateMonthData(monthKey);
        this.renderAllCards();
        this.updateTotals();
    },

    /**
     * Render all cards
     */
    renderAllCards() {
        const container = document.getElementById('cardsContainer');
        if (!container) return;

        container.innerHTML = '';

        this.currentMonthData.cards.forEach(card => {
            container.appendChild(this.createCardElement(card));
        });
    },

    /**
     * Create card HTML element with new design
     * @param {object} card 
     * @returns {HTMLElement}
     */
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden';
        cardDiv.dataset.cardId = card.id;

        // Color palette matching the chart (same as in charts.js)
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

        // Get the index of this card among expense/transfer cards
        const expenseCards = this.currentMonthData.cards?.filter(c => c.type === 'expense' || c.type === 'transfer') || [];
        const cardIndex = expenseCards.findIndex(c => c.id === card.id);

        // Determine card color and icon
        let cardColor = '#6366f1'; // default indigo
        let icon = 'fa-wallet';

        if (card.type === 'income') {
            cardColor = '#10b981'; // emerald
            icon = 'fa-arrow-trend-up';
        } else if (card.type === 'expense' || card.type === 'transfer') {
            // Use color from palette based on position
            cardColor = colorPalette[cardIndex % colorPalette.length];
            icon = card.type === 'transfer' ? 'fa-right-left' : 'fa-arrow-trend-down';
        } else if (card.type === 'savings') {
            cardColor = '#06b6d4'; // cyan
            icon = 'fa-piggy-bank';
        }

        // Card header with dynamic hex colors
        let headerHTML = `
            <div class="p-4 flex items-center justify-between border-b" style="background: linear-gradient(to right, ${cardColor}15, ${cardColor}10); border-color: ${cardColor}40;">
                <div class="flex items-center gap-2">
                    <h3 class="text-lg font-bold cursor-pointer hover:opacity-70 transition-opacity" style="color: ${cardColor};" onclick="Cards.editCardTitle('${card.id}')" title="Click para editar/eliminar">${card.title}</h3>
                </div>
                <button onclick="Cards.openAddItemModal('${card.id}')" 
                    class="w-8 h-8 text-white rounded-lg flex items-center justify-center transition-opacity hover:opacity-90 shadow-md hover:shadow-lg"
                    style="background-color: ${cardColor};"
                    title="Agregar elemento">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;

        // Table header
        let tableHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                        <tr class="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                            <th class="px-3 py-2 text-xs">Concepto</th>
                            <th class="px-3 py-2 text-right text-xs">Importe</th>
                            <th class="px-3 py-2 text-xs">Fecha</th>
                            <th class="px-3 py-2 text-center w-10"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
        `;

        // Items
        if (card.items && card.items.length > 0) {
            card.items.forEach(item => {
                const isCompleted = item.completed || false;

                // Format date as DD/MM (only day and month)
                let dateDisplay = '';
                if (item.date) {
                    const dateParts = item.date.split('-'); // YYYY-MM-DD
                    if (dateParts.length === 3) {
                        dateDisplay = `${dateParts[2]}/${dateParts[1]}`; // DD/MM
                    } else {
                        dateDisplay = item.date;
                    }
                }

                tableHTML += `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td class="px-4 py-3 cursor-pointer" onclick="Cards.editItem('${card.id}', '${item.id}')">
                            <span class="font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">${item.name}</span>
                        </td>
                        <td class="px-4 py-3 text-right font-semibold text-slate-800 dark:text-white">
                            ${Currency.format(item.amount)}
                        </td>
                        <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
                            ${dateDisplay}
                        </td>
                        <td class="px-4 py-3 text-center">
                            <button onclick="Cards.toggleCompleted('${card.id}', '${item.id}')" 
                                class="w-6 h-6 rounded border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'} flex items-center justify-center hover:border-emerald-500 transition-all">
                                ${isCompleted ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tableHTML += `
                <tr>
                    <td colspan="4" class="px-4 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                        No hay elementos. Haz clic en + para agregar.
                    </td>
                </tr>
            `;
        }

        tableHTML += `
                    </tbody>
                    <tfoot class="bg-slate-50 dark:bg-slate-700/50 border-t-2 border-slate-300 dark:border-slate-600">
                        <tr>
                            <td class="px-3 py-2 font-bold text-slate-700 dark:text-slate-200 text-xs">TOTAL</td>
                            <td class="px-3 py-2 text-right font-bold text-base" style="color: ${cardColor};" id="card-total-${card.id}">
                                ${Currency.format(0)}
                            </td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        cardDiv.innerHTML = headerHTML + tableHTML;
        return cardDiv;
    },

    /**
     * Open modal to add new item
     * @param {string} cardId 
     */
    openAddItemModal(cardId) {
        const card = this.currentMonthData.cards.find(c => c.id === cardId);
        if (!card) return;

        this.currentEditingCard = cardId;
        this.currentEditingItem = null;

        // Update modal title
        document.getElementById('itemModalTitle').textContent = `Agregar a ${card.title}`;

        // Reset form with default date as first day of the month being viewed
        const [year, month] = this.currentMonthKey.split('-');
        const firstDayOfMonth = `${year}-${month}-01`;
        document.getElementById('itemConcepto').value = '';
        document.getElementById('itemPresupuesto').value = '';
        document.getElementById('itemFecha').value = firstDayOfMonth;

        // Hide delete button (we're adding, not editing)
        document.getElementById('deleteItemBtn').classList.add('hidden');

        // Show modal
        document.getElementById('itemModal').classList.remove('hidden');
    },

    /**
     * Edit existing item
     * @param {string} cardId 
     * @param {string} itemId 
     */
    editItem(cardId, itemId) {
        const card = this.currentMonthData.cards.find(c => c.id === cardId);
        if (!card) return;

        const item = card.items.find(i => i.id === itemId);
        if (!item) return;

        this.currentEditingCard = cardId;
        this.currentEditingItem = itemId;

        // Update modal title
        document.getElementById('itemModalTitle').textContent = `Editar en ${card.title}`;

        // Fill form with existing data
        document.getElementById('itemConcepto').value = item.name || '';
        document.getElementById('itemPresupuesto').value = item.amount || '';
        document.getElementById('itemFecha').value = item.date || new Date().toISOString().split('T')[0];

        // Show delete button (we're editing)
        document.getElementById('deleteItemBtn').classList.remove('hidden');

        // Show modal
        document.getElementById('itemModal').classList.remove('hidden');
    },

    /**
     * Close add/edit item modal
     */
    closeItemModal() {
        document.getElementById('itemModal').classList.add('hidden');
        this.currentEditingCard = null;
        this.currentEditingItem = null;
    },

    /**
     * Save item from modal
     */
    saveItemFromModal() {
        const concepto = document.getElementById('itemConcepto').value.trim();
        const presupuesto = parseFloat(document.getElementById('itemPresupuesto').value) || 0;
        const fecha = document.getElementById('itemFecha').value;

        if (!concepto) {
            alert('Por favor ingresa un concepto');
            return;
        }

        const card = this.currentMonthData.cards.find(c => c.id === this.currentEditingCard);
        if (!card) return;

        if (this.currentEditingItem) {
            // Edit existing item
            const item = card.items.find(i => i.id === this.currentEditingItem);
            if (item) {
                item.name = concepto;
                item.amount = presupuesto;
                item.date = fecha;
            }
        } else {
            // Add new item
            const newItem = {
                id: 'item_' + Date.now(),
                name: concepto,
                amount: presupuesto,
                date: fecha,
                completed: false,
                notes: ''
            };

            if (!card.items) card.items = [];
            card.items.push(newItem);
        }

        Storage.saveMonthData(this.currentMonthKey, this.currentMonthData);
        this.closeItemModal();
        this.renderAllCards();
        this.updateTotals();
        App.hasUnsavedChanges = true;
    },

    /**
     * Delete current item being edited in modal
     */
    deleteCurrentItem() {
        if (!this.currentEditingItem) return;

        if (!confirm('¿Eliminar este elemento?')) return;

        const card = this.currentMonthData.cards.find(c => c.id === this.currentEditingCard);
        if (!card || !card.items) return;

        card.items = card.items.filter(item => item.id !== this.currentEditingItem);
        Storage.saveMonthData(this.currentMonthKey, this.currentMonthData);

        this.closeItemModal();
        this.renderAllCards();
        this.updateTotals();
        App.hasUnsavedChanges = true;
    },

    /**
     * Toggle item completed status
     * @param {string} cardId 
     * @param {string} itemId 
     */
    toggleCompleted(cardId, itemId) {
        const card = this.currentMonthData.cards.find(c => c.id === cardId);
        if (!card || !card.items) return;

        const item = card.items.find(i => i.id === itemId);
        if (item) {
            item.completed = !item.completed;
            Storage.saveMonthData(this.currentMonthKey, this.currentMonthData);
            this.renderAllCards();
            this.updateTotals();
            App.hasUnsavedChanges = true;

            // Check if all items are completed
            this.checkAllCompleted();
        }
    },

    /**
     * Check if all items across all cards are completed
     */
    checkAllCompleted() {
        let totalItems = 0;
        let completedItems = 0;

        this.currentMonthData.cards.forEach(card => {
            if (card.items && card.items.length > 0) {
                card.items.forEach(item => {
                    totalItems++;
                    if (item.completed) {
                        completedItems++;
                    }
                });
            }
        });

        // If there are items and all are completed, show celebration
        if (totalItems > 0 && totalItems === completedItems) {
            this.showCelebration();
        }
    },

    /**
     * Show celebration modal
     */
    showCelebration() {
        const modal = document.getElementById('celebrationModal');
        if (modal) {
            modal.classList.remove('hidden');
            // Auto-hide after 1.5 seconds
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 1500);
        }
    },

    /**
     * Delete item
     * @param {string} cardId 
     * @param {string} itemId 
     */
    deleteItem(cardId, itemId) {
        if (!confirm('¿Eliminar este elemento?')) return;

        const card = this.currentMonthData.cards.find(c => c.id === cardId);
        if (!card || !card.items) return;

        card.items = card.items.filter(item => item.id !== itemId);
        Storage.saveMonthData(this.currentMonthKey, this.currentMonthData);
        this.renderAllCards();
        this.updateTotals();
        App.hasUnsavedChanges = true;
    },

    /**
     * Edit card title - Opens dialog with edit/delete options
     * @param {string} cardId 
     */
    editCardTitle(cardId) {
        const card = this.currentMonthData.cards.find(c => c.id === cardId);
        if (!card) return;

        // Check if it's a protected card
        const defaultIds = ['ingreso', 'ahorros', 'gastos-fijos', 'gastos-variados', 'giros'];
        const isProtected = defaultIds.includes(cardId);

        // Show options dialog
        let message = `Tarjeta: ${card.title}\n\n`;
        message += card.editable ? '1. Editar nombre\n' : '';
        message += isProtected ? '' : '2. Eliminar tarjeta\n';
        message += '\nIngresa el número de la opción (Cancelar para salir):';

        const option = prompt(message);

        if (option === '1' && card.editable) {
            // Edit title
            const newTitle = prompt('Nuevo nombre de la tarjeta:', card.title);
            if (newTitle && newTitle.trim()) {
                card.title = newTitle.trim();
                Storage.saveMonthData(this.currentMonthKey, this.currentMonthData);
                this.renderAllCards();
                App.hasUnsavedChanges = true;
            }
        } else if (option === '2' && !isProtected) {
            // Delete card
            this.deleteCard(cardId);
        }
    },

    /**
     * Delete entire card
     * @param {string} cardId 
     */
    deleteCard(cardId) {
        // Don't delete default cards
        const defaultIds = ['ingreso', 'ahorros', 'gastos-fijos', 'gastos-variados', 'giros'];
        if (defaultIds.includes(cardId)) {
            alert('No puedes eliminar tarjetas predeterminadas.');
            return;
        }

        if (!confirm('¿Estás seguro de que deseas eliminar esta tarjeta?')) return;

        this.currentMonthData.cards = this.currentMonthData.cards.filter(c => c.id !== cardId);
        Storage.saveMonthData(this.currentMonthKey, this.currentMonthData);
        this.renderAllCards();
        this.updateTotals();
        App.hasUnsavedChanges = true;
    },

    /**
     * Add new custom card - Always creates expense type
     */
    addNewCard() {
        const title = prompt('Nombre de la nueva tarjeta de egreso:');
        if (!title) return;

        const newCard = {
            id: 'card_' + Date.now(),
            title: title,
            type: 'expense',  // Always expense type
            editable: true,
            items: [],
            cumulative: false
        };

        this.currentMonthData.cards.push(newCard);
        Storage.saveMonthData(this.currentMonthKey, this.currentMonthData);
        this.renderAllCards();
        this.updateTotals();
        App.hasUnsavedChanges = true;
    },

    /**
     * Update all totals and summary cards
     */
    updateTotals() {
        let totalIncome = 0;
        let totalExpenses = 0;

        this.currentMonthData.cards.forEach(card => {
            // For savings cards, only sum checked items
            let cardTotal = 0;
            if (card.type === 'savings') {
                cardTotal = card.items?.reduce((sum, item) => {
                    // Only sum if the item is completed (checked)
                    if (item.completed) {
                        return sum + (parseFloat(item.amount) || 0);
                    }
                    return sum;
                }, 0) || 0;
            } else {
                // For other cards, sum all items
                cardTotal = card.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;
            }

            // Update individual card total
            const cardTotalEl = document.getElementById(`card-total-${card.id}`);
            if (cardTotalEl) {
                // Always use cardTotal which already accounts for checked items in savings cards
                cardTotalEl.textContent = Currency.format(cardTotal);
            }

            // Sum for summary
            if (card.type === 'income') {
                totalIncome += cardTotal;
            } else if (card.type === 'expense' || card.type === 'savings' || card.type === 'transfer') {
                // Expenses, savings, and transfers all subtract from balance
                totalExpenses += cardTotal;
            }
        });

        const balance = totalIncome - totalExpenses;

        // Update summary cards
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpensesEl = document.getElementById('totalExpenses');
        const balanceEl = document.getElementById('balance');

        if (totalIncomeEl) totalIncomeEl.textContent = Currency.format(totalIncome);
        if (totalExpensesEl) totalExpensesEl.textContent = Currency.format(totalExpenses);
        if (balanceEl) {
            balanceEl.textContent = Currency.format(balance);
            balanceEl.className = balance >= 0 ?
                'text-2xl font-bold text-emerald-600 dark:text-emerald-400' :
                'text-2xl font-bold text-red-600 dark:text-red-400';
        }

        // Update charts
        Charts.updateAll(this.currentMonthData);
    }
};

// Make Cards available globally
if (typeof window !== 'undefined') {
    window.Cards = Cards;
}
