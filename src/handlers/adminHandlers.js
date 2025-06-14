const fs = require('fs');
const path = require('path');
const { readConfig } = require('../utils/fileUtils');
const NotificationService = require('../services/NotificationService');
// Get admin IDs from config with proper fallback
let ADMIN_IDS = [];
// Try to load admin IDs from various sources
function loadAdminIds() {
    try {
        // First try to load from config file
        const configPath = path.join(process.cwd(), 'config', 'default.js');
        if (fs.existsSync(configPath)) {
            delete require.cache[require.resolve(configPath)];
            const config = require(configPath);
            if (config.ADMIN_IDS && Array.isArray(config.ADMIN_IDS)) {
                ADMIN_IDS = config.ADMIN_IDS.map((id) => Number(id));
                console.log('✅ Admin IDs loaded from config/default.js:', ADMIN_IDS);
                return;
            }
        }
        // Fallback to global config
        if (global.BOT_CONFIG?.ADMIN_IDS && Array.isArray(global.BOT_CONFIG.ADMIN_IDS)) {
            ADMIN_IDS = global.BOT_CONFIG.ADMIN_IDS.map((id) => Number(id));
            console.log('✅ Admin IDs loaded from global config:', ADMIN_IDS);
            return;
        }
        // Fallback to environment variable
        if (process.env.ADMIN_IDS) {
            ADMIN_IDS = process.env.ADMIN_IDS.split(',').map((id) => Number(id.trim()));
            console.log('✅ Admin IDs loaded from environment:', ADMIN_IDS);
            return;
        }
        console.log('⚠️ No admin IDs found in configuration');
    } catch (error) {
        console.error('❌ Error loading admin IDs:', error.message);
    }
}
// Load admin IDs on module initialization
loadAdminIds();
// Helper function to check if user is admin
function isAdmin(userId) {
    const numericUserId = Number(userId);
    const isAdminUser = ADMIN_IDS.includes(numericUserId);
    // Debug logging
    console.log(`🔍 Admin check for user ${userId}:`);
    console.log(`   - Numeric ID: ${numericUserId}`);
    console.log(`   - Admin IDs: [${ADMIN_IDS.join(', ')}]`);
    console.log(`   - Is Admin: ${isAdminUser}`);
    return isAdminUser;
}
/**
 * Handler untuk command /stats (Admin only)
 * Menampilkan statistik bot
 */
async function botStats(ctx) {
    const userId = ctx.from.id;
    // Check if user is admin
    if (!isAdmin(userId)) {
        return ctx.reply(
            '❌ *Akses ditolak!*\n\n' +
                '🔒 Hanya admin yang dapat menggunakan command ini.\n' +
                `💡 User ID Anda: \`${userId}\`\n` +
                `📋 Admin IDs: \`[${ADMIN_IDS.join(', ')}]\`\n\n` +
                '💬 Hubungi admin jika ada keperluan.',
            { parse_mode: 'Markdown' }
        );
    }
    try {
        // Read data files
        const configPath = path.join(process.cwd(), 'data', 'user_config.json');
        const customDomainsPath = path.join(process.cwd(), 'data', 'custom_subdomains.json');
        const adminUsagePath = path.join(process.cwd(), 'data', 'admin_usage.json');
        let userCount = 0;
        let domainCount = 0;
        let totalSubdomains = 0;
        // Count users
        if (fs.existsSync(configPath)) {
            const configs = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            userCount = Object.keys(configs).length;
        }
        // Count custom domains
        if (fs.existsSync(customDomainsPath)) {
            const domains = JSON.parse(fs.readFileSync(customDomainsPath, 'utf8'));
            domainCount = Object.keys(domains).length;
            totalSubdomains = Object.values(domains).reduce((acc, userDomains) => {
                return acc + (Array.isArray(userDomains) ? userDomains.length : 0);
            }, 0);
        }
        // Bot uptime
        const uptimeSeconds = Math.floor(process.uptime());
        const uptimeFormatted = formatUptime(uptimeSeconds);
        // Memory usage
        const memUsage = process.memoryUsage();
        const memUsed = Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100;
        const statsMessage = `📊 **BOT STATISTICS**
👥 **Users & Domains:**
• Registered Users: ${userCount}
• Active Domains: ${domainCount}
• Total Subdomains: ${totalSubdomains}

⚡ **System Status:**
• Uptime: ${uptimeFormatted}
• Memory Usage: ${memUsed} MB
• Node.js Version: ${process.version}

🤖 **Bot Info:**
• Bot Username: @${ctx.botInfo?.username || 'Unknown'}
• Process ID: ${process.pid}
• Last Updated: ${new Date().toLocaleString('id-ID')}

👑 **Admin Config:**
• Admin IDs: [${ADMIN_IDS.join(', ')}]
• Your ID: ${userId}

🔧 **Admin Commands:**
• /stats - Bot statistics
• /broadcast <msg> - Send message to all users
• /userinfo <id> - Get user information
• /testnotif - Test notification system`;
        await ctx.reply(statsMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('❌ Error getting bot stats:', error);
        await ctx.reply('❌ Gagal mengambil statistik bot.');
    }
}
/**
 * Handler untuk command /broadcast (Admin only)
 * Broadcast pesan ke semua user
 */
async function broadcastMessage(ctx) {
    const userId = String(ctx.from.id);
    if (!isAdmin(userId)) {
        return ctx.reply(
            '⚠️ *Akses ditolak!*\n\n' +
                '🔒 Hanya admin yang dapat menggunakan fitur broadcast.\n' +
                `💡 User ID Anda: \`${userId}\`\n` +
                `📋 Admin IDs: \`[${ADMIN_IDS.join(', ')}]\`\n\n` +
                '💬 Hubungi admin jika ada keperluan.',
            { parse_mode: 'Markdown' }
        );
    }
    const message = ctx.message.text.replace('/broadcast', '').trim();
    if (!message) {
        return ctx.reply(
            '❌ *Format tidak valid!*\n\n' +
                '📝 Format: `/broadcast <pesan>`\n' +
                '📖 Contoh: `/broadcast Server akan maintenance dalam 1 jam`\n\n' +
                '💡 Pesan akan dikirim ke semua user yang terdaftar.',
            { parse_mode: 'Markdown' }
        );
    }
    const configData = readConfig();
    const userIds = Object.keys(configData);
    if (userIds.length === 0) {
        return ctx.reply(
            '⚠️ *Tidak ada user terdaftar*\n\n' + '📝 Belum ada user yang terdaftar di sistem.',
            { parse_mode: 'Markdown' }
        );
    }
    const statusMsg = await ctx.reply(
        '⏳ *Mengirim broadcast...*\n\n' +
            `📨 Target: ${userIds.length} user\n` +
            `📝 Pesan: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
    );
    let sentCount = 0;
    let failCount = 0;
    for (const targetUserId of userIds) {
        try {
            await ctx.telegram.sendMessage(
                targetUserId,
                '📢 *Pesan dari Admin*\n\n' +
                    `${message}\n\n` +
                    '🤖 Pesan ini dikirim otomatis oleh WildCard Bot',
                { parse_mode: 'Markdown' }
            );
            sentCount++;
            await new Promise((resolve) => setTimeout(resolve, 100)); // Rate limiting
        } catch (error) {
            console.error(`Failed to send to user ${targetUserId}:`, error.message);
            failCount++;
        }
    }
    await ctx.reply(
        '📢 **BROADCAST BERHASIL DIKIRIM**\n\n' +
            '📊 **Statistik pengiriman:**\n' +
            '• Total pengguna: ' +
            userIds.length +
            '\n' +
            '• Berhasil dikirim: ' +
            sentCount +
            '\n' +
            '• Gagal: ' +
            failCount +
            '\n' +
            '• Waktu kirim: ' +
            new Date().toLocaleString('id-ID') +
            '\n\n' +
            '💬 **Pesan yang dikirim:**\n' +
            message,
        { parse_mode: 'Markdown' }
    );
}
/**
 * Handler untuk command /userinfo (Admin only)
 * Mendapatkan informasi detail user
 */
async function userInfo(ctx) {
    const userId = ctx.from.id;
    // Check if user is admin
    if (!isAdmin(userId)) {
        return ctx.reply(
            '❌ *Akses ditolak!*\n\n' +
                '🔒 Hanya admin yang dapat menggunakan command ini.\n' +
                `💡 User ID Anda: \`${userId}\`\n` +
                `📋 Admin IDs: \`[${ADMIN_IDS.join(', ')}]\``,
            { parse_mode: 'Markdown' }
        );
    }
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply(
            '❌ Format tidak valid!\n\n' +
                '📝 Format: `/userinfo <user_id>`\n' +
                '📖 Contoh: `/userinfo 123456789`'
        );
    }
    const targetUserId = args[1];
    try {
        // Get user config
        const configData = readConfig();
        const userConfig = configData[targetUserId];
        if (!userConfig) {
            return ctx.reply(`❌ User dengan ID ${targetUserId} tidak ditemukan.`);
        }
        // Get user's custom domains
        const customDomainsPath = path.join(process.cwd(), 'data', 'custom_subdomains.json');
        let userDomains = [];
        if (fs.existsSync(customDomainsPath)) {
            const allDomains = JSON.parse(fs.readFileSync(customDomainsPath, 'utf8'));
            userDomains = allDomains[targetUserId] || [];
        }
        // Try to get user info from Telegram
        let telegramInfo = 'N/A';
        try {
            const chatInfo = await ctx.telegram.getChat(targetUserId);
            telegramInfo =
                `@${chatInfo.username || 'No username'} (${chatInfo.first_name || ''} ${chatInfo.last_name || ''})`.trim();
        } catch (error) {
            telegramInfo = 'Unable to fetch';
        }
        const userInfoMessage = `👤 **USER INFORMATION**
🆔 **Basic Info:**
• User ID: \`${targetUserId}\`
• Telegram: ${telegramInfo}
• Registration: ${userConfig.registrationDate || 'Unknown'}

☁️ **Cloudflare Config:**
• Email: ${userConfig.email || 'Not set'}
• API Key: ${userConfig.apiKey ? '✅ Configured' : '❌ Not set'}

🌐 **Domains:**
• Custom Domains: ${userDomains.length}
• Domain List: ${userDomains.length > 0 ? userDomains.join(', ') : 'None'}

📊 **Statistics:**
• Total Domains Created: ${userDomains.length}
• Last Activity: ${userConfig.lastActivity || 'Unknown'}

🔧 **Admin Actions:**
/broadcast - Send message to all users
/stats - View bot statistics`;
        await ctx.reply(userInfoMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('❌ Error getting user info:', error);
        await ctx.reply('❌ Gagal mengambil informasi user.');
    }
}
/**
 * Test notifikasi ke Telegram grup
 */
async function testNotification(ctx) {
    const userId = ctx.from.id;
    // Check admin authorization
    if (!isAdmin(userId)) {
        console.log(`❌ Unauthorized test notification attempt by user ${userId}`);
        await ctx.reply('❌ Perintah ini khusus untuk admin bot.');
        return;
    }
    try {
        console.log('🧪 Testing Telegram notification...');
        await ctx.reply(
            '🧪 Menguji notifikasi...\n\n⏳ Mengirim pesan test ke Telegram grup...'
        );
        // Send test notification using ctx.telegram
        const results = await NotificationService.sendTestNotification(ctx.telegram);
        let resultMessage = '🧪 **TEST NOTIFICATION RESULTS**\n\n';
        // Check Telegram results
        if (results.telegram) {
            resultMessage += '✅ **Telegram Group:** Berhasil terkirim\n';
        } else {
            resultMessage += '❌ **Telegram Group:** Gagal terkirim\n';
        }
        // Status
        if (results.telegram) {
            resultMessage += '\n📊 **Status:** Notifikasi berfungsi dengan baik ✅\n\n';
        } else {
            resultMessage += '\n📊 **Status:** Notifikasi tidak berfungsi ❌\n\n';
        }
        // Tips
        resultMessage += '💡 **Tips:**\n';
        resultMessage += '• Pastikan bot sudah ditambahkan ke grup Telegram\n';
        resultMessage += '• Verifikasi TELEGRAM_GROUP_ID di environment variables\n';
        resultMessage += '• Periksa koneksi internet bot';
        await ctx.reply(resultMessage, { parse_mode: 'Markdown' });
        console.log('✅ Test notification completed');
    } catch (error) {
        console.error('❌ Test notification error:', error);
        await ctx.reply(
            '❌ **Gagal menguji notifikasi**\n\n' +
                'Terjadi kesalahan saat menguji sistem notifikasi. ' +
                'Silakan periksa log server untuk detail error.'
        );
    }
}
/**
 * Format uptime seconds to human readable
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

module.exports = {
    botStats,
    broadcastMessage,
    userInfo,
    testNotification,
    loadAdminIds, // Export untuk testing/debugging
    isAdmin, // Export untuk testing/debugging
};