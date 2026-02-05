/**
 * Custom Modal Controller
 * Replaces native alert/confirm with custom UI
 */
const Modal = {
    // Promise resolve function for the current active confirmation
    _resolve: null,

    /**
     * Show a confirmation modal
     * @param {string} title 
     * @param {string} message 
     * @param {string} confirmText 
     * @param {string} cancelText 
     * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise
     */
    confirm(title, message, confirmText = 'Aceptar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            this._resolve = resolve;

            // Populate modal content
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').textContent = message;

            const confirmBtn = document.getElementById('modalConfirmBtn');
            const cancelBtn = document.getElementById('modalCancelBtn');

            confirmBtn.textContent = confirmText;
            cancelBtn.textContent = cancelText;

            // Show modal
            const modal = document.getElementById('customModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    },

    /**
     * Handle confirm button click
     */
    onConfirm() {
        this.close();
        if (this._resolve) {
            this._resolve(true);
            this._resolve = null;
        }
    },

    /**
     * Handle cancel button click
     */
    onCancel() {
        this.close();
        if (this._resolve) {
            this._resolve(false);
            this._resolve = null;
        }
    },

    /**
     * Close the modal
     */
    close() {
        const modal = document.getElementById('customModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// Expose globally
window.Modal = Modal;
