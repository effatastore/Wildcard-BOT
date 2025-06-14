const { readConfig } = require('../utils/fileUtils');
const { readCustomSubdomains, writeCustomSubdomains } = require('../utils/fileUtils');
const { isValidSubdomain, getAllSubdomains, isDomainExists } = require('../utils/validation');
const { LIMITS, DEFAULT_SUBDOMAINS } = require('../config/constants');
const { ADMIN_IDS } = require('../config/default');

/**
 * Check if user is admin/owner
 */
function isOwner(userId) {
    return ADMIN_IDS.includes(Number(userId));
}

/**
 * Handler untuk command /new
 * Menambah custom subdomain baru
 */
async function handleNew(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();
    
    if (!configData[userId]) {
        return ctx.reply(
            '⚠️ *Anda belum terdaftar!*\n\n' +
            '📝 Silakan daftar terlebih dahulu dengan:\n' +
            '`/addcf <global_api_key> <email>`\n\n' +
            '💡 Setelah terdaftar, Anda bisa menambahkan custom domain wildcard.',
            { parse_mode: 'Markdown' }
        );
    }
    
    const newDomain = ctx.message.text.replace('/new', '').trim().toLowerCase();
    
    if (!newDomain) {
        return ctx.reply(
            '❌ *Format tidak valid!*\n\n' +
            '📝 Format: `/new <domain>`\n' +
            '📖 Contoh: `/new api.example.com`\n\n' +
            '💡 *Tips:*\n' +
            '• Gunakan domain yang valid\n' +
            '• Hindari kata-kata terlarang\n' +
            '• Maksimal 63 karakter',
            { parse_mode: 'Markdown' }
        );
    }
    
    try {
        // Validasi domain
        const validation = isValidSubdomain(newDomain);
        if (!validation.valid) {
            return ctx.reply(`❌ ${validation.message}`);
        }
        
        // Cek apakah sudah ada
        if (isDomainExists(newDomain, userId)) {
            return ctx.reply(
                `⚠️ *Domain sudah ada!*\n\n` +
                `🌐 Domain \`${newDomain}\` sudah ada dalam daftar Anda.\n` +
                `📋 Gunakan /listdomain untuk melihat semua domain.\n` +
                `🔍 Gunakan /searchdomain untuk mencari domain tertentu.`,
                { parse_mode: 'Markdown' }
            );
        }
        
        // Cek limit
        const customSubdomains = readCustomSubdomains();
        if (!customSubdomains[userId]) {
            customSubdomains[userId] = [];
        }
        
        if (customSubdomains[userId].length >= LIMITS.MAX_CUSTOM_SUBDOMAINS) {
            return ctx.reply(
                `⚠️ *Batas maksimal tercapai!*\n\n` +
                `📊 Anda telah mencapai batas maksimal custom domain (${LIMITS.MAX_CUSTOM_SUBDOMAINS}).\n` +
                `🗑️ Hapus beberapa domain dengan /delsub untuk menambah yang baru.\n` +
                `📋 Lihat domain Anda dengan /mysub`,
                { parse_mode: 'Markdown' }
            );
        }
        
        // Tambahkan domain
        customSubdomains[userId].push(newDomain);
        
        if (!writeCustomSubdomains(customSubdomains)) {
            throw new Error("Gagal menyimpan data domain");
        }
        
        await ctx.reply(
            `✅ *Berhasil menambahkan domain wildcard!*\n\n` +
            `🌐 **Domain:** \`${newDomain}\`\n` +
            `👤 **User:** \`${userId}\`\n` +
            `📊 **Total domain Anda:** ${customSubdomains[userId].length}/${LIMITS.MAX_CUSTOM_SUBDOMAINS}\n\n` +
            `🎉 Domain telah ditambahkan ke daftar custom wildcard.\n` +
            `🚀 Gunakan /setupwildcard untuk mengonfigurasi domain utama.`,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error("❌ Error adding new domain:", error);
        await ctx.reply(
            `❌ *Gagal menambahkan domain*\n\n` +
            `🔍 Error: ${error.message}\n\n` +
            `💡 Silakan coba lagi dalam beberapa menit.`
        );
    }
}

/**
 * Handler untuk command /listdomain
 * Menampilkan semua domain yang tersedia
 */
async function handleListDomain(ctx) {
    const userId = String(ctx.from.id);
    const allSubdomains = getAllSubdomains(userId);
    const customSubdomains = readCustomSubdomains()[userId] || [];
    
    const domainList = `🌐 **DAFTAR DOMAIN TERSEDIA**\n\n` +
        `📊 **Statistik:**\n` +
        `• Total domain: ${allSubdomains.length}\n` +
        `• Default domain: ${DEFAULT_SUBDOMAINS.length}\n` +
        `• Custom domain: ${customSubdomains.length}\n\n` +
        (DEFAULT_SUBDOMAINS.length > 0 ? 
            `🏠 **Default Domain Wildcard:**\n${DEFAULT_SUBDOMAINS.map((domain, index) => 
                `${index + 1}. ${domain}`
            ).join('\n')}\n\n` : '') +
        (customSubdomains.length > 0 ? 
            `🎯 **Custom Domain Wildcard:**\n${customSubdomains.map((domain, index) => 
                `${index + 1}. ${domain} ${userId === ctx.from.id ? '(Milik Anda)' : ''}`
            ).join('\n')}\n\n` : '') +
        `⚡ **Quick Actions:**\n` +
        `• \`/new <subdomain.domain>\` - Tambah custom domain Wildcard\n` +
        `• \`/mysub\` - Lihat subdomain Wildcard Anda\n` +
        `• \`/setupwildcard <domain>\` - Setup wildcard`;

    await ctx.reply(domainList, { parse_mode: 'Markdown' });
}

/**
 * Handler untuk command /searchdomain
 * Mencari domain berdasarkan keyword
 */
async function handleSearchDomain(ctx) {
    const userId = String(ctx.from.id);
    const query = ctx.message.text.replace('/searchdomain', '').trim().toLowerCase();
    
    if (!query) {
        return ctx.reply(
            '❌ *Keyword pencarian tidak boleh kosong!*\n\n' +
            '📝 Format: `/searchdomain <keyword>`\n' +
            '📖 Contoh: `/searchdomain zoom`\n\n' +
            '🔍 Masukkan kata kunci untuk mencari domain Wildcard.',
            { parse_mode: 'Markdown' }
        );
    }
    
    const allSubdomains = getAllSubdomains(userId);
    const results = allSubdomains.filter(domain => 
        domain.toLowerCase().includes(query)
    );
    
    if (results.length === 0) {
        return ctx.reply(
            `❌ *Tidak ditemukan!*\n\n` +
            `🔍 Tidak ada domain Wildcard yang mengandung kata kunci "\`${query}\`".\n\n` +
            `💡 *Tips:*\n` +
            `• Coba kata kunci yang lebih umum\n` +
            `• Periksa ejaan kata kunci\n` +
            `• Gunakan /listdomain untuk melihat semua domain Wildcard`,
            { parse_mode: 'Markdown' }
        );
    }
    
    // Pisahkan hasil berdasarkan default dan custom
    const defaultResults = results.filter(domain => DEFAULT_SUBDOMAINS.includes(domain));
    const customResults = results.filter(domain => !DEFAULT_SUBDOMAINS.includes(domain));
    
    let searchResult = `════❖ *Hasil Pencarian* ❖════\n\n`;
    searchResult += `🔍 **Kata kunci:** "\`${query}\`"\n`;
    searchResult += `📊 **Ditemukan:** ${results.length} domain\n\n`;
    
    if (defaultResults.length > 0) {
        searchResult += `📌 *Default Domain (${defaultResults.length}):*\n`;
        defaultResults.forEach((domain, index) => {
            searchResult += `${index + 1}. \`${domain}\`\n`;
        });
    }
    
    if (customResults.length > 0) {
        searchResult += `\n🔰 *Custom Domain (${customResults.length}):*\n`;
        customResults.forEach((domain, index) => {
            searchResult += `${index + 1}. \`${domain}\`\n`;
        });
    }
    
    searchResult += `\n════════════════════\n\n`;
    searchResult += `💡 Gunakan /setupwildcard <domain_utama> untuk konfigurasi.`;
    
    await ctx.reply(searchResult, { parse_mode: 'Markdown' });
}

/**
 * Handler untuk command /delsub
 * Menghapus custom subdomain milik user sendiri
 */
async function handleDelSub(ctx) {
    const userId = String(ctx.from.id);
    const configData = readConfig();
    
    if (!configData[userId]) {
        return ctx.reply(
            '⚠️ *Anda belum terdaftar!*\n\n' +
            '📝 Silakan daftar terlebih dahulu dengan:\n' +
            '`/addcf <global_api_key> <email>`\n\n' +
            '💡 Setelah terdaftar, Anda bisa mengelola custom domain Wildcard.',
            { parse_mode: 'Markdown' }
        );
    }
    
    const domainToDelete = ctx.message.text.replace('/delsub', '').trim().toLowerCase();
    
    if (!domainToDelete) {
        return ctx.reply(
            '❌ *Format tidak valid!*\n\n' +
            '📝 Format: `/delsub <domain>`\n' +
            '📖 Contoh: `/delsub api.example.com`\n\n' +
            '⚠️ Hanya custom domain Wildcard milik Anda yang bisa dihapus.',
            { parse_mode: 'Markdown' }
        );
    }
    
    try {
        const customSubdomains = readCustomSubdomains();
        const mySubdomains = customSubdomains[userId] || [];
        
        if (!mySubdomains.includes(domainToDelete)) {
            return ctx.reply(
                `❌ *Domain Wildcard tidak ditemukan!*\n\n` +
                `🔍 Domain "\`${domainToDelete}\`" tidak ada dalam daftar custom domain Wildcard Anda.\n\n` +
                `💡 *Tips:*\n` +
                `• Pastikan ejaan domain Wildcard benar\n` +
                `• Hanya domain Wildcard milik Anda yang bisa dihapus\n` +
                `• Gunakan /mysub untuk melihat domain Wildcard Anda`,
                { parse_mode: 'Markdown' }
            );
        }
        
        // Hapus domain dari list user
        customSubdomains[userId] = mySubdomains.filter(d => d !== domainToDelete);
        
        // Jika user tidak punya domain lagi, hapus entrynya
        if (customSubdomains[userId].length === 0) {
            delete customSubdomains[userId];
        }
        
        if (!writeCustomSubdomains(customSubdomains)) {
            throw new Error("Gagal menyimpan perubahan");
        }
        
        const remainingDomains = customSubdomains[userId] ? customSubdomains[userId].length : 0;
        
        await ctx.reply(
            `✅ *Berhasil menghapus domain Wildcard!*\n\n` +
            `🗑️ **Domain Wildcard:** \`${domainToDelete}\`\n` +
            `📊 **Sisa domain Wildcard Anda:** ${remainingDomains}/${LIMITS.MAX_CUSTOM_SUBDOMAINS}\n\n` +
            `💡 *Tips:*\n` +
            `• Gunakan /new untuk menambah domain Wildcard baru\n` +
            `• Gunakan /mysub untuk melihat domain Wildcard Anda\n` +
            `• Domain yang dihapus tidak bisa dikembalikan`,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error("❌ Error deleting domain:", error);
        await ctx.reply(
            `❌ *Gagal menghapus domain*\n\n` +
            `🔍 Error: ${error.message}\n\n` +
            `💡 Silakan coba lagi dalam beberapa menit.`,
            { parse_mode: 'Markdown' }
        );
    }
}

/**
 * Handler untuk command /mysub
 * Menampilkan custom subdomain milik user
 */
async function handleMySub(ctx) {
    const userId = String(ctx.from.id);
    const customSubdomains = readCustomSubdomains();
    const mySubdomains = customSubdomains[userId] || [];
    
    if (mySubdomains.length === 0) {
        return ctx.reply(
            '📝 **SUBDOMAIN ANDA**\n\n' +
            '❌ Anda belum memiliki custom subdomain Wildcard\n\n' +
            '💡 **Cara menambahkan:**\n' +
            '• Gunakan `/new <subdomain.domain>`\n' +
            '• Contoh: `/new app.example.com`\n\n' +
            '🌐 Gunakan `/listdomain` untuk melihat domain Wildcard tersedia',
            { parse_mode: 'Markdown' }
        );
    }

    const subdomainList = `👤 **SUBDOMAIN ANDA**\n\n` +
        `📊 **Total:** ${mySubdomains.length}/${LIMITS.MAX_CUSTOM_SUBDOMAINS}\n\n` +
        `🎯 **Daftar subdomain:**\n` +
        mySubdomains.map((domain, index) => 
            `${index + 1}. ${domain}`
        ).join('\n') + '\n\n' +
        `⚡ **Quick Actions:**\n` +
        `• \`/new <subdomain.domain>\` - Tambah subdomain Wildcard\n` +
        `• \`/delsub <subdomain.domain>\` - Hapus subdomain Wildcard\n` +
        `• \`/searchdomain <keyword>\` - Cari domain Wildcard`;

    await ctx.reply(subdomainList, { parse_mode: 'Markdown' });
}

module.exports = {
    handleNew,
    handleListDomain,
    handleSearchDomain,
    handleDelSub,
    handleMySub
}; 