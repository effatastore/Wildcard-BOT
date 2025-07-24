// === KONFIGURASI DAN KONSTANTA ===

// Bot Configuration
const BOT_TOKEN = 'TOKEN_BOT_TELEGRAM_ANDA'; // Ganti dengan token bot Telegram Anda
const OWNER_IDS = ["123456789"]; // Ganti dengan user id Telegram Anda (string)

// File Paths
const PATHS = {
    USER_CONFIG: './data/user_config.json',
    SESSION_DATA: './data/session_data.json',
    ADMIN_USAGE: './data/admin_usage.json',
    CUSTOM_SUBDOMAINS: './data/custom_subdomains.json',
    BACKUP_DIR: './backups'
};

// Limits and Constraints
const LIMITS = {
    MAX_CUSTOM_SUBDOMAINS: 50,
    MAX_BACKUP_FILES: 7
};

// Security
const FORBIDDEN_KEYWORDS = [
    'porn', 'judi', 'xxx', 'betting', 
    'togel', 'bokep', 'adult', 'sex'
];

// Default Subdomains
const DEFAULT_SUBDOMAINS = [
    'support.zoom.us',
    'ava.game.naver.com',
    'quiz.int.vidio.com',
    'io.ruangguru.com',
    'belajar.ruangguru.com',
    'zaintest.vuclip.com',
    'edu.ruangguru.com',
    'unnes.ac.id',
    'bakrie.ac.id',
    'stripchat.page',
    'cache.netflix.com',
    'investors.spotify.com',
    'blog.webex.com',
    'chat.sociomile.com',
    'investor.fb.com',
    'app.gopay.co.id',
    'fikom.esaunggul.ac.id',
    'ganecadigital.com',
    'graph.instagram.com',
    'elearning.telkomuniversity.ac.id',
    'quiz.staging.vidio.com',
    'ive-upload.instagram.com',
    'app.midtrans.com',
    'web.poe.garena.com',
    'udemy.com',
    'skillacademy.com',
    'live.iflix.com',
    'cb.ovo.id',
    'space.byu.id',
    'app-stg.gopay.co.id',
    'pages.coursera.org',
    'cdn-cf.zoom.us',
    'www.genflix.co.id',
    'kuota.axis.co.id',
    'invite.tinder.com',
    'blog.sushiroll.co.id',
    'df.game.naver.com',
    'z-p15.www.isntagram.com',
    'graph.facebook.com',
    'blog.ruangkerja.id'
];

// QRIS Configuration
const QRIS_CONFIG = {
    merchantId: "OK2169948",
    apiKey: "506151017388449542169948OKCTB751A34A2F8624E6A7B924038D5FE42A",
    baseQrString: "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214158455875489000303UMI51440014ID.CO.QRIS.WWW0215ID20253762751400303UMI5204541553033605802ID5920AGIN STORE OK21699486006CIAMIS61054621162070703A0163049492",
    basePrice: 3500
};

// Cloudflare Configuration
const CLOUDFLARE = {
    BASE_URL: "https://api.cloudflare.com/client/v4",
    SLD_EXCEPTIONS: ["co.id", "ac.id", "sch.id", "my.id", "web.id", "biz.id", "eu.org"]
};

// Cache Configuration
const CACHE_CONFIG = {
    BROWSER_CACHE: 3600,
    EDGE_CACHE: 3600
};

module.exports = {
    BOT_TOKEN,
    OWNER_IDS,
    PATHS,
    LIMITS,
    FORBIDDEN_KEYWORDS,
    DEFAULT_SUBDOMAINS,
    QRIS_CONFIG,
    CLOUDFLARE,
    CACHE_CONFIG
}; 
