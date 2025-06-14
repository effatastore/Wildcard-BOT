const fetch = require("node-fetch");
const { readConfig, writeConfig } = require('../utils/fileUtils');
const { isValidEmail, isValidApiToken, sanitizeInput } = require('../utils/validation');
const keyboardManager = require('../utils/keyboardManager');

/**
 * Handler untuk menambahkan konfigurasi Cloudflare API
 */
async function handleAddCf(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();
    const t = (path) => keyboardManager.getTranslation(userId, path);
    
    // Cek apakah user sudah terdaftar
    if (configData[userId]) {
        return ctx.reply(
            '⚠️ ' + t('config.already_registered'),
            keyboardManager.getMainMenuKeyboard(userId)
        );
    }
    
    const state = keyboardManager.getUserState(userId);
    
    if (state === 'awaiting_api_key') {
        const apiKey = sanitizeInput(ctx.message.text);
        
        if (!isValidApiToken(apiKey)) {
            return ctx.reply(
                '❌ ' + t('config.invalid_api_key'),
                keyboardManager.getConfirmationKeyboard(userId)
            );
        }
        
        keyboardManager.setUserState(userId, 'awaiting_email');
        return ctx.reply(
            '📧 ' + t('config.enter_email'),
            keyboardManager.getConfirmationKeyboard(userId)
        );
    }
    
    if (state === 'awaiting_email') {
        const email = sanitizeInput(ctx.message.text);
        
        if (!isValidEmail(email)) {
            return ctx.reply(
                '❌ ' + t('config.invalid_email'),
                keyboardManager.getConfirmationKeyboard(userId)
            );
        }
        
        const statusMsg = await ctx.reply(t('common.loading'));
        
        try {
            // Verify API key and email
            const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            
            // Save configuration
            configData[userId] = {
                apiKey,
                email,
                createdAt: new Date().toISOString()
            };
            
            writeConfig(configData);
            
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                '✅ ' + t('config.registration_success'),
                keyboardManager.getMainMenuKeyboard(userId)
            );
            
            keyboardManager.clearUserState(userId);
        } catch (error) {
            console.error("❌ Config error:", error.message);
            
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                '❌ ' + t('config.registration_failed'),
                keyboardManager.getMainMenuKeyboard(userId)
            );
        }
    }
}

/**
 * Handler untuk melihat konfigurasi
 */
async function handleCfConfig(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();
    const t = (path) => keyboardManager.getTranslation(userId, path);
    
    if (!configData[userId]) {
        return ctx.reply(
            '⚠️ ' + t('config.not_registered'),
            keyboardManager.getMainMenuKeyboard(userId)
        );
    }
    
    const config = configData[userId];
    const message = 
        '⚙️ ' + t('config.title') + '\n\n' +
        '📧 Email: `' + config.email + '`\n' +
        '🔑 API Key: `' + config.apiKey.substring(0, 8) + '...' + '`\n' +
        '📅 Registered: ' + new Date(config.createdAt).toLocaleString() + '\n\n' +
        '💡 ' + t('config.management_tip');
    
    await ctx.reply(
        message,
        { 
            parse_mode: 'Markdown',
            ...keyboardManager.getConfigMenuKeyboard(userId)
        }
    );
}

/**
 * Handler untuk update konfigurasi
 */
async function handleUpdateCf(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();
    const t = (path) => keyboardManager.getTranslation(userId, path);
    
    if (!configData[userId]) {
        return ctx.reply(
            '⚠️ ' + t('config.not_registered'),
            keyboardManager.getMainMenuKeyboard(userId)
        );
    }
    
    const state = keyboardManager.getUserState(userId);
    
    if (!state) {
        keyboardManager.setUserState(userId, 'awaiting_new_api_key');
        return ctx.reply(
            '🔑 ' + t('config.enter_new_api_key'),
            keyboardManager.getConfirmationKeyboard(userId)
        );
    }
    
    if (state === 'awaiting_new_api_key') {
        const newApiKey = sanitizeInput(ctx.message.text);
        
        if (!isValidApiToken(newApiKey)) {
            return ctx.reply(
                '❌ ' + t('config.invalid_api_key'),
                keyboardManager.getConfirmationKeyboard(userId)
            );
        }
        
        keyboardManager.setUserState(userId, 'awaiting_new_email');
        return ctx.reply(
            '📧 ' + t('config.enter_new_email'),
            keyboardManager.getConfirmationKeyboard(userId)
        );
    }
    
    if (state === 'awaiting_new_email') {
        const newEmail = sanitizeInput(ctx.message.text);
        
        if (!isValidEmail(newEmail)) {
            return ctx.reply(
                '❌ ' + t('config.invalid_email'),
                keyboardManager.getConfirmationKeyboard(userId)
            );
        }
        
        const statusMsg = await ctx.reply(t('common.loading'));
        
        try {
            // Verify new credentials
            const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${newApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            
            // Update configuration
            configData[userId] = {
                ...configData[userId],
                apiKey: newApiKey,
                email: newEmail,
                updatedAt: new Date().toISOString()
            };
            
            writeConfig(configData);
            
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                '✅ ' + t('config.update_success'),
                keyboardManager.getMainMenuKeyboard(userId)
            );
            
            keyboardManager.clearUserState(userId);
        } catch (error) {
            console.error("❌ Update config error:", error.message);
            
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                '❌ ' + t('config.update_failed'),
                keyboardManager.getMainMenuKeyboard(userId)
            );
        }
    }
}

/**
 * Handler untuk menghapus konfigurasi
 */
async function handleDeleteCf(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();
    const t = (path) => keyboardManager.getTranslation(userId, path);
    
    if (!configData[userId]) {
        return ctx.reply(
            '⚠️ ' + t('config.not_registered'),
            keyboardManager.getMainMenuKeyboard(userId)
        );
    }
    
    const state = keyboardManager.getUserState(userId);
    
    if (!state) {
        keyboardManager.setUserState(userId, 'awaiting_delete_confirmation');
        return ctx.reply(
            '⚠️ ' + t('config.delete_confirmation'),
            keyboardManager.getConfirmationKeyboard(userId)
        );
    }
    
    if (state === 'awaiting_delete_confirmation') {
        if (ctx.message.text === t('common.confirm')) {
            try {
                delete configData[userId];
                writeConfig(configData);
                
                await ctx.reply(
                    '✅ ' + t('config.delete_success'),
                    keyboardManager.getMainMenuKeyboard(userId)
                );
            } catch (error) {
                console.error("❌ Delete config error:", error.message);
                await ctx.reply(
                    '❌ ' + t('config.delete_failed'),
                    keyboardManager.getMainMenuKeyboard(userId)
                );
            }
        } else {
            await ctx.reply(
                '🔄 ' + t('config.delete_cancelled'),
                keyboardManager.getMainMenuKeyboard(userId)
            );
        }
        
        keyboardManager.clearUserState(userId);
    }
}

module.exports = {
    handleAddCf,
    handleCfConfig,
    handleUpdateCf,
    handleDeleteCf
}; 