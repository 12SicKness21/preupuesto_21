/**
 * Authentication Module
 * Handles login, logout, and session management
 */

const Auth = {
    // Test credentials (hardcoded as per requirements)
    TEST_EMAIL: 'prueba@prueba.com',
    TEST_PASSWORD: 'prueba',
    SESSION_KEY: 'pm21_session',

    /**
     * Validate credentials and create session
     * @param {string} email 
     * @param {string} password 
     * @returns {boolean}
     */
    login(email, password) {
        if (email === this.TEST_EMAIL && password === this.TEST_PASSWORD) {
            const session = {
                email: email,
                loginTime: new Date().toISOString(),
                isAuthenticated: true
            };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            return true;
        }
        return false;
    },

    /**
     * Clear session and logout
     */
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'login.html';
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const session = localStorage.getItem(this.SESSION_KEY);
        if (!session) return false;
        
        try {
            const sessionData = JSON.parse(session);
            return sessionData.isAuthenticated === true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Get current session data
     * @returns {object|null}
     */
    getSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        if (!session) return null;
        
        try {
            return JSON.parse(session);
        } catch (e) {
            return null;
        }
    },

    /**
     * Protect a page - redirect to login if not authenticated
     * Call this at the top of protected pages
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
};

// Make Auth available globally
if (typeof window !== 'undefined') {
    window.Auth = Auth;
}
