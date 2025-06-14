const { REQUIRED_CHANNEL } = require('../config/default');

// Simple in-memory storage for users who confirmed channel membership
// In production, you might want to use a database or file storage
const confirmedUsers = new Set();

/**
 * Add user to confirmed list (called when user clicks "Sudah Join")
 */
function confirmUserMembership(userId) {
    confirmedUsers.add(String(userId));
}

/**
 * Check if user has confirmed membership
 */
function isUserConfirmed(userId) {
    return confirmedUsers.has(String(userId));
}

/**
 * Middleware untuk memastikan bot hanya digunakan di private chat
 */
function privateOnly(ctx, next) {
    if (ctx.chat.type !== 'private') {
        return ctx.reply(
            '🔒 **BOT PRIVATE ONLY**\n\n' +
            '❌ Bot ini hanya dapat digunakan di private message\n\n' +
            '💡 **Cara menggunakan:**\n' +
            '• Klik username bot untuk chat private\n' +
            '• Atau ketik `/start` di chat private dengan bot\n\n' +
            '🤖 Silakan chat bot secara private untuk menggunakan semua fitur',
            { parse_mode: 'Markdown' }
        );
    }
    return next();
}

/**
 * Middleware untuk memastikan user sudah join channel wajib
 */
async function requireChannelSubscription(ctx, next) {
    const userId = ctx.from.id;
    
    try {
        // Skip check untuk admin
        const { ADMIN_IDS } = require('../config/default');
        if (ADMIN_IDS.includes(Number(userId))) {
            return next();
        }
        
        // Check if user already confirmed membership (bypass for large channels)
        if (isUserConfirmed(userId)) {
            return next();
        }
        
        // Cek apakah user sudah join channel
        const channelToCheck = REQUIRED_CHANNEL.ID || REQUIRED_CHANNEL.USERNAME;
        const member = await ctx.telegram.getChatMember(channelToCheck, userId);
        
        // Status yang diizinkan: member, administrator, creator
        const allowedStatuses = ['member', 'administrator', 'creator'];
        
        if (!allowedStatuses.includes(member.status)) {
            return ctx.reply(
                '🔒 **AKSES DITOLAK**\n\n' +
                '❌ Anda harus bergabung dengan channel terlebih dahulu\n\n' +
                `📢 **Channel Wajib:**\n` +
                `• ${REQUIRED_CHANNEL.NAME}\n` +
                `• ${REQUIRED_CHANNEL.USERNAME}\n\n` +
                '✅ **Langkah-langkah:**\n' +
                '1️⃣ Klik link channel di atas\n' +
                '2️⃣ Join/Subscribe channel\n' +
                '3️⃣ Kembali ke bot dan coba lagi\n\n' +
                '💡 Setelah join channel, semua fitur bot akan terbuka',
                { 
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📢 Join Channel', url: `https://t.me/${REQUIRED_CHANNEL.USERNAME.replace('@', '')}` }
                        ]]
                    }
                }
            );
        }
        
        return next();
        
    } catch (error) {
        console.error('Error checking channel membership:', error);
        
        // Jika error API, berikan pesan yang user-friendly
        return ctx.reply(
            '⚠️ **TIDAK DAPAT MEMVERIFIKASI**\n\n' +
            '🔍 Tidak dapat memeriksa status membership channel\n\n' +
            `📢 **Pastikan Anda sudah join:**\n` +
            `• ${REQUIRED_CHANNEL.NAME}\n` +
            `• ${REQUIRED_CHANNEL.USERNAME}\n\n` +
            '💡 Jika sudah join, coba lagi dalam beberapa menit',
            { 
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📢 Join Channel', url: `https://t.me/${REQUIRED_CHANNEL.USERNAME.replace('@', '')}` }
                    ]]
                }
            }
        );
    }
}

module.exports = {
    privateOnly,
    requireChannelSubscription,
    confirmUserMembership,
    isUserConfirmed
}; 