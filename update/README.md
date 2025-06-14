# 🌐 WildCard Telegram Bot

Bot Telegram untuk mengelola wildcard domain di Cloudflare dengan mudah dan efisien. Bot ini memungkinkan user untuk setup wildcard domain, mengelola subdomain custom, dan monitoring analytics dengan interface yang user-friendly.

## ✨ Fitur Utama

### 🔧 Manajemen Konfigurasi
- **Setup Cloudflare**: Registrasi dengan Global API Key dan email
- **Lihat Konfigurasi**: Cek status dan detail konfigurasi
- **Update Kredensial**: Perbarui API key dan email
- **Hapus Konfigurasi**: Hapus semua data dengan konfirmasi

### 🌐 Manajemen Domain
- **Setup Wildcard**: Konfigurasi wildcard domain otomatis dengan Cloudflare Worker
- **Analytics Domain**: Statistik traffic, bandwidth, dan performance
- **Clear Cache**: Bersihkan cache domain di Cloudflare
- **Subdomain Custom**: Tambah dan kelola subdomain khusus

### 📲 Sistem Notifikasi
- **Telegram Group**: Notifikasi otomatis ke grup admin
- **WhatsApp Integration**: Notifikasi via WAPanels API
- **Real-time Alerts**: Update status setup wildcard

### 👑 Admin Features
- **Dashboard Statistik**: Monitor penggunaan bot dan user
- **User Management**: Kelola user dan data mereka
- **Broadcast System**: Kirim pesan ke semua user
- **System Monitoring**: Health check dan performance metrics

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 atau lebih baru)
- NPM atau Yarn
- Bot Token dari [@BotFather](https://t.me/BotFather)
- Cloudflare Global API Key
- (Opsional) WAPanels account untuk WhatsApp notifications

### Installation

1. **Clone repository**
```bash
git clone https://github.com/yourusername/wildcardtele.git
cd wildcardtele
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
```

4. **Konfigurasi `.env`**
```env
BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_GROUP_ID=-1001234567890
```

5. **Update konfigurasi admin**
Edit `config/default.js`:
```javascript
ADMIN_IDS: [123456789, 987654321], // Ganti dengan Telegram ID Anda
```

6. **Jalankan bot**
```bash
npm start
```

## 📋 Command Reference

### 🔰 Command Dasar
| Command | Deskripsi | Usage |
|---------|-----------|-------|
| `/start` | Pesan selamat datang | `/start` |
| `/help` | Panduan lengkap | `/help` |

### 🔧 Konfigurasi Cloudflare
| Command | Deskripsi | Usage |
|---------|-----------|-------|
| `/addcf` | Daftar Cloudflare | `/addcf <api_key> <email>` |
| `/cfconfig` | Lihat konfigurasi | `/cfconfig` |
| `/updatecf` | Update kredensial | `/updatecf <api_key> <email>` |
| `/deletecf` | Hapus konfigurasi | `/deletecf` |

### 🌐 Domain Management
| Command | Deskripsi | Usage |
|---------|-----------|-------|
| `/setupwildcard` | Setup wildcard domain | `/setupwildcard <domain>` |
| `/listdomain` | Lihat semua domain | `/listdomain` |
| `/new` | Tambah subdomain custom | `/new <subdomain>` |
| `/mysub` | Subdomain milik Anda | `/mysub` |

### 📊 Analytics & Tools
| Command | Deskripsi | Usage |
|---------|-----------|-------|
| `/analytics` | Statistik domain | `/analytics <domain>` |
| `/clearcache` | Bersihkan cache | `/clearcache <domain>` |

### 👑 Admin Commands
| Command | Deskripsi | Usage |
|---------|-----------|-------|
| `/stats` | Statistik bot | `/stats` |
| `/broadcast` | Kirim pesan ke semua user | `/broadcast <pesan>` |
| `/testnotif` | Test sistem notifikasi | `/testnotif` |
| `/userinfo` | Info detail user | `/userinfo <user_id>` |

> 📖 **Dokumentasi Lengkap**: Lihat [ADMIN_COMMANDS.md](ADMIN_COMMANDS.md) untuk semua admin commands

## 🏗️ Struktur Project

```
wildcardtele/
├── 📁 config/
│   └── default.js              # Konfigurasi utama bot
├── 📁 data/
│   ├── config.json             # Data konfigurasi user
│   ├── domains.json            # Data domain default
│   ├── customDomains.json      # Data subdomain custom
│   └── adminUsage.json         # Log penggunaan admin
├── 📁 handlers/
│   ├── configHandlers.js       # Handler konfigurasi Cloudflare
│   ├── domainHandlers.js       # Handler manajemen domain
│   ├── cloudflareHandlers.js   # Handler API Cloudflare
│   ├── generalHandlers.js      # Handler command umum
│   └── adminHandlers.js        # Handler command admin
├── 📁 services/
│   ├── CloudflareManager.js    # Service API Cloudflare
│   └── NotificationService.js  # Service notifikasi
├── 📁 utils/
│   ├── fileUtils.js            # Utility file operations
│   ├── validation.js           # Utility validasi input
│   └── systemUtils.js          # Utility sistem
├── 📁 workers/
│   └── wildcardWorker.js       # Template Cloudflare Worker
├── 📁 docs/
│   ├── ADMIN_COMMANDS.md       # Dokumentasi admin commands
│   └── NOTIFICATION_SETUP.md   # Setup notifikasi
├── .env.example                # Template environment variables
├── package.json                # Dependencies dan scripts
├── index.js                   # Entry point bot
└── README.md                  # Dokumentasi utama
```

## ⚙️ Konfigurasi

### Environment Variables

| Variable | Deskripsi | Default | Required |
|----------|-----------|---------|----------|
| `BOT_TOKEN` | Token bot Telegram dari BotFather | - | ✅ |
| `TELEGRAM_GROUP_ID` | ID grup Telegram untuk notifikasi | - | ❌ |

### Config File (`config/default.js`)

```javascript
module.exports = {
    // Admin Configuration
    ADMIN_IDS: [123456789, 987654321],
    
    // Bot Limits
    MAX_CUSTOM_DOMAINS: 5,
    MAX_DOMAINS_PER_USER: 10,
    
    // Notification Settings
    TELEGRAM: {
        enabled: true,
        groupId: process.env.TELEGRAM_GROUP_ID
    },
    
    WHATSAPP: {
        enabled: false, // Set true untuk aktifkan
        apiUrl: 'https://app.wapanels.com/api/create-message',
        appkey: 'your_app_key',
        authkey: 'your_auth_key',
        to: '6281234567890'
    },
    
    // Default Domains
    DEFAULT_DOMAINS: [
        'example.com',
        'test.com',
        'demo.com'
    ]
};
```

## 📲 Setup Notifikasi

### Telegram Group Notification

1. **Buat grup Telegram baru**
2. **Tambahkan bot ke grup**
3. **Dapatkan Group ID**:
   - Tambahkan @userinfobot ke grup
   - Copy Group ID yang diberikan
   - Hapus @userinfobot dari grup
4. **Set environment variable**:
   ```bash
   TELEGRAM_GROUP_ID=-1001234567890
   ```

### WhatsApp Notification (WAPanels)

1. **Daftar di [WAPanels](https://app.wapanels.com)**
2. **Dapatkan API credentials**
3. **Update konfigurasi** di `config/default.js`

> 📖 **Setup Lengkap**: Lihat [NOTIFICATION_SETUP.md](NOTIFICATION_SETUP.md) untuk panduan detail

## 🔧 Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Jalankan dalam mode development
npm run dev

# Linting
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run tests
npm test

# Test coverage
npm run test:coverage

# Test admin commands
npm run test:admin
```

### Code Style

Project menggunakan:
- **ESLint** untuk code linting
- **Prettier** untuk code formatting
- **JSDoc** untuk dokumentasi code

## 📊 Monitoring & Analytics

### Bot Statistics

Bot menyediakan statistik real-time:
- 👥 Total users terdaftar
- 🌐 Total domains yang dikelola
- ⚙️ Total Cloudflare Workers
- 📈 Success rate setup wildcard
- 📊 Usage analytics per hari/minggu/bulan

### Health Monitoring

- 🟢 Bot status dan uptime
- 🟢 Database connectivity
- 🟢 Cloudflare API status
- 🟡 Memory dan CPU usage
- 🟢 Disk space availability

### Error Tracking

- 📋 Comprehensive error logging
- 🚨 Auto alerts untuk admin
- 📊 Error rate monitoring
- 🔍 Debug information

## 🛡️ Security Features

### Access Control
- **Admin-only commands** dengan ID verification
- **Rate limiting** untuk prevent spam
- **Input validation** untuk semua user input
- **API key encryption** dalam database

### Data Protection
- **GDPR compliance** dengan user data deletion
- **Secure credential storage**
- **Audit logging** untuk admin actions
- **Backup & restore** functionality

### Error Handling
- **Graceful error recovery**
- **User-friendly error messages**
- **Detailed logging** untuk debugging
- **Fallback mechanisms**

## 🚀 Deployment

### Production Setup

1. **Server Requirements**:
   - Ubuntu 20.04+ atau CentOS 8+
   - Node.js 16+
   - 2GB RAM minimum
   - 10GB disk space

2. **Process Manager**:
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start bot
   pm2 start index.js --name "wildcard-bot"
   
   # Auto restart on reboot
   pm2 startup
   pm2 save
   ```

3. **Reverse Proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build dan run
docker build -t wildcard-bot .
docker run -d --name wildcard-bot -p 3000:3000 wildcard-bot
```

## 🤝 Contributing

Kami welcome kontribusi dari community! 

### How to Contribute

1. **Fork repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Create Pull Request**

### Development Guidelines

- Follow existing code style
- Add tests untuk new features
- Update documentation
- Ensure backward compatibility

### Bug Reports

Gunakan [GitHub Issues](https://github.com/yourusername/wildcardtele/issues) untuk:
- 🐛 Bug reports
- 💡 Feature requests
- 📖 Documentation improvements
- ❓ Questions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Telegram Bot API](https://core.telegram.org/bots/api) untuk bot framework
- [Cloudflare API](https://api.cloudflare.com/) untuk domain management
- [WAPanels](https://wapanels.com/) untuk WhatsApp integration
- Community contributors dan testers

## 📞 Support

- 📧 Email: support@yourproject.com
- 💬 Telegram: [@yourusername](https://t.me/yourusername)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/wildcardtele/issues)
- 📖 Docs: [Project Wiki](https://github.com/yourusername/wildcardtele/wiki)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div> 