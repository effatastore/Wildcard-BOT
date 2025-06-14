const fetch = require('node-fetch');
const { readConfig, writeConfig } = require('../utils/fileUtils');
const { isValidEmail, isValidApiToken, sanitizeInput } = require('../utils/validation');

/**
 * Handler untuk command /addcf
 * Menambahkan konfigurasi Cloudflare API
 */
async function handleAddCf(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();

    // Cek apakah user sudah terdaftar
    if (configData[userId]) {
        return ctx.reply(
            '⚠️ Anda sudah terdaftar! Gunakan `/updatecf` untuk update atau `/cfconfig` untuk melihat konfigurasi.',
            { parse_mode: 'Markdown' }
        );
    }

    const messageContent = ctx.message.text;
    const parts = messageContent.split(' ');

    if (parts.length < 3) {
        return ctx.reply(
            '❌ **FORMAT TIDAK VALID**\n\n' +
                '📋 **Format:** `/addcf <global_api_key> <email>`\n' +
                '📖 **Contoh:** `/addcf c2bd7d84c...77f5a8 user@gmail.com`\n\n' +
                '🔑 **Cara mendapat key:** [Cloudflare Dashboard](https://dash.cloudflare.com) → My Profile → API Tokens → Global API Key',
            { parse_mode: 'Markdown', disable_web_page_preview: true }
        );
    }

    const globalApiKey = sanitizeInput(parts[1]);
    const email = sanitizeInput(parts[2]);

    // Validasi input
    if (!isValidApiToken(globalApiKey)) {
        return ctx.reply(
            '❌ **Global API Key tidak valid**\n' +
                'Pastikan format key benar (minimal 32 karakter)',
            { parse_mode: 'Markdown' }
        );
    }

    if (!isValidEmail(email)) {
        return ctx.reply(
            '❌ **Format email tidak valid**\n' + 'Gunakan email yang sama dengan akun Cloudflare',
            { parse_mode: 'Markdown' }
        );
    }

    const statusMsg = await ctx.reply('⏳ Memverifikasi...');

    try {
        // Verifikasi kredensial dengan Cloudflare API
        const response = await fetch('https://api.cloudflare.com/client/v4/accounts', {
            headers: {
                'X-Auth-Email': email,
                'X-Auth-Key': globalApiKey,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!data.success || !data.result || data.result.length === 0) {
            return ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                '❌ **Kredensial tidak valid**\nPastikan Global API Key dan Email benar',
                { parse_mode: 'Markdown' }
            );
        }

        const accountId = data.result[0].id;
        const accountName = data.result[0].name;

        // Simpan konfigurasi
        const updatedConfigData = readConfig();
        updatedConfigData[userId] = {
            global_api_key: globalApiKey,
            email: email,
            accountId: accountId,
            accountName: accountName,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
        };

        writeConfig(updatedConfigData);

        // Update message tanpa delay tambahan
        return ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            '✅ **REGISTRASI BERHASIL!**\n\n' +
                '👤 **Email:** `' +
                email +
                '`\n' +
                '🔑 **API Key:** `' +
                globalApiKey.substring(0, 8) +
                '...`\n' +
                '📅 **Terdaftar:** ' +
                new Date().toLocaleString('id-ID') +
                '\n\n' +
                '🚀 **Siap digunakan!** Gunakan `/listdomain` untuk mulai',
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('❌ Config error:', error.message);

        // Handle specific error types without spam
        const errorMessage = error.message.includes('fetch')
            ? '❌ Gagal koneksi ke Cloudflare. Coba lagi.'
            : '❌ Gagal menyimpan konfigurasi. Coba lagi.';

        // Try to edit, fallback to new message
        try {
            return ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                errorMessage,
                { parse_mode: 'Markdown' }
            );
        } catch (editError) {
            return ctx.reply(errorMessage, { parse_mode: 'Markdown' });
        }
    }
}

/**
 * Handler untuk command /cfconfig
 * Menampilkan konfigurasi Cloudflare user
 */
async function handleCfConfig(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();

    if (!configData[userId]) {
        return ctx.reply(
            '⚠️ **Belum terdaftar**\n\n' +
                'Format: `/addcf <global_api_key> <email>`\n' +
                'Cara mendapat key: [Cloudflare Dashboard](https://dash.cloudflare.com) → My Profile → API Tokens',
            { parse_mode: 'Markdown', disable_web_page_preview: true }
        );
    }

    const userConfig = configData[userId];
    const maskedToken =
        userConfig.global_api_key.substring(0, 8) + '***' + userConfig.global_api_key.slice(-4);

    return ctx.reply(
        '👤 **KONFIGURASI AKTIF**\n\n' +
            '📧 **Email:** `' +
            userConfig.email +
            '`\n' +
            '🔑 **API Key:** `' +
            maskedToken +
            '`\n' +
            '📅 **Terdaftar:** ' +
            new Date(userConfig.createdAt).toLocaleString('id-ID') +
            '\n\n' +
            '⚡ **Commands:** `/updatecf` | `/setupwildcard` | `/listdomain` | `/new` | `/mysub`',
        { parse_mode: 'Markdown' }
    );
}

/**
 * Handler untuk command /updatecf
 * Update konfigurasi Cloudflare
 */
async function handleUpdateCf(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();

    if (!configData[userId]) {
        return ctx.reply(
            '⚠️ Belum terdaftar. Gunakan `/addcf <global_api_key> <email>` untuk mendaftar.',
            { parse_mode: 'Markdown' }
        );
    }

    const messageContent = ctx.message.text;
    const parts = messageContent.split(' ');

    if (parts.length < 3) {
        return ctx.reply(
            '❌ **Format:** `/updatecf <global_api_key> <email>`\n' +
                'Contoh: `/updatecf newkey123 newemail@example.com`',
            { parse_mode: 'Markdown' }
        );
    }

    const newGlobalApiKey = sanitizeInput(parts[1]);
    const newEmail = sanitizeInput(parts[2]);

    // Validasi input
    if (!isValidApiToken(newGlobalApiKey)) {
        return ctx.reply('❌ Global API Key tidak valid!');
    }

    if (!isValidEmail(newEmail)) {
        return ctx.reply('❌ Format email tidak valid!');
    }

    const statusMsg = await ctx.reply('⏳ Memverifikasi...');

    try {
        // Verify new credentials
        const response = await fetch('https://api.cloudflare.com/client/v4/accounts', {
            headers: {
                'X-Auth-Email': newEmail,
                'X-Auth-Key': newGlobalApiKey,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!data.success || !data.result || data.result.length === 0) {
            return ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                '❌ Kredensial baru tidak valid. Pastikan Global API Key dan Email benar.',
                { parse_mode: 'Markdown' }
            );
        }

        const newAccountId = data.result[0].id;
        const newAccountName = data.result[0].name;

        // Update configuration
        const updatedConfigData = readConfig();
        const oldConfig = updatedConfigData[userId];
        updatedConfigData[userId] = {
            ...oldConfig,
            global_api_key: newGlobalApiKey,
            email: newEmail,
            accountId: newAccountId,
            accountName: newAccountName,
            lastUpdated: new Date().toISOString(),
        };

        writeConfig(updatedConfigData);

        return ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            '✅ **Konfigurasi berhasil diperbarui!**\n\n' +
                `📧 **Email:** \`${newEmail}\`\n` +
                `🏢 **Account:** \`${newAccountName}\`\n` +
                `🔄 **Diperbarui:** ${new Date().toLocaleString('id-ID')}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('❌ Update config error:', error.message);

        const errorMessage = '❌ Gagal memperbarui konfigurasi. Coba lagi.';

        try {
            return ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                errorMessage,
                { parse_mode: 'Markdown' }
            );
        } catch (editError) {
            return ctx.reply(errorMessage);
        }
    }
}

/**
 * Handler untuk command /deletecf
 * Menghapus konfigurasi Cloudflare user
 */
async function handleDeleteCf(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();

    if (!configData[userId]) {
        return ctx.reply('⚠️ Tidak ada konfigurasi untuk dihapus.', { parse_mode: 'Markdown' });
    }

    const messageContent = ctx.message.text;
    const parts = messageContent.split(' ');

    if (
        parts.length > 1 &&
        parts[1].toUpperCase() === 'CONFIRM' &&
        parts[2]?.toUpperCase() === 'DELETE'
    ) {
        // Direct deletion with CONFIRM DELETE
        try {
            const updatedConfigData = readConfig();
            delete updatedConfigData[userId];
            writeConfig(updatedConfigData);

            return ctx.reply(
                '✅ **Konfigurasi berhasil dihapus!**\n' +
                    'Gunakan `/addcf` untuk mendaftar kembali.',
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('❌ Delete config error:', error.message);
            return ctx.reply('❌ Gagal menghapus konfigurasi. Coba lagi.');
        }
    }

    // Show confirmation instructions
    return ctx.reply(
        '⚠️ **Konfirmasi Penghapusan**\n\n' +
            '🗑️ Ketik `CONFIRM DELETE` atau `/deletecf CONFIRM DELETE` untuk menghapus konfigurasi.\n' +
            '⚠️ Penghapusan tidak dapat dibatalkan!',
        { parse_mode: 'Markdown' }
    );
}

module.exports = {
    handleAddCf,
    handleCfConfig,
    handleUpdateCf,
    handleDeleteCf,

    // Aliases for WildcardBot.js compatibility
    addCloudflareConfig: handleAddCf,
    viewCloudflareConfig: handleCfConfig,
    updateCloudflareConfig: handleUpdateCf,
    deleteCloudflareConfig: handleDeleteCf,
};