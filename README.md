# CMU — Complaint Management Unit
**GOS Indoraya | GitHub Pages + Google Apps Script**

Sistem pengaduan dan permintaan karyawan tenaga alih daya GOS Indoraya.  
Frontend di-host di **GitHub Pages**, backend berjalan di **Google Apps Script**, database di **Google Sheets**.

---

## Arsitektur

```
[Karyawan / Admin]
   Browser (GitHub Pages)
         │  fetch() POST — text/plain
         ▼
  Google Apps Script (doPost)
  script.google.com/macros/s/.../exec
         │  Sheets API
         ▼
  Google Sheets
  (Tab: Keluhan, SLA_Report)
```

## Halaman

| URL | Fungsi |
|-----|--------|
| `/` atau `index.html` | Form submit keluhan (default) |
| `cek.html` | Cek status pengajuan by NRK/NIK |
| `admin.html` | Admin panel (password protected) |

## File Utama

| File | Keterangan |
|------|------------|
| `index.html` | Form pengajuan karyawan |
| `cek.html` | Status tracker |
| `admin.html` | Admin dashboard |
| `config.js` | URL GAS Web App (**tidak di-push ke GitHub**) |
| `config.example.js` | Template config — copy & rename ke `config.js` |
| `cmu_api.gs` | Kode GAS yang di-deploy (salin ke Apps Script Editor) |

## Setup Cepat

1. Clone repo ini
2. Copy `config.example.js` → `config.js`
3. Isi `GAS_URL` di `config.js` dengan URL Web App GAS Anda
4. Push ke GitHub → aktifkan GitHub Pages dari branch `main`, folder `/`

Lihat [SETUP.md](SETUP.md) untuk panduan lengkap.

## Lisensi

Internal use — GOS Indoraya.
