# 🚀 TestFlight Slot Checker  
Memantau ketersediaan slot TestFlight secara otomatis dan mengirim notifikasi ke **Telegram** ketika slot terbuka.

Script ini berjalan terus (loop interval), memeriksa halaman TestFlight untuk setiap aplikasi yang ada di `apps_config.json`, lalu mengirimkan pesan ke Telegram jika ada perubahan status.

---

## ✨ Fitur Utama

- 🔄 Memantau TestFlight secara otomatis setiap 60 detik  
- 📩 Notifikasi Telegram (Markdown support)  
- 🔁 Auto-retry hingga 3 kali jika pengiriman Telegram gagal  
- 📝 Logging dengan **winston** + **rotating logs**  
- 💾 Config aplikasi menggunakan JSON  
- 🛡 Menggunakan `.env` untuk keamanan token  
- ⚙ Menggunakan CommonJS (require), bukan ESM  
- 📂 `.gitignore` lengkap (tidak commit file sensitif)  

---

## 📦 Instalasi

Pastikan Node.js sudah terinstal:

```bash
node -v
npm -v
```

Clone repository:

```bash
git clone https://github.com/<username>/<repo>.git
cd testflight
```

Install dependencies:

```bash
npm install
```

---

## 🔧 Konfigurasi `.env`

Buat file `.env` berdasarkan `.env.example`:

```
TELEGRAM_BOT_TOKEN=1234567890:ABCDEabcdef123456789
TELEGRAM_CHAT_ID=123456789
```

**Cara mendapatkan TELEGRAM_CHAT_ID:**

1. Buka Telegram  
2. Chat bot kamu → kirim pesan "Hi"  
3. Buka di browser:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates
```

Chat ID akan muncul di bagian:

```json
"chat": { "id": 123456789 }
```

---

## 📁 Konfigurasi Aplikasi (`apps_config.json`)

Contoh:

```json
{
    "Facebook": {
        "url": "https://testflight.apple.com/join/C1a3MRG4",
        "last_state": "full"
    }
}
```

Format simple:

```json
{
    "Facebook": "https://testflight.apple.com/join/C1a3MRG4"
}
```

---

## ▶ Cara Menjalankan

Jalankan:

```bash
node index.js
```

Script akan:

- Membaca list aplikasi  
- Mengecek status TestFlight secara berkala  
- Mengirim notif ke Telegram jika slot **AVAILABLE**  

---

## 🧪 Contoh Notifikasi Telegram

Jika slot terbuka:

```
🚀 TestFlight for *Facebook* AVAILABLE!
https://testflight.apple.com/join/C1a3MRG4
```

---

## 📝 Logging

Log disimpan:

```
testflight_checker-YYYY-MM-DD.log
```

Rotating log:

- Maks per file: **1MB**
- Maks file: **5**

---

## 📂 Struktur Project

```
testflight/
│── index.js
│── apps_config.json
│── .env
│── .env.example
│── .gitignore
│── package.json
│── testflight_checker-2025-12-02.log
└── node_modules/
```

---

## 🔒 .gitignore

```
node_modules/
.env
*.log
testflight_checker-*.log
*.audit.json
.DS_Store
Thumbs.db
*.tmp
*.temp
.vscode/
*.map
```

---

## 🛠 Troubleshooting

### Notifikasi tidak terkirim?
- Token salah  
- Chat ID salah  
- Internet error  
- Format request salah  

### Status salah?
Sudah digunakan deteksi akurat:  
FULL → AVAILABLE → UNKNOWN

---

## 📄 Lisensi

MIT License — Bebas digunakan & dimodifikasi.

---

## ⭐ Jika script ini membantu, jangan lupa kasih Star di GitHub!
