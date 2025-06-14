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
        const censoredLocal =
            localPart.length > 3
                ? localPart.substring(0, 2) +
                  'xxx'.repeat(Math.ceil((localPart.length - 3) / 3)) +
                  localPart.slice(-1)
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

        // Known Second Level Domains (SLD)
        const knownSLD = [
            'net',
            'com',
            'co.id',
            'ac.id',
            'sch.id',
            'my.id',
            'web.id',
            'biz.id',
            'eu.org',
        ];

        let domainIndex;

        if (parts.length === 2) {
            // example.com
            domainIndex = 0;
        } else {
            // Check if domain ends with known SLD
            const lastTwo = parts.slice(-2).join('.');

            if (knownSLD.includes(lastTwo)) {
                // domain.my.id or subdomain.domain.my.id
                if (parts.length === 3) {
                    // domain.my.id -> censor "domain"
                    domainIndex = 0;
                } else {
                    // subdomain.domain.my.id -> censor "domain" (second from end excluding SLD)
                    domainIndex = parts.length - 3;
                }
            } else {
                // Regular domain like subdomain.example.com
                domainIndex = parts.length - 2;
            }
        }

        // Censor the identified domain part
        const domainPart = parts[domainIndex];
        const censoredDomain =
            domainPart.length > 3
                ? domainPart.substring(0, 1) + 'xxx' + domainPart.slice(-1)
                : 'xxx';

        // Reconstruct domain with censored part
        const newParts = [...parts];
        newParts[domainIndex] = censoredDomain;
        return newParts.join('.');
    }

    /**
     * Send notification to Telegram group with retry mechanism
     */
    static async sendTelegramNotification(telegram, message, retries = 3) {
        const telegramConfig = NOTIFICATIONS.TELEGRAM;

        if (!telegramConfig?.enabled || !telegramConfig?.groupId) {
            console.log('⚠️ Telegram Group ID not configured, skipping notification');
            return false;
        }

        if (!telegram) {
            console.error('❌ Telegram instance not provided');
            return false;
        }

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`📤 Sending Telegram notification (attempt ${attempt}/${retries})`);
                
                // Add timeout configuration
                const options = {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true,
                };

                await telegram.sendMessage(telegramConfig.groupId, message, options);
                console.log('✅ Telegram notification sent successfully');
                return true;
            } catch (error) {
                console.error(`❌ Attempt ${attempt}/${retries} failed:`, error.message);
                
                // Check if this is a timeout or network error
                if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
                    if (attempt < retries) {
                        const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
                        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }
                } else if (error.response && error.response.error_code === 429) {
                    // Rate limit error
                    const retryAfter = error.response.parameters?.retry_after || 60;
                    if (attempt < retries) {
                        console.log(`⏳ Rate limited. Waiting ${retryAfter}s before retry...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                        continue;
                    }
                }
                
                // If this is the last attempt or non-retryable error
                if (attempt === retries) {
                    console.error('❌ All retry attempts failed for Telegram notification');
                    console.error('📝 Message content:', message);
                    console.error('🔍 Full error:', error);
                }
            }
        }
        
        return false;
    }

    /**
     * Send wildcard setup success notification to Telegram
     */
    static async notifyWildcardSuccess(telegram, userInfo, domain) {
        const timestamp = new Date().toLocaleString('id-ID');

        // Format message for Telegram notification
        const telegramMessage =
            '🎉 *WILDCARD SETUP BERHASIL!*\n\n' +
            `👤 *User:* ${userInfo.firstName} ${userInfo.lastName ? userInfo.lastName : ''}\n` +
            `📧 *Email:* ${this.censorEmail(userInfo.email)}\n` +
            `👤 *Username:* ${userInfo.username ? '@' + userInfo.username : 'N/A'}\n` +
            `🆔 *User ID:* ${userInfo.userId}\n` +
            `🌐 *Domain:* ${this.censorDomain(domain)}\n` +
            `📅 *Waktu:* ${timestamp}\n\n` +
            '✨ _Wildcard domain telah aktif dan siap digunakan!_';

        // Send Telegram notification
        const telegramSent = await this.sendTelegramNotification(telegram, telegramMessage);

        return {
            telegram: telegramSent,
        };
    }

    /**
     * Send test notification to verify Telegram setup
     */
    static async sendTestNotification(telegram) {
        const testMessage = `🧪 *TEST NOTIFICATION*\n\n📅 ${new Date().toLocaleString('id-ID')}\n✅ Sistem notifikasi Telegram berfungsi dengan baik!`;

        const telegramResult = await this.sendTelegramNotification(telegram, testMessage);

        return {
            telegram: telegramResult,
        };
    }
}


module.exports = NotificationService;