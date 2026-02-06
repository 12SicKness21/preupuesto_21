/**
 * Custom Modal Controller
 * Replaces native alert/confirm/prompt with custom UI
 */
const Modal = {
    _resolve: null,
    _mode: 'confirm', // confirm, prompt, custom

    /**
     * Show a confirmation modal
     */
    confirm(title, message, confirmText = 'Aceptar', cancelText = 'Cancelar') {
        return this._show('confirm', title, message, { confirmText, cancelText });
    },

    /**
     * Show a prompt modal (text input)
     */
    prompt(title, message, defaultValue = '', placeholder = '') {
        return this._show('prompt', title, message, { defaultValue, placeholder });
    },

    /**
     * Show a modal with custom options (buttons)
     * options: Array of { text, value, class, icon }
     */
    showOptions(title, message, options = []) {
        return this._show('custom', title, message, { options });
    },

    /**
     * Internal method to show modal
     */
    _show(mode, title, message, config = {}) {
        return new Promise((resolve) => {
            this._resolve = resolve;
            this._mode = mode;

            // Common Elements
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').textContent = message;

            // Reset UI
            document.getElementById('modalInputContainer').classList.add('hidden');
            document.getElementById('modalStandardFooter').classList.add('hidden');
            document.getElementById('modalCustomFooter').classList.add('hidden');
            document.getElementById('modalCustomFooter').innerHTML = '';

            // Setup specific mode
            if (mode === 'confirm') {
                document.getElementById('modalStandardFooter').classList.remove('hidden');
                document.getElementById('modalConfirmBtn').textContent = config.confirmText;
                document.getElementById('modalCancelBtn').textContent = config.cancelText;

            } else if (mode === 'prompt') {
                document.getElementById('modalStandardFooter').classList.remove('hidden');
                document.getElementById('modalInputContainer').classList.remove('hidden');

                const input = document.getElementById('modalInput');
                input.value = config.defaultValue || '';
                input.placeholder = config.placeholder || '';
                input.focus();

            } else if (mode === 'custom') {
                const footer = document.getElementById('modalCustomFooter');
                footer.classList.remove('hidden');

                config.options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = `w-full px-4 py-3 text-left font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 ${opt.class || 'text-slate-700 dark:text-slate-300'}`;
                    btn.innerHTML = `
                        ${opt.icon ? `<i class="${opt.icon} w-5 text-center"></i>` : ''}
                        ${opt.text}
                    `;
                    btn.onclick = () => this._resolveAndClose(opt.value);
                    footer.appendChild(btn);
                });

                // Add Cancel button at the bottom
                const cancelBtn = document.createElement('button');
                cancelBtn.className = "w-full px-4 py-3 text-center text-slate-500 font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors";
                cancelBtn.textContent = "Cancelar";
                cancelBtn.onclick = () => this._resolveAndClose(null);
                footer.appendChild(cancelBtn);
            }

            // Show modal
            const modal = document.getElementById('customModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');

            if (mode === 'prompt') {
                setTimeout(() => document.getElementById('modalInput').focus(), 100);
            }
        });
    },

    onConfirm() {
        if (this._mode === 'prompt') {
            const value = document.getElementById('modalInput').value;
            this._resolveAndClose(value);
        } else {
            this._resolveAndClose(true);
        }
    },

    onCancel() {
        // If clicking backdrop in custom mode, it cancels
        this._resolveAndClose(this._mode === 'confirm' ? false : null);
    },

    _resolveAndClose(value) {
        const modal = document.getElementById('customModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        if (this._resolve) {
            this._resolve(value);
            this._resolve = null; // Prevent double resolve
        }
    }
};

window.Modal = Modal;
