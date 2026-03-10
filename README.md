# CMU — Complaint Management Unit
**GOS Indoraya | GitHub Pages + Google Apps Script**

Webapp untuk mengelola keluhan, pertanyaan, dan permintaan karyawan tenaga alih daya GOS Indoraya.

---

## Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML + CSS + JS → **GitHub Pages** |
| Backend / API | **Google Apps Script** (Web App) |
| Database | **Google Sheets** |
| File Storage | **Google Drive** |

---

## Halaman

| URL | Fungsi |
|-----|--------|
| `/` atau `/index.html` | Form submit keluhan/permintaan (karyawan) |
| `/cek.html` | Cek status pengajuan by NRK/NIK (karyawan) |
| `/admin.html` | Panel admin — kelola & tindak lanjuti tiket |

---

## Struktur File

```
cmu/
├── index.html       # Employee: form submit
├── cek.html         # Employee: cek status
├── admin.html       # Admin: kelola tiket
├── config.js        # ⚙️ KONFIGURASI — isi API URL di sini
├── api.js           # Fetch-based API client
├── cmu.gs           # GAS: logic & database functions
├── cmu_api.gs       # GAS: HTTP endpoint layer (doGet/doPost)
├── appsscript.json  # GAS: manifest
├── README.md
└── SETUP.md
```

---

## Quick Start

1. **Siapkan Google Sheet** sesuai schema di `SETUP.md`
2. **Deploy GAS** (`cmu.gs` + `cmu_api.gs`) sebagai Web App
3. **Isi `config.js`** dengan URL deployment GAS
4. **Push ke GitHub**, aktifkan GitHub Pages
5. Bagikan URL GitHub Pages ke karyawan

Lihat `SETUP.md` untuk panduan lengkap.

---

## Alur Sistem

```
Karyawan               Admin
   │                     │
   ├─ index.html         │
   │  Submit keluhan     │
   │  ↓ ID tiket         │
   │                     │
   ├─ cek.html     admin.html
   │  Input NRK/NIK  Login (password)
   │  Lihat status   Lihat semua tiket
   │                 ↓ Proses (assign PIC, prioritas)
   │                 ↓ Selesai (catat resolusi)
   │                     │
   └─────────────────────┘
          Google Sheets (database)
          Kolom SLA otomatis terhitung
```

---

## Keamanan

- Halaman admin di-protect dengan **password** (disimpan di Script Properties GAS)
- Tidak ada Google login — dirancang untuk karyawan tanpa email perusahaan
- Script Properties tidak terlihat di source code
