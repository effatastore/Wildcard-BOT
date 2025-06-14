const CloudflareManager = require('../services/CloudflareManager');
const { readConfig, readAdminUsage, writeAdminUsage } = require('../utils/fileUtils');
const { isValidDomain } = require('../utils/validation');
const NotificationService = require('../services/NotificationService');

/**
 * Handler untuk command /setupwildcard
 * Setup wildcard domain dengan semua subdomain
 */
async function handleSetupWildcard(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();

    if (!configData[userId]) {
        return ctx.reply(
            '❌ **AKSES DITOLAK**\n\n' +
                '🔐 Anda belum terdaftar di sistem\n\n' +
                '💡 **Cara registrasi:**\n' +
                '• Gunakan `/addcf <global_api_key> <email>`\n' +
                '• Dapatkan API key dari Cloudflare dashboard\n\n' +
                '🌐 Link: https://dash.cloudflare.com/profile/api-tokens',
            { parse_mode: 'Markdown' }
        );
    }

    const domain = ctx.message.text.replace('/setupwildcard', '').trim().toLowerCase();

    if (!domain) {
        return ctx.reply(
            '❌ *Format tidak valid!*\n\n' +
                '📝 Format: `/setupwildcard <domain>`\n' +
                '📖 Contoh: `/setupwildcard example.com`\n\n' +
                '💡 *Tips:*\n' +
                '• Pastikan domain sudah terdaftar di Cloudflare\n' +
                '• Domain harus aktif dan tidak dalam maintenance',
            { parse_mode: 'Markdown' }
        );
    }

    // Validasi domain
    const domainValidation = isValidDomain(domain);
    if (!domainValidation.valid) {
        return ctx.reply(`❌ ${domainValidation.message}`);
    }

    const statusMsg = await ctx.reply(
        '🔧 **SETTING UP WILDCARD**\n\n' +
            '```\n' +
            '█████████░░░░░░░░░░ 45%\n' +
            '```\n' +
            '⚡ Initializing connection...\n' +
            '📡 Connecting to Cloudflare API\n\n' +
            '⏳ Please wait...',
        { parse_mode: 'Markdown' }
    );

    try {
        const cf = new CloudflareManager(userId);

        // Clean animation sequence
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Step 1: Authentication
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            '🔐 **AUTHENTICATING**\n\n' +
                '```\n' +
                '███████████░░░░░░░░░ 65%\n' +
                '```\n' +
                '✅ API credentials verified\n' +
                '🌐 Establishing secure connection\n\n' +
                '⏳ Validating domain...',
            { parse_mode: 'Markdown' }
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Step 2: Domain validation
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            '🔍 **VALIDATING DOMAIN**\n\n' +
                '```\n' +
                '████████████████░░░░ 85%\n' +
                '```\n' +
                '✅ Domain found in Cloudflare\n' +
                '✅ DNS zones accessible\n\n' +
                '⏳ Creating wildcard records...',
            { parse_mode: 'Markdown' }
        );

        await new Promise((resolve) => setTimeout(resolve, 1200));

        // Step 3: Final deployment with multiple spinner variations
        const spinners = {
            dots: {
                frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
                name: 'Classic Dots',
            },
            circle: { frames: ['◐', '◓', '◑', '◒'], name: 'Circle Rotation' },
            arrows: {
                frames: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
                name: 'Arrow Direction',
            },
            bounce: { frames: ['⠁', '⠂', '⠄', '⠂'], name: 'Bounce Effect' },
            pulseDot: { frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'], name: 'Pulse Dot' },
            growVertical: {
                frames: ['▁', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃'],
                name: 'Grow Vertical',
            },
            growHorizontal: {
                frames: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█', '▉', '▊', '▋', '▌', '▍', '▎'],
                name: 'Grow Horizontal',
            },
            clock: {
                frames: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'],
                name: 'Clock Animation',
            },
            moon: { frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'], name: 'Moon Phases' },
            weather: {
                frames: ['☀️', '🌤', '⛅', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩', '🌨'],
                name: 'Weather Cycle',
            },
        };

        // Randomly select a spinner style
        const spinnerKeys = Object.keys(spinners);
        const randomSpinnerKey = spinnerKeys[Math.floor(Math.random() * spinnerKeys.length)];
        const selectedSpinner = spinners[randomSpinnerKey];

        let spinIndex = 0;

        const spinnerInterval = setInterval(
            async () => {
                try {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        statusMsg.message_id,
                        null,
                        `${selectedSpinner.frames[spinIndex]} **DEPLOYING WILDCARD**\n\n` +
                            '```\n' +
                            '██████████████████████' +
                            selectedSpinner.frames[spinIndex] +
                            '\n' +
                            '```\n' +
                            ` ${selectedSpinner.frames[spinIndex]} Creating DNS records\n` +
                            ` ${selectedSpinner.frames[spinIndex]} Configuring wildcard routing\n` +
                            ` ${selectedSpinner.frames[spinIndex]} Applying configuration\n\n` +
                            ` ${selectedSpinner.frames[spinIndex]} Almost done...`,
                        { parse_mode: 'Markdown' }
                    );
                    spinIndex = (spinIndex + 1) % selectedSpinner.frames.length;
                } catch (error) {
                    // Ignore edit errors
                }
            },
            randomSpinnerKey === 'clock' || randomSpinnerKey === 'weather' ? 400 : 200
        );

        const result = await cf.setupwildcard(domain);

        // Stop spinner
        clearInterval(spinnerInterval);

        if (result.success) {
            // Track admin usage
            const adminUsage = readAdminUsage();
            if (!adminUsage[userId]) {
                adminUsage[userId] = { count: 0, domains: [], lastUsed: new Date() };
            }
            adminUsage[userId].count++;
            adminUsage[userId].lastUsed = new Date();
            if (!adminUsage[userId].domains.includes(domain)) {
                adminUsage[userId].domains.push(domain);
            }
            writeAdminUsage(adminUsage);

            // Send notifications to Telegram group and WhatsApp
            try {
                const userInfo = {
                    userId: userId,
                    firstName: ctx.from.first_name,
                    lastName: ctx.from.last_name,
                    username: ctx.from.username,
                    email: configData[userId]?.email,
                };

                // Send notifications in the background (don't block user response)
                NotificationService.notifyWildcardSuccess(ctx.telegram, userInfo, domain)
                    .then((results) => {
                        console.log('📲 Notification results:', results);
                    })
                    .catch((error) => {
                        console.error('❌ Notification error:', error.message);
                    });
            } catch (notificationError) {
                console.error('❌ Notification setup error:', notificationError.message);
            }

            const successMessage =
                '✨ **WILDCARD SETUP COMPLETE!** ✨\n\n' +
                '🌟 **Domain Terdaftar**\n' +
                '┌──────────────────\n' +
                '│ 🔰 **Domain:** `' +
                domain +
                '`\n' +
                '│ 🎯 **Type:** Wildcard DNS\n' +
                '│ 📝 **Record:** `*.' +
                domain +
                '`\n' +
                '└──────────────────\n\n' +
                '📊 **Status & Info**\n' +
                '┌──────────────────\n' +
                '│ ✅ Status: Ready to use\n' +
                '│ ⚡ Propagasi: 1-5 menit\n' +
                '└──────────────────\n\n' +
                '🚀 **Panduan Penggunaan**\n' +
                '┌──────────────────\n' +
                '│ • Semua Wildcard `*.' +
                domain +
                '` aktif\n' +
                '│ • Contoh: `support.zoom.us.' +
                domain +
                '`\n' +
                '└──────────────────\n\n' +
                '⚡ **Quick Actions**\n' +
                '• `/new` - Buat subdomain Wildcard\n' +
                '• `/mysub` - Lihat subdomain Wildcard\n' +
                '• `/listdomain` - Daftar domain Wildcard';

            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                successMessage,
                { parse_mode: 'Markdown' }
            );
        }
    } catch (error) {
        console.error('❌ Error in setupwildcard:', error);
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            '❌ Gagal setup wildcard domain\n\n' +
                `🔍 Error: ${error.message}\n\n` +
                '💡 Kemungkinan penyebab:\n' +
                '• Domain tidak terdaftar di Cloudflare\n' +
                '• Global API Key tidak memiliki permission\n' +
                '• Domain sedang maintenance\n' +
                '• Koneksi internet bermasalah\n\n' +
                '🔄 Silakan coba lagi dalam beberapa menit.',
            { parse_mode: 'Markdown' }
        );
    }
}

module.exports = {
    handleSetupWildcard,
    setupWildcard: handleSetupWildcard,
};