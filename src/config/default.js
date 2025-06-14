require('dotenv').config();
// === WILDCARD TELEGRAM BOT CONFIGURATION ===
// Bot Configuration from environment
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_IDS = process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(',').map((id) => parseInt(id.trim()))
    : [];
// Domain Configuration
const MAX_CUSTOM_DOMAINS = parseInt(process.env.MAX_CUSTOM_DOMAINS) || 5;
// File Paths
const PATHS = {
    CONFIG: './data/config.json',
    DOMAINS: './data/domains.json',
    CUSTOM_DOMAINS: './data/customDomains.json',
    ADMIN_USAGE: './data/adminUsage.json',
};
// Cloudflare Configuration
const CLOUDFLARE = {
    BASE_URL: 'https://api.cloudflare.com/client/v4',
    TIMEOUT: 30000,
    RATE_LIMIT: {
        REQUESTS_PER_MINUTE: 100,
        BURST_SIZE: 10,
    },
};
// Security and Validation
const FORBIDDEN_KEYWORDS = [
    'admin',
    'root',
    'www',
    'mail',
    'ftp',
    'ssh',
    'api',
    'test',
    'dev',
    'staging',
    'prod',
    'porn',
    'xxx',
    'adult',
    'sex',
    'gambling',
];
// Default domains available for wildcard setup
const DEFAULT_DOMAINS = ['example.com', 'test.com', 'demo.com'];
// Cache Configuration
const CACHE_CONFIG = {
    BROWSER_CACHE: 3600, // 1 hour
    EDGE_CACHE: 3600, // 1 hour
    DNS_TTL: 300, // 5 minutes
};
// Rate Limiting
const RATE_LIMITS = {
    SETUP_WILDCARD: {
        PER_USER: 3, // Max 3 wildcard setups per user per day
        COOLDOWN: 60 * 60, // 1 hour cooldown between setups
    },
    ANALYTICS: {
        PER_USER: 10, // Max 10 analytics requests per user per hour
        COOLDOWN: 5 * 60, // 5 minutes cooldown
    },
    CLEAR_CACHE: {
        PER_USER: 5, // Max 5 cache clears per user per hour
        COOLDOWN: 10 * 60, // 10 minutes cooldown
    },
};
// System Configuration
const SYSTEM = {
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    NODE_ENV: process.env.NODE_ENV || 'development',
    MAX_MESSAGE_LENGTH: 4096, // Telegram message limit
    TIMEOUT_LONG_OPERATIONS: 5 * 60 * 1000, // 5 minutes
};
// Validation function
function validateConfig() {
    const errors = [];
    if (!BOT_TOKEN) {
        errors.push('BOT_TOKEN is required in .env file');
    }
    if (ADMIN_IDS.length === 0) {
        errors.push('ADMIN_IDS is required in .env file');
    }
    if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach((error) => console.error(`   - ${error}`));
        console.error('\n💡 Please check your .env file');
        return false;
    }
    return true;
}
module.exports = {
    BOT_TOKEN,
    ADMIN_IDS,
    MAX_CUSTOM_DOMAINS,
    PATHS,
    CLOUDFLARE,
    FORBIDDEN_KEYWORDS,
    DEFAULT_DOMAINS,
    CACHE_CONFIG,
    RATE_LIMITS,
    SYSTEM,
    validateConfig,
    // Notification Settings - Only Telegram
    NOTIFICATIONS: {
        TELEGRAM: {
            enabled: true,
            groupId: process.env.TELEGRAM_GROUP_ID || '', // ID grup Telegram untuk notifikasi
        },
        WHATSAPP: {
            enabled: false, // Disabled - hanya gunakan Telegram
        },
    },
};