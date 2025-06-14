const { readConfig } = require('../utils/fileUtils');
const { ADMIN_IDS } = require('../config/default');
const NotificationService = require('../services/NotificationService');

/**
 * Handler untuk command /start
 * Menampilkan welcome message dan panduan penggunaan
 */
async function startCommand(ctx) {
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
}

/**
 * Handler untuk command /help
 * Menampilkan bantuan dan daftar commands
 */
async function helpCommand(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();
    const isRegistered = !!configData[userId];

    let helpMessage = '📚 **BANTUAN & PANDUAN**\n\n';

    if (!isRegistered) {
        helpMessage += '⚠️ **Anda belum terdaftar!**\n\n';
        helpMessage += '🔧 **Setup Awal:**\n';
        helpMessage += '• `/addcf <api_key> <email>` - Daftar dengan Cloudflare\n';
        helpMessage += '• `/cfconfig` - Cek status registrasi\n\n';
        helpMessage += '💡 **Setelah registrasi, semua fitur akan tersedia!**';
    } else {
        helpMessage += '✅ **Anda sudah terdaftar! Fitur lengkap tersedia**\n\n';

        helpMessage += '🔧 **Management Konfigurasi:**\n';
        helpMessage += '• `/cfconfig` - Lihat konfigurasi aktif\n';
        helpMessage += '• `/updatecf <api_key> <email>` - Update konfigurasi\n';
        helpMessage += '• `/deletecf` - Hapus konfigurasi\n\n';

        helpMessage += '🌐 **Management Domain:**\n';
        helpMessage += '• `/listdomain` - Daftar domain tersedia\n';
        helpMessage += '• `/setupwildcard <domain>` - Setup wildcard domain\n';
        helpMessage += '• `/new <subdomain.domain>` - Tambah subdomain\n';
        helpMessage += '• `/mysub` - Lihat subdomain Anda\n';
        helpMessage += '• `/searchdomain <keyword>` - Cari domain\n';
        helpMessage += '• `/delsub <subdomain>` - Hapus subdomain\n\n';

        helpMessage += '🎯 **Tips Penggunaan:**\n';
        helpMessage += '• Gunakan `/listdomain` untuk melihat domain available\n';
        helpMessage += '• Format subdomain: `nama.domain.com`\n';
        helpMessage += '• Setup wildcard dulu sebelum add subdomain\n';
        helpMessage += '• Gunakan `/mysub` untuk monitor subdomain Anda\n\n';
    }

    helpMessage += '📞 **Butuh Bantuan?**\n';
    helpMessage += 'Hubungi admin jika ada kendala teknis.';

    return ctx.reply(helpMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
    });
}

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
            '⚠️ *Tidak ada user terdaftar*\n\n' + '📝 Belum ada user yang terdaftar di sistem.',
            { parse_mode: 'Markdown' }
        );
    }

    const statusMsg = await ctx.reply(
        '⏳ *Mengirim broadcast...*\n\n' +
        `📨 Target: ${userIds.length} user\n` +
        `📝 Pesan: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        { parse_mode: 'Markdown' }
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

    await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        '📢 **BROADCAST BERHASIL DIKIRIM**\n\n' +
        '📊 **Statistik pengiriman:**\n' +
        '• Total pengguna: ' + userIds.length + '\n' +
        '• Berhasil dikirim: ' + sentCount + '\n' +
        '• Gagal: ' + failCount + '\n' +
        '• Waktu kirim: ' + new Date().toLocaleString('id-ID') + '\n\n' +
        '💬 **Pesan yang dikirim:**\n' +
        message,
        { parse_mode: 'Markdown' }
    );
}

/**
 * Test notifikasi ke Telegram grup
 */
async function testNotification(ctx) {
    try {
        console.log('🧪 Testing Telegram notification...');
        await ctx.reply(
            '🧪 **Menguji notifikasi...**\n\n⏳ Mengirim pesan test ke Telegram grup...',
            { parse_mode: 'Markdown' }
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
            'Silakan periksa log server untuk detail error.',
            { parse_mode: 'Markdown' }
        );
    }
}

module.exports = {
    startCommand,
    helpCommand,
    handleUnknownCommand,
    handleBroadcast,
    testNotification,
};