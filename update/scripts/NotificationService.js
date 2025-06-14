const fetch = require("node-fetch");
const FormData = require('form-data');
const { NOTIFICATIONS } = require('../config/default');

class NotificationService {
    /**
     * Censor email for privacy in public channels
     */
    static censorEmail(email) {
        if (!email || email === 'N/A') return 'N/A';
        
        const [localPart, domain] = email.split('@');
        if (!localPart || !domain) return 'N/A';
        
        // Show first 2 chars, then xxx, then last char before @
        const censoredLocal = localPart.length > 3 
            ? localPart.substring(0, 2) + 'xxx'.repeat(Math.ceil((localPart.length - 3) / 3)) + localPart.slice(-1)
            : localPart.substring(0, 1) + 'xxx';
            
        return `${censoredLocal}@${domain}`;
    }

    /**
     * Censor domain for privacy in public channels
     */
    static censorDomain(domain) {
        if (!domain || domain === 'N/A') return 'N/A';
        
        const parts = domain.split('.');
        if (parts.length < 2) return 'N/A';
        
        // Identify which part is the main domain to censor
        let domainIndex;
        if (parts.length === 2) {
            // domain.com
            domainIndex = 0;
        } else if (parts.length === 3) {
            // subdomain.domain.com OR domain.co.id
            // Check if last two parts are known SLD (Second Level Domain)
            const lastTwo = parts.slice(-2).join('.');
            const knownSLD = ['co.id', 'ac.id', 'sch.id', 'my.id', 'web.id', 'biz.id', 'eu.org'];
            domainIndex = knownSLD.includes(lastTwo) ? 0 : 1;
        } else {
            // subdomain.domain.co.id OR multi.level.domain.com
            const lastTwo = parts.slice(-2).join('.');
            const knownSLD = ['co.id', 'ac.id', 'sch.id', 'my.id', 'web.id', 'biz.id', 'eu.org'];
            domainIndex = knownSLD.includes(lastTwo) ? parts.length - 3 : parts.length - 2;
        }
        
        // Censor the identified domain part
        const domainPart = parts[domainIndex];
        const censoredDomain = domainPart.length > 3 
            ? domainPart.substring(0, 2) + 'xxx' + domainPart.slice(-1)
            : domainPart.substring(0, 1) + 'xxx';
            
        // Reconstruct domain with censored part
        const newParts = [...parts];
        newParts[domainIndex] = censoredDomain;
        return newParts.join('.');
    }

    /**
     * Send notification to Telegram group
     */
    static async sendTelegramNotification(bot, message) {
        if (!NOTIFICATIONS.TELEGRAM_GROUP_ID) {
            console.log('⚠️ Telegram Group ID not configured, skipping notification');
            return false;
        }

        try {
            await bot.sendMessage(
                NOTIFICATIONS.TELEGRAM_GROUP_ID,
                message,
                { 
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true 
                }
            );
            console.log('✅ Telegram notification sent');
            return true;
        } catch (error) {
            console.error('❌ Failed to send Telegram notification:', error.message);
            console.error('📝 Message content:', message);
            console.error('🔍 Full error:', error);
            return false;
        }
    }

    /**
     * Send notification to WhatsApp via WAPanels API
     */
    static async sendWhatsAppNotification(message) {
        if (!NOTIFICATIONS.WHATSAPP.enabled) {
            console.log('⚠️ WhatsApp notifications disabled');
            return false;
        }

        try {
            const formData = new FormData();
            formData.append('appkey', NOTIFICATIONS.WHATSAPP.appkey);
            formData.append('authkey', NOTIFICATIONS.WHATSAPP.authkey);
            formData.append('to', NOTIFICATIONS.WHATSAPP.to);
            formData.append('message', message);

            const response = await fetch(NOTIFICATIONS.WHATSAPP.apiUrl, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders()
            });

            const result = await response.json();
            
            // More flexible response handling
            if (response.ok) {
                // Check for success indicators
                if (result.status === 'success' || 
                    result.success === true || 
                    result.code === 200 ||
                    response.status === 200) {
                    console.log('✅ WhatsApp notification sent');
                    return true;
                }
                // Log actual response for debugging
                console.log('🔍 WhatsApp API response:', result);
            }
            
            console.error('❌ WhatsApp API error:', result.message || result.error || 'Unknown error');
            return false;
        } catch (error) {
            console.error('❌ Failed to send WhatsApp notification:', error.message);
            return false;
        }
    }

    /**
     * Send wildcard setup success notification to both platforms
     */
    static async notifyWildcardSuccess(bot, userInfo, domain) {
        const timestamp = new Date().toLocaleString('id-ID');
        
        // Format message for notifications
        const telegramMessage = 
            `🎉 *WILDCARD SETUP BERHASIL!*\n\n` +
            `👤 *User:* ${userInfo.firstName} ${userInfo.lastName ? userInfo.lastName : ''}\n` +
            `📧 *Email:* ${this.censorEmail(userInfo.email)}\n` +
            `👤 *Username:* ${userInfo.username ? '@' + userInfo.username : 'N/A'}\n` +
            `🆔 *User ID:* ${userInfo.userId}\n` +
            `🌐 *Domain:* ${this.censorDomain(domain)}\n` +
            `📅 *Waktu:* ${timestamp}\n\n` +
            `✨ _Wildcard domain telah aktif dan siap digunakan!_`;

        const whatsappMessage = 
            `🎉 WILDCARD SETUP BERHASIL!\n\n` +
            `👤 User: ${userInfo.firstName} ${userInfo.lastName ? userInfo.lastName : ''}\n` +
            `📧 Email: ${userInfo.email || 'N/A'}\n` +
            `👤 Username: ${userInfo.username ? 't.me/' + userInfo.username : 'N/A'}\n` +
            `🆔 User ID: ${userInfo.userId}\n` +
            `�� Domain: ${domain}\n` +
            `📅 Waktu: ${timestamp}\n\n` +
            `✨ Wildcard domain telah aktif dan siap digunakan!`;

        // Send notifications (parallel for better performance)
        const [telegramSent, whatsappSent] = await Promise.allSettled([
            this.sendTelegramNotification(bot, telegramMessage),
            this.sendWhatsAppNotification(whatsappMessage)
        ]);

        return {
            telegram: telegramSent.status === 'fulfilled' && telegramSent.value,
            whatsapp: whatsappSent.status === 'fulfilled' && whatsappSent.value
        };
    }

    /**
     * Send test notification to verify setup
     */
    static async sendTestNotification(bot) {
        const testMessage = `🧪 *TEST NOTIFICATION*\n\n📅 ${new Date().toLocaleString('id-ID')}\n✅ Sistem notifikasi berfungsi dengan baik!`;
        
        const results = await Promise.allSettled([
            this.sendTelegramNotification(bot, testMessage),
            this.sendWhatsAppNotification(testMessage.replace(/\*/g, ''))
        ]);

        return {
            telegram: results[0].status === 'fulfilled' && results[0].value,
            whatsapp: results[1].status === 'fulfilled' && results[1].value
        };
    }
}

module.exports = NotificationService;