const { readConfig } = require('../utils/fileUtils');
const { ADMIN_IDS } = require('../config/default');
const NotificationService = require('../services/NotificationService');

/**
 * Handler untuk command yang tidak dikenali
 */
async function handleUnknownCommand(ctx) {
    const command = ctx.message.text;
    const userId = String(ctx.from.id);
    const configData = readConfig();
    
    let unknownMsg = '❓ **COMMAND TIDAK DIKENAL**\n\n';
    unknownMsg += `🔍 Command yang Anda masukkan: \`${command}\`\n\n`;
    
    if (!configData[userId]) {
        unknownMsg += '⚠️ **ANDA BELUM TERDAFTAR**\n\n';
        unknownMsg += '📝 Langkah pertama: Daftar dengan command:\n';
        unknownMsg += '```\n/addcf <global_api_key> <email>\n```\n\n';
        unknownMsg += '💡 **Command yang tersedia:**\n';
        unknownMsg += '• `/addcf` - Daftar dengan Cloudflare\n';
        unknownMsg += '• `/cfconfig` - Lihat konfigurasi\n';
    } else {
        unknownMsg += '📋 **DAFTAR COMMAND TERSEDIA:**\n\n';
        
        unknownMsg += '🔧 **Konfigurasi:**\n';
        unknownMsg += '• `/cfconfig` - Lihat konfigurasi\n';
        unknownMsg += '• `/updatecf` - Update konfigurasi\n';
        unknownMsg += '• `/deletecf` - Hapus konfigurasi\n\n';
        
        unknownMsg += '🌐 **Domain Management:**\n';
        unknownMsg += '• `/setupwildcard` - Setup wildcard domain\n';
        unknownMsg += '• `/listdomain` - Lihat semua domain\n';
        unknownMsg += '• `/new` - Tambah custom subdomain\n';
        unknownMsg += '• `/mysub` - Lihat subdomain Anda\n';
        unknownMsg += '• `/searchdomain` - Cari domain\n';
        unknownMsg += '• `/delsub` - Hapus subdomain Anda\n\n';
        
        if (ADMIN_IDS.includes(Number(userId))) {
            unknownMsg += '👑 **Admin Only:**\n';
            unknownMsg += '• `/broadcast` - Broadcast pesan ke semua user\n\n';
        }
    }
    
    unknownMsg += '💡 **Tips:** Command harus diawali dengan `/` dan pastikan ejaan benar';

    unknownMsg += '📝 Command harus diawali dengan `/`\n';
    unknownMsg += '🔤 Pastikan ejaan command benar';
    
    return ctx.reply(unknownMsg, { parse_mode: 'Markdown' });
}

/**
 * Handler untuk command broadcast (admin only)
 */
async function handleBroadcast(ctx) {
    const userId = String(ctx.from.id);
    
    if (!ADMIN_IDS.includes(Number(userId))) {
        return ctx.reply(
            '⚠️ *Akses ditolak!*\n\n' +
            '🔒 Hanya admin yang dapat menggunakan fitur broadcast.\n' +
            '💡 Hubungi admin jika ada keperluan.',
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
            '⚠️ *Tidak ada user terdaftar*\n\n' +
            '📝 Belum ada user yang terdaftar di sistem.',
            { parse_mode: 'Markdown' }
        );
    }
    
    const statusMsg = await ctx.reply(
        `⏳ *Mengirim broadcast...*\n\n` +
        `📨 Target: ${userIds.length} user\n` +
        `📝 Pesan: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
    );
    
    let sentCount = 0;
    let failCount = 0;
    
    for (const targetUserId of userIds) {
        try {
            await ctx.telegram.sendMessage(
                targetUserId,
                `📢 *Pesan dari Admin*\n\n` +
                `${message}\n\n` +
                `🤖 Pesan ini dikirim otomatis oleh WildCard Bot`,
                { parse_mode: 'Markdown' }
            );
            sentCount++;
            await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        } catch (error) {
            console.error(`Failed to send to user ${targetUserId}:`, error.message);
            failCount++;
        }
    }
    
    await ctx.reply(
        '📢 **BROADCAST BERHASIL DIKIRIM**\n\n' +
        '📊 **Statistik pengiriman:**\n' +
        '• Total pengguna: ' + sentCount + '\n' +
        '• Berhasil dikirim: ' + sentCount + '\n' +
        '• Gagal: ' + failCount + '\n' +
        '• Waktu kirim: ' + new Date().toLocaleString('id-ID') + '\n\n' +
        '💬 **Pesan yang dikirim:**\n' +
        message.substring(11),
        { parse_mode: 'Markdown' }
    );
}

/**
 * Handler untuk command /testnotif (Admin only)
 * Test notifikasi ke Telegram grup dan WhatsApp
 */
async function handleTestNotification(ctx) {
    const userId = ctx.from.id;
    
    // Check if user is admin
    if (!ADMIN_IDS.includes(userId)) {
        return ctx.reply('❌ Command ini hanya untuk admin.');
    }
    
    const statusMsg = await ctx.reply('🧪 **Testing notification system...**\n\n⏳ Sending test messages...');
    
    try {
        const results = await NotificationService.sendTestNotification(ctx.telegram);
        
        let resultMessage = '🧪 **TEST NOTIFICATION RESULTS**\n\n';
        
        if (results.telegram) {
            resultMessage += '✅ **Telegram Group:** Berhasil terkirim\n';
        } else {
            resultMessage += '❌ **Telegram Group:** Gagal terkirim\n';
        }
        
        if (results.whatsapp) {
            resultMessage += '✅ **WhatsApp:** Berhasil terkirim\n';
        } else {
            resultMessage += '❌ **WhatsApp:** Gagal terkirim\n';
        }
        
        resultMessage += '\n📊 **Status:** ';
        if (results.telegram && results.whatsapp) {
            resultMessage += 'Semua notifikasi berfungsi dengan baik! 🎉';
        } else if (results.telegram || results.whatsapp) {
            resultMessage += 'Sebagian notifikasi berfungsi ⚠️';
        } else {
            resultMessage += 'Semua notifikasi gagal ❌';
        }
        
        resultMessage += '\n\n💡 **Tips:**\n';
        resultMessage += '• Pastikan bot sudah ditambahkan ke grup Telegram\n';
        resultMessage += '• Cek konfigurasi WhatsApp API di config/default.js\n';
        resultMessage += '• Verifikasi TELEGRAM_GROUP_ID di environment variables';
        
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            resultMessage,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error('❌ Test notification error:', error);
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            '❌ **Test notification failed**\n\n' +
            `Error: ${error.message}\n\n` +
            'Periksa konfigurasi notifikasi di config/default.js',
            { parse_mode: 'Markdown' }
        );
    }
}

module.exports = {
    handleUnknownCommand,
    handleBroadcast,
    handleTestNotification
}; 