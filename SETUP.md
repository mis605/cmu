# SETUP — CMU GitHub Pages + GAS
**GOS Indoraya | Google Apps Script + Google Sheets + GitHub Pages**

---

## Gambaran Arsitektur

```
GitHub Pages                 Google Apps Script
(index/cek/admin.html)  →  doGet / doPost (cmu_api.gs)
(config.js + api.js)    ←  JSON response
                              ↕
                         Google Sheets (database)
                         Google Drive (lampiran)
```

---

## Bagian 1 — Persiapkan Google Sheet

Buat Google Sheet baru dengan **1 tab** bernama `Keluhan` (A–S):

| Kol | Header | Kol | Header |
|-----|--------|-----|--------|
| A | ID Tiket | K | Deskripsi |
| B | Tanggal Submit | L | Prioritas |
| C | NRK / NIK | M | Status |
| D | Nama Pelapor | N | PIC Nama |
| E | Nama Klien / Penempatan | O | Tanggal Proses |
| F | Jabatan | P | Tanggal Selesai |
| G | No HP / WhatsApp | Q | SLA (Hari) |
| H | Email Aktif | R | Catatan Admin |
| I | Kategori | S | File GDrive URL |
| J | Sub Kategori | | |

**Formula SLA di kolom Q2** (drag ke bawah):
```
=IFERROR(IF(P2<>"",INT(P2-O2),IF(O2<>"",INT(TODAY()-O2),"")),"")
```

**Format kolom B, O, P** → Date time

---

## Bagian 2 — Setup Google Apps Script

### 2.1 Buat Project GAS Baru
1. Buka [script.google.com](https://script.google.com) → **New Project**
2. Rename project: `CMU GOS Indoraya`

### 2.2 Upload File GAS
Copy-paste file berikut ke editor GAS:

| File | Nama di Editor GAS |
|------|--------------------|
| `cmu.gs` | `Code` (ganti isi default) |
| `cmu_api.gs` | Klik `+` → Script → nama: `cmu_api` |
| `appsscript.json` | Project Settings → centang "Show appsscript.json" → paste isi file |

### 2.3 Konfigurasi cmu.gs
Buka `Code.gs`, ganti:
```javascript
const SHEET_ID = 'GANTI_DENGAN_ID_GSHEET';
```
**Cara cari ID GSheet**: dari URL → `docs.google.com/spreadsheets/d/**[ID INI]**/edit`

### 2.4 Set Script Properties
**Extensions → Apps Script → Project Settings → Script Properties → Add property:**

| Property | Value |
|----------|-------|
| `ADMIN_PASSWORD` | Password pilihan Anda (default: `admin123`) |
| `GDRIVE_FOLDER_ID` | ID folder GDrive untuk lampiran *(opsional)* |

### 2.5 Deploy sebagai Web App
1. **Deploy → New deployment → Web App**
2. Konfigurasi:
   - Execute as: **Me**
   - Who has access: **Anyone**
3. Klik **Deploy → Authorize** jika diminta
4. **Copy URL** deployment (format: `https://script.google.com/macros/s/.../exec`)

---

## Bagian 3 — Setup GitHub Pages

### 3.1 Buat Repository GitHub
1. Login ke [github.com](https://github.com)
2. **New repository** → nama: `cmu` (atau sesuai keinginan)
3. Visibility: **Public** (wajib untuk GitHub Pages gratis)

### 3.2 Upload File Frontend
Upload file-file berikut ke repository:
```
index.html
cek.html
admin.html
config.js      ← WAJIB diisi dulu (lihat 3.3)
api.js
README.md
```
> File GAS (`cmu.gs`, `cmu_api.gs`, `appsscript.json`) **tidak perlu** di-upload ke GitHub.

### 3.3 Isi config.js
Edit file `config.js`, ganti URL dengan hasil deployment GAS:
```javascript
const CMU_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/DEPLOYMENT_ID_ANDA/exec'
};
```

### 3.4 Aktifkan GitHub Pages
1. Di repository → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** → folder: **/ (root)**
4. Klik **Save**
5. GitHub akan memberikan URL: `https://[username].github.io/[repo-name]/`

---

## Bagian 4 — URL Akses

| Halaman | URL |
|---------|-----|
| Form Karyawan | `https://[username].github.io/[repo]/` |
| Cek Status | `https://[username].github.io/[repo]/cek.html` |
| Admin Panel | `https://[username].github.io/[repo]/admin.html` |

> URL Admin sebaiknya **tidak dipublikasikan** ke karyawan.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Halaman loading tapi tidak ada data | Cek `apiUrl` di `config.js` sudah benar |
| Admin tidak bisa login | Cek Script Properties `ADMIN_PASSWORD` sudah di-set |
| "Gagal terhubung ke server" | Re-deploy GAS sebagai New Deployment (bukan Manage Deployments) |
| File lampiran gagal upload | Cek scope `drive` ada di `appsscript.json`, re-authorize GAS |
| GitHub Pages belum aktif | Tunggu 1–2 menit setelah enable, atau hard refresh browser |
| CORS error di browser console | Pastikan deploy GAS dengan access: "Anyone", bukan "Anyone with Google Account" |
