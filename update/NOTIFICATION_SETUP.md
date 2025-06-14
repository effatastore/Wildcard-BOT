# 📲 Setup Notifikasi Wildcard Bot

Bot ini akan mengirim notifikasi otomatis ke Telegram grup dan WhatsApp ketika ada user yang berhasil setup wildcard domain.

## 🔧 Konfigurasi Telegram Group

### 1. Buat Grup Telegram
1. Buat grup baru di Telegram
2. Tambahkan bot ke grup tersebut
3. Berikan bot permission untuk mengirim pesan

### 2. Dapatkan Group ID
1. Tambahkan bot @userinfobot ke grup
2. Bot akan mengirim informasi grup termasuk Group ID
3. Copy Group ID (format: -1001234567890)
4. Hapus @userinfobot dari grup

### 3. Set Environment Variable
```bash
# Di file .env
TELEGRAM_GROUP_ID=-1001234567890
```

## 📱 Konfigurasi WhatsApp (WAPanels)

### 1. Daftar di WAPanels
1. Kunjungi https://app.wapanels.com
2. Daftar akun baru
3. Verifikasi nomor WhatsApp Anda

### 2. Dapatkan API Credentials
1. Login ke dashboard WAPanels
2. Buka menu API Settings
3. Copy App Key dan Auth Key

### 3. Update Konfigurasi
Edit file `config/default.js`:
```javascript
WHATSAPP: {
    enabled: true,
    apiUrl: 'https://app.wapanels.com/api/create-message',
    appkey: 'your_app_key_here',
    authkey: 'your_auth_key_here',
    to: '6281234567890' // Nomor WhatsApp dengan kode negara
}
```

## 🧪 Test Notifikasi

Gunakan command `/testnotif` (admin only) untuk test sistem notifikasi:

```
/testnotif
```

Bot akan mengirim pesan test ke:
- ✅ Telegram Group
- ✅ WhatsApp

## 📋 Format Notifikasi

### Telegram Group
```
🎉 **WILDCARD SETUP BERHASIL!**

👤 **User:** John Doe
📧 **Email:** john@example.com
🆔 **User ID:** `123456789`
🌐 **Domain:** `example.com`
⚙️ **Worker:** `wildcard-abc123`
📅 **Waktu:** 25/12/2023 14:30:15

✨ *Wildcard domain telah aktif dan siap digunakan!*
```

### WhatsApp
```
🎉 WILDCARD SETUP BERHASIL!

👤 User: John Doe
📧 Email: john@example.com
🆔 User ID: 123456789
🌐 Domain: example.com
⚙️ Worker: wildcard-abc123
📅 Waktu: 25/12/2023 14:30:15

✨ Wildcard domain telah aktif dan siap digunakan!
```

## 🔧 Troubleshooting

### Telegram Notifikasi Gagal
- ✅ Pastikan bot sudah ditambahkan ke grup
- ✅ Bot memiliki permission untuk mengirim pesan
- ✅ Group ID benar (format: -1001234567890)
- ✅ Bot token valid

### WhatsApp Notifikasi Gagal
- ✅ App Key dan Auth Key benar
- ✅ Nomor WhatsApp format benar (dengan kode negara)
- ✅ Akun WAPanels aktif dan terverifikasi
- ✅ Saldo WAPanels mencukupi

## 📊 Monitoring

Bot akan log hasil notifikasi di console:
```
✅ Telegram notification sent
✅ WhatsApp notification sent
📲 Notification results: { telegram: true, whatsapp: true }
```

## 🛡️ Keamanan

- Notifikasi dikirim secara asynchronous (tidak memblokir user)
- Error notifikasi tidak mempengaruhi proses setup wildcard
- Credentials disimpan aman di konfigurasi
- Logging minimal untuk privacy

## 🚀 Performance

- Notifikasi dikirim parallel (Telegram + WhatsApp bersamaan)
- Timeout protection untuk API calls
- Fallback mechanism jika salah satu gagal
- No impact pada response time user 