const { USER_STATES, CACHE } = require('../config/constants');

class StateService {
    constructor() {
        this.userStates = new Map();
        this.userData = new Map();
        this.lastActivity = new Map();
    }

    /**
     * Set user state
     */
    setState(userId, state) {
        this.userStates.set(userId, state);
        this.updateLastActivity(userId);
    }

    /**
     * Get user state
     */
    getState(userId) {
        this.updateLastActivity(userId);
        return this.userStates.get(userId);
    }

    /**
     * Clear user state
     */
    clearState(userId) {
        this.userStates.delete(userId);
        this.userData.delete(userId);
        this.lastActivity.delete(userId);
    }

    /**
     * Set user data
     */
    setData(userId, key, value) {
        const userData = this.userData.get(userId) || {};
        userData[key] = value;
        this.userData.set(userId, userData);
        this.updateLastActivity(userId);
    }

    /**
     * Get user data
     */
    getData(userId, key) {
        this.updateLastActivity(userId);
        const userData = this.userData.get(userId);
        return userData ? userData[key] : null;
    }

    /**
     * Clear user data
     */
    clearData(userId, key) {
        const userData = this.userData.get(userId);
        if (userData) {
            delete userData[key];
            this.userData.set(userId, userData);
        }
        this.updateLastActivity(userId);
    }

    /**
     * Update last activity timestamp
     */
    updateLastActivity(userId) {
        this.lastActivity.set(userId, Date.now());
    }

    /**
     * Check if user is active
     */
    isActive(userId) {
        const lastActivity = this.lastActivity.get(userId);
        if (!lastActivity) return false;

        const now = Date.now();
        return (now - lastActivity) < CACHE.USER_STATE_TTL * 1000;
    }

    /**
     * Cleanup inactive users
     */
    cleanup() {
        const now = Date.now();
        for (const [userId, lastActivity] of this.lastActivity.entries()) {
            if ((now - lastActivity) >= CACHE.USER_STATE_TTL * 1000) {
                this.clearState(userId);
            }
        }
    }

    /**
     * Check if user is in specific state
     */
    isInState(userId, state) {
        return this.getState(userId) === state;
    }

    /**
     * Get all user states
     */
    getAllStates() {
        return Object.fromEntries(this.userStates);
    }

    /**
     * Get all user data
     */
    getAllData() {
        return Object.fromEntries(this.userData);
    }
}

module.exports = new StateService(); 