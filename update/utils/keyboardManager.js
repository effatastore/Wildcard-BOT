const { Markup } = require('telegraf');
const translations = require('../config/translations');

class KeyboardManager {
    constructor() {
        this.userStates = new Map();
        this.userLanguages = new Map();
    }

    // Set user language
    setUserLanguage(userId, lang) {
        this.userLanguages.set(userId, lang);
    }

    // Get user language
    getUserLanguage(userId) {
        return this.userLanguages.get(userId) || 'id'; // Default to Indonesian
    }

    // Get translation for user
    getTranslation(userId, path) {
        const lang = this.getUserLanguage(userId);
        const keys = path.split('.');
        let translation = translations[lang];
        
        for (const key of keys) {
            translation = translation[key];
            if (!translation) return path;
        }
        
        return translation;
    }

    // Main menu keyboard
    getMainMenuKeyboard(userId) {
        const t = (path) => this.getTranslation(userId, path);
        
        return Markup.keyboard([
            [t('welcome.buttons.register'), t('welcome.buttons.config')],
            [t('welcome.buttons.domains'), t('welcome.buttons.help')]
        ]).resize();
    }

    // Configuration menu keyboard
    getConfigMenuKeyboard(userId) {
        const t = (path) => this.getTranslation(userId, path);
        
        return Markup.keyboard([
            [t('config.add'), t('config.update')],
            [t('config.delete'), t('config.view')],
            [t('common.back')]
        ]).resize();
    }

    // Domain management keyboard
    getDomainMenuKeyboard(userId) {
        const t = (path) => this.getTranslation(userId, path);
        
        return Markup.keyboard([
            [t('domains.setup'), t('domains.list')],
            [t('domains.add'), t('domains.search')],
            [t('domains.delete')],
            [t('common.back')]
        ]).resize();
    }

    // Language selection keyboard
    getLanguageKeyboard() {
        return Markup.keyboard([
            ['🇮🇩 Bahasa Indonesia', '🇬🇧 English']
        ]).resize();
    }

    // Confirmation keyboard
    getConfirmationKeyboard(userId) {
        const t = (path) => this.getTranslation(userId, path);
        
        return Markup.keyboard([
            [t('common.confirm'), t('common.cancel')]
        ]).resize();
    }

    // Set user state
    setUserState(userId, state) {
        this.userStates.set(userId, state);
    }

    // Get user state
    getUserState(userId) {
        return this.userStates.get(userId);
    }

    // Clear user state
    clearUserState(userId) {
        this.userStates.delete(userId);
    }
}

module.exports = new KeyboardManager(); 