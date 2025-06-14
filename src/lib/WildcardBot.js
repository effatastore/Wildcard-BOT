const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');

// Import all handlers
const configHandlers = require('../handlers/configHandlers');
const domainHandlers = require('../handlers/domainHandlers');
const cloudflareHandlers = require('../handlers/cloudflareHandlers');
const generalHandlers = require('../handlers/generalHandlers');
const adminHandlers = require('../handlers/adminHandlers');

// Import services
const NotificationService = require('../services/NotificationService');

class WildcardBot {
    constructor(options = {}) {
        this.options = {
            configPath: options.configPath || './config/default.js',
            dataPath: options.dataPath || './data',
            ...options,
        };

        // Load configuration
        this.loadConfig();

        // Initialize bot with timeout configuration
        this.bot = new Telegraf(process.env.BOT_TOKEN, {
            telegram: {
                agent: null,
                webhookReply: false,
                // Increase timeout to prevent ETIMEDOUT errors
                timeout: 30000, // 30 seconds timeout
                retryAfter: 1,
                // Add polling configuration
                polling: {
                    timeout: 30,
                    limit: 100,
                    allowed_updates: ['message', 'callback_query']
                }
            }
        });

        // Setup data directory
        this.setupDataDirectory();

        // Initialize handlers
        this.initializeHandlers();

        console.log('🤖 Wildcard Bot initialized successfully!');
    }

    loadConfig() {
        try {
            // Load user config
            const configPath = path.resolve(this.options.configPath);
            if (fs.existsSync(configPath)) {
                this.config = require(configPath);
                console.log(`✅ Configuration loaded from: ${configPath}`);
            } else {
                // Fallback to default config
                this.config = require('../config/default');
                console.log('⚠️ Using default configuration');
            }
        } catch (error) {
            console.error('❌ Failed to load configuration:', error.message);
            // Use minimal default config
            this.config = {
                ADMIN_IDS: [],
                MAX_CUSTOM_DOMAINS: 5,
                MAX_DOMAINS_PER_USER: 10,
                NOTIFICATIONS: {
                    TELEGRAM: { enabled: true },
                    WHATSAPP: { enabled: false },
                },
                DEFAULT_DOMAINS: ['example.com'],
            };
        }

        // Make config globally available
        global.BOT_CONFIG = this.config;
    }

    setupDataDirectory() {
        const dataDir = path.resolve(this.options.dataPath);

        // Create data directory if it doesn't exist
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`📁 Created data directory: ${dataDir}`);
        }

        // Initialize data files if they don't exist
        const dataFiles = [
            { file: 'config.json', content: {} },
            { file: 'domains.json', content: this.config.DEFAULT_DOMAINS || [] },
            { file: 'customDomains.json', content: {} },
            { file: 'adminUsage.json', content: {} },
        ];

        dataFiles.forEach(({ file, content }) => {
            const filePath = path.join(dataDir, file);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
                console.log(`📄 Created data file: ${file}`);
            }
        });
    }

    initializeHandlers() {
        // Register all command handlers
        this.registerGeneralCommands();
        this.registerConfigCommands();
        this.registerDomainCommands();
        this.registerCloudflareCommands();
        this.registerAdminCommands();

        // Error handling with better timeout management
        this.bot.catch(async (err, ctx) => {
            console.error('❌ Bot error:', err);
            
            // Handle different types of errors
            if (err.code === 'ETIMEDOUT') {
                console.error('⏰ Request timeout - retrying operation');
                try {
                    await ctx.reply('⏰ Koneksi timeout. Bot sedang mencoba ulang...');
                } catch (retryError) {
                    console.error('❌ Failed to send timeout message:', retryError.message);
                }
            } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNRESET') {
                console.error('🌐 Network connection error');
                try {
                    await ctx.reply('🌐 Masalah koneksi jaringan. Silakan coba lagi dalam beberapa saat.');
                } catch (retryError) {
                    console.error('❌ Failed to send network error message:', retryError.message);
                }
            } else if (err.response && err.response.error_code === 429) {
                console.error('📊 Rate limit exceeded');
                try {
                    await ctx.reply('📊 Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.');
                } catch (retryError) {
                    console.error('❌ Failed to send rate limit message:', retryError.message);
                }
            } else {
                // Generic error
                try {
                    await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi atau hubungi admin.');
                } catch (retryError) {
                    console.error('❌ Failed to send error message:', retryError.message);
                }
            }
        });

        console.log('🔧 All command handlers registered');
    }

    registerGeneralCommands() {
        this.bot.start(generalHandlers.startCommand);
        this.bot.help(generalHandlers.helpCommand);
        this.bot.command('ping', (ctx) => ctx.reply('🏓 Pong!'));
    }

    registerConfigCommands() {
        this.bot.command('addcf', configHandlers.addCloudflareConfig);
        this.bot.command('cfconfig', configHandlers.viewCloudflareConfig);
        this.bot.command('updatecf', configHandlers.updateCloudflareConfig);
        this.bot.command('deletecf', configHandlers.deleteCloudflareConfig);
    }

    registerDomainCommands() {
        this.bot.command('listdomain', domainHandlers.listDomains);
        this.bot.command('new', domainHandlers.addCustomDomain);
        this.bot.command('mysub', domainHandlers.mySubdomains);
        this.bot.command('searchdomain', domainHandlers.handleSearchDomain);
        this.bot.command('delsub', domainHandlers.handleDelSub);
        this.bot.command('analytics', domainHandlers.domainAnalytics);
        this.bot.command('clearcache', domainHandlers.clearCache);

        // Handle CONFIRM DELETE text
        this.bot.hears(/^CONFIRM DELETE$/i, async (ctx) => {
            const { deleteCloudflareConfig } = require('../handlers/configHandlers');
            try {
                // Process the deletion
                ctx.message.text = '/deletecf CONFIRM DELETE';
                await deleteCloudflareConfig(ctx);
            } catch (error) {
                console.error('❌ Error processing CONFIRM DELETE:', error);
                await ctx.reply(
                    '❌ Terjadi kesalahan saat menghapus konfigurasi. Silakan coba lagi.'
                );
            }
        });
    }

    registerCloudflareCommands() {
        this.bot.command('setupwildcard', cloudflareHandlers.setupWildcard);
    }

    registerAdminCommands() {
        // Only register admin commands if admin IDs are configured
        if (this.config.ADMIN_IDS && this.config.ADMIN_IDS.length > 0) {
            this.bot.command('stats', adminHandlers.botStats);
            this.bot.command('broadcast', adminHandlers.broadcastMessage);
            this.bot.command('userinfo', adminHandlers.userInfo);
            this.bot.command('testnotif', adminHandlers.testNotification);
            console.log(
                `👑 Admin commands registered for ${this.config.ADMIN_IDS.length} admin(s)`
            );
        } else {
            console.log('⚠️ No admin IDs configured - admin commands disabled');
        }
    }

    async start() {
        try {
            // Validate bot token
            if (!process.env.BOT_TOKEN) {
                throw new Error('BOT_TOKEN environment variable is required');
            }

            // Start bot
            await this.bot.launch();

            console.log('🚀 Wildcard Bot started successfully!');
            console.log(`📱 Bot username: @${this.bot.botInfo.username}`);
            console.log(`👑 Admin IDs: ${this.config.ADMIN_IDS.join(', ') || 'None configured'}`);
            console.log('✨ Bot is ready to receive commands!');

            // Enable graceful stop
            process.once('SIGINT', () => this.stop());
            process.once('SIGTERM', () => this.stop());

            return true;
        } catch (error) {
            console.error('❌ Failed to start bot:', error.message);
            throw error;
        }
    }

    stop() {
        console.log('👋 Stopping Wildcard Bot...');
        this.bot.stop('SIGINT');
        console.log('✅ Bot stopped successfully');
    }

    // Utility methods for users
    async sendNotification(message, type = 'info') {
        try {
            // Only send Telegram notifications
            if (this.config.NOTIFICATIONS?.TELEGRAM?.enabled) {
                await NotificationService.sendTelegramNotification(this.bot.telegram, message);
                return true;
            } else {
                console.log('⚠️ Telegram notifications not enabled');
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to send notification:', error.message);
            return false;
        }
    }

    // Get bot statistics
    getBotStats() {
        const configPath = path.join(this.options.dataPath, 'config.json');
        const customDomainsPath = path.join(this.options.dataPath, 'customDomains.json');

        let userCount = 0;
        let domainCount = 0;

        try {
            if (fs.existsSync(configPath)) {
                const configs = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                userCount = Object.keys(configs).length;
            }

            if (fs.existsSync(customDomainsPath)) {
                const domains = JSON.parse(fs.readFileSync(customDomainsPath, 'utf8'));
                domainCount = Object.values(domains).flat().length;
            }
        } catch (error) {
            console.error('Error reading stats:', error.message);
        }

        return {
            users: userCount,
            domains: domainCount,
            uptime: process.uptime(),
            version: require('../package.json').version,
        };
    }
}

module.exports = WildcardBot;