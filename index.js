const { Telegraf } = require('telegraf');
const { readConfig } = require('./utils/fileUtils');
const { BOT_TOKEN } = require('./config/default');

// Import handlers for required commands only
const {
    handleAddCf,
    handleCfConfig, 
    handleUpdateCf,
    handleDeleteCf,
} = require('./handlers/configHandlers');

const {
    handleNew,
    handleListDomain,
    handleSearchDomain,
    handleDelSub,
    handleMySub,
} = require('./handlers/domainHandlers');

const { handleSetupWildcard } = require('./handlers/cloudflareHandlers');

const {
    handleUnknownCommand,
    handleBroadcast,
    handleTestNotification,
} = require('./handlers/generalHandlers');

// Initialize bot
const bot = new Telegraf(BOT_TOKEN);

// Advanced rate limiting with queue system for multiple users
const userQueues = new Map();
const MAX_CONCURRENT_REQUESTS = 100; // Max concurrent requests
const USER_RATE_LIMIT = 5; // Max requests per user per second
const REQUEST_TIMEOUT = 30000; // 30 seconds timeout

class RequestQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.lastRequestTime = 0;
        this.requestCount = 0;
        this.resetTime = Date.now();
    }

    async add(request) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, REQUEST_TIMEOUT);

            this.queue.push({
                request,
                resolve: (result) => {
                    clearTimeout(timeout);
                    resolve(result);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                },
            });

            this.process();
        });
    }

    async process() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        while (this.queue.length > 0) {
            const now = Date.now();

            // Reset rate limit counter every second
            if (now - this.resetTime > 1000) {
                this.requestCount = 0;
                this.resetTime = now;
            }

            // Check rate limit
            if (this.requestCount >= USER_RATE_LIMIT) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                continue;
            }

            const { request, resolve, reject } = this.queue.shift();
            this.requestCount++;

            try {
                const result = await request();
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // Small delay only if needed (not for every request)
            if (this.queue.length > 10) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        }

        this.processing = false;
    }
}

// Global request counter for monitoring
let totalActiveRequests = 0;

// Performance monitoring
const botStats = {
    totalRequests: 0,
    successfulRequests: 0,
    errorRequests: 0,
    activeUsers: new Set(),
    startTime: Date.now(),

    // Performance metrics
    averageResponseTime: 0,
    totalResponseTime: 0,
    maxConcurrentRequests: 0,

    log() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const avgResponseTime =
            this.totalRequests > 0 ? Math.round(this.totalResponseTime / this.totalRequests) : 0;

        console.log(
            `📊 Bot Stats: ${this.totalRequests} requests | ${this.activeUsers.size} users | ${totalActiveRequests} active | ${avgResponseTime}ms avg | ${uptime}s uptime`
        );
    },
};

// Log stats every 5 minutes
setInterval(() => {
    if (botStats.totalRequests > 0) {
        botStats.log();
    }
}, 300000);

// Smart rate limiting middleware
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const requestStart = Date.now();
    botStats.totalRequests++;
    botStats.activeUsers.add(userId);

    // Update max concurrent requests
    if (totalActiveRequests > botStats.maxConcurrentRequests) {
        botStats.maxConcurrentRequests = totalActiveRequests;
    }

    // Check global load
    if (totalActiveRequests >= MAX_CONCURRENT_REQUESTS) {
        botStats.errorRequests++;
        // Silent rejection - don't spam user with error messages
        return;
    }

    // Get or create user queue
    if (!userQueues.has(userId)) {
        userQueues.set(userId, new RequestQueue());
    }

    const userQueue = userQueues.get(userId);

    try {
        totalActiveRequests++;

        await userQueue.add(async () => {
            return await next();
        });

        // Calculate response time
        const responseTime = Date.now() - requestStart;
        botStats.totalResponseTime += responseTime;
        botStats.successfulRequests++;
    } catch (error) {
        botStats.errorRequests++;
        // Silent error handling - log but don't spam user
        console.error(`❌ Request error for user ${userId}:`, error.message);
    } finally {
        totalActiveRequests--;

        // Cleanup inactive queues periodically
        if (Math.random() < 0.01) { // 1% chance to cleanup
            bot.cleanupQueues();
        }
    }
});

// Cleanup function for inactive queues
bot.cleanupQueues = function() {
    const now = Date.now();
    for (const [userId, queue] of userQueues.entries()) {
        if (queue.queue.length === 0 && !queue.processing && now - queue.lastRequestTime > 300000) { // 5 minutes inactive
            userQueues.delete(userId);
        }
    }
};

// Optimized error handling middleware
bot.catch((err, ctx) => {
    // Log error for monitoring but don't spam users
    console.error('❌ Bot error:', {
        error: err.message,
        userId: ctx.from?.id,
        command: ctx.message?.text?.split(' ')[0],
        timestamp: new Date().toISOString(),
    });

    // Only respond to critical errors, not rate limit or timeout errors
    if (
        !err.message.includes('429') &&
        !err.message.includes('timeout') &&
        !err.message.includes('ETELEGRAM') &&
        ctx.chat?.type === 'private'
    ) {
        // Silent error response - minimal and only once
        ctx.reply(
            '❌ **Terjadi kendala sementara**\n\n' +
            '🔄 Silakan coba lagi dalam beberapa detik\n' +
            '💡 Jika masalah berlanjut, gunakan `/start` untuk refresh',
            { parse_mode: 'Markdown' }
        ).catch(() => {}); // Silent catch to prevent error loops
    }
});

// Middleware untuk log user interaction (simplified)
bot.use(async (ctx, next) => {
    const user = ctx.from;
    const chatType = ctx.chat?.type;

    // Restrict to private chats only
    if (chatType !== 'private') {
        return;
    }

    // Simplified logging - only log commands, not every message
    if (user && ctx.message?.text?.startsWith('/')) {
        const command = ctx.message.text.split(' ')[0];
        console.log(`👤 ${user.first_name} | ${command}`);
    }

    return next();
});

// Configuration Commands
bot.command('start', async (ctx) => {
    const userId = String(ctx.from.id);
    const configData = readConfig();
    const isRegistered = !!configData[userId];

    let welcomeMessage = '🎉 **SELAMAT DATANG!**\n\n';
    welcomeMessage += '🚀 Bot untuk mengelola wildcard domain dengan mudah!\n\n';

    if (!isRegistered) {
        welcomeMessage += '📝 **MULAI DENGAN REGISTRASI:**\n';
        welcomeMessage += '```\n/addcf <global_api_key> <email>\n```\n\n';
        welcomeMessage += '🔑 **Cara mendapat Global API Key:**\n';
        welcomeMessage += '1️⃣ Buka [Cloudflare Dashboard](https://dash.cloudflare.com)\n';
        welcomeMessage += '2️⃣ Klik profil → **My Profile** → **API Tokens**\n';
        welcomeMessage += '3️⃣ Di **Global API Key**, klik **"View"** dan copy\n\n';
    } else {
        welcomeMessage += '✅ **Anda sudah terdaftar! Siap digunakan** 🎯\n\n';
    }

    welcomeMessage += '📋 **COMMANDS TERSEDIA:**\n\n';

    if (!isRegistered) {
        welcomeMessage += '🔧 **Setup:** `/addcf` - Daftar akun Cloudflare\n';
        welcomeMessage += '📊 **Info:** `/cfconfig` - Lihat status registrasi\n\n';
        welcomeMessage += '💡 **Setelah registrasi, semua fitur akan terbuka!**';
    } else {
        welcomeMessage += '🔧 **Konfigurasi:**\n';
        welcomeMessage += '• `/cfconfig` - Lihat konfigurasi\n';
        welcomeMessage += '• `/updatecf` - Update konfigurasi\n';
        welcomeMessage += '• `/deletecf` - Hapus konfigurasi\n\n';
        welcomeMessage += '🌐 **Domain Management:**\n';
        welcomeMessage += '• `/setupwildcard <domain>` - Setup wildcard\n';
        welcomeMessage += '• `/listdomain` - Lihat domain tersedia\n';
        welcomeMessage += '• `/new <subdomain>` - Tambah subdomain\n';
        welcomeMessage += '• `/mysub` - Lihat subdomain Anda\n';
        welcomeMessage += '• `/searchdomain <keyword>` - Cari domain\n';
        welcomeMessage += '• `/delsub <subdomain>` - Hapus subdomain\n\n';
        welcomeMessage += '⚡ **QUICK START:** Gunakan `/listdomain` untuk melihat domain yang tersedia!';
    }

    return ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
    });
});

bot.command('addcf', handleAddCf);
bot.command('cfconfig', handleCfConfig);
bot.command('updatecf', handleUpdateCf);
bot.command('deletecf', handleDeleteCf);

// Domain Management Commands
bot.command('listdomain', handleListDomain);
bot.command('new', handleNew);
bot.command('mysub', handleMySub);
bot.command('searchdomain', handleSearchDomain);
bot.command('delsub', handleDelSub);

// Wildcard Setup Command
bot.command('setupwildcard', handleSetupWildcard);

// Admin Commands
bot.command('broadcast', handleBroadcast);
bot.command('testnotif', handleTestNotification);

// Handle confirmation for delete config
bot.hears(/^CONFIRM DELETE$/i, async (ctx) => {
    const userId = String(ctx.from.id);
    const configData = readConfig();

    if (!configData[userId]) {
        return ctx.reply(
            '⚠️ *Tidak ada konfigurasi untuk dihapus*\n\n' +
            '📝 Anda belum terdaftar di sistem.',
            { parse_mode: 'Markdown' }
        );
    }

    try {
        delete configData[userId];
        require('./utils/fileUtils').writeConfig(configData);

        return ctx.reply(
            '✅ *Konfigurasi berhasil dihapus!*\n\n' +
            '🗑️ Semua data Cloudflare Anda telah dihapus dari sistem.\n' +
            '📝 Gunakan /addcf untuk mendaftar kembali.',
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('❌ Error deleting config:', error);
        return ctx.reply(
            '❌ *Gagal menghapus konfigurasi*\n\n' +
            '🔄 Silakan coba lagi atau hubungi admin.',
            { parse_mode: 'Markdown' }
        );
    }
});

// Handle unknown commands and messages (completely silent)
bot.on('text', (ctx) => {
    const text = ctx.message.text;

    // Only process commands (starts with /)
    if (text.startsWith('/')) {
        const command = text.split(' ')[0];
        const knownCommands = [
            '/start',
            '/addcf',
            '/cfconfig',
            '/updatecf',
            '/deletecf',
            '/listdomain',
            '/new',
            '/mysub',
            '/searchdomain',
            '/delsub',
            '/setupwildcard',
            '/broadcast',
            '/testnotif',
        ];

        // Unknown commands are silently ignored - no response
        if (!knownCommands.includes(command)) {
            return; // Silent ignore
        }
    }
    // Non-command text is silently ignored
});

// Handle non-text messages silently (no response)
bot.on(['photo', 'sticker', 'document', 'video', 'voice', 'audio', 'location', 'contact'], (ctx) => {
    // Silently ignore all non-text messages
    return;
});

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    bot.stop('SIGTERM');
});

// Start bot
console.log('🚀 WildCard Bot Starting...');

bot.launch()
    .then(() => {
        console.log('✅ Bot Online | Users: 0 | Load: 0%');
        console.log('📋 Commands: 10 active | Ready for requests');

        // Initial stats
        botStats.log();
    })
    .catch((err) => {
        console.error('❌ Failed to start:', err.message);
        process.exit(1);
    });

// Export bot for testing purposes
module.exports = bot;