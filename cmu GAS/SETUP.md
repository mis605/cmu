# SETUP — CMU WebApp (GOS Indoraya)
**Complaint Management Unit | Google Apps Script + Google Sheets**

---

## 1. Persiapan Google Sheet

Buat Google Sheet baru, lalu buat **3 tab (worksheet)** berikut:

### Tab 1: `Keluhan`
Isi baris pertama (header) dengan kolom berikut (A sampai S):

| Kol | Header | Keterangan |
|-----|--------|------------|
| A | ID Tiket | Auto-generate: CMU-YYYYMMDD-XXXX |
| B | Tanggal Submit | Timestamp otomatis |
| C | NRK / NIK | Key unik karyawan |
| D | Nama Pelapor | Freetext |
| E | Nama Klien / Penempatan | Freetext |
| F | Jabatan | Freetext |
| G | No HP / WhatsApp | Freetext |
| H | Email Aktif | Freetext |
| I | Kategori | Pertanyaan / Permintaan / Keluhan |
| J | Sub Kategori | Comp & Ben, BPJS, PKWT, Absensi, dst. |
| K | Deskripsi | Uraian lengkap dari karyawan |
| L | Prioritas | **Diisi admin**: High / Middle / Low |
| M | Status | Open / In Progress / Closed / Rejected |
| N | PIC Nama | Diisi admin saat assign |
| O | Tanggal Proses | Timestamp saat admin klik "Proses" |
| P | Tanggal Selesai | Timestamp saat admin klik "Selesai" |
| Q | SLA (Hari) | Formula otomatis (lihat di bawah) |
| R | Catatan Admin | Resolusi / komentar admin |
| S | File GDrive URL | Link lampiran dokumen karyawan |

**Formula SLA di kolom Q** (copy ke Q2, lalu drag ke bawah):
```
=IFERROR(IF(P2<>"",INT(P2-O2),IF(O2<>"",INT(TODAY()-O2),"")),"")
```
Formula ini otomatis menghitung:
- Jika sudah selesai → Tanggal Selesai - Tanggal Proses
- Jika masih berjalan → Hari Ini - Tanggal Proses
- Jika belum diproses → kosong

**Format Kolom B, O, P** sebagai `Date Time`: Format → Number → Date time

---

### Tab 2: `Referensi`
Isi baris pertama (header):

| Kol | Header |
|-----|--------|
| A | Kategori |
| B | Prioritas |
| C | PIC Nama |
| D | Status |

Contoh isi data (mulai baris 2):

| A | B | C | D |
|---|---|---|---|
| Pekerjaan | Rendah | Budi Santoso | Open |
| Administrasi | Sedang | Rina Wati | In Progress |
| Fasilitas | Tinggi | Ahmad Fauzi | Closed |
| Lainnya | | | Rejected |

Nama di kolom **C (PIC Nama)** akan muncul sebagai suggestions saat admin assign PIC.

---

### Tab 3: `SLA_Report` *(Opsional — Dashboard Manual)*
Bisa dibuat pivot/summary formula dari tab Keluhan untuk laporan bulanan.

---

## 2. Deploy Google Apps Script

### Langkah:
1. Buka [script.google.com](https://script.google.com) → **New Project**
2. Rename project menjadi `CMU GOS Indoraya`
3. Copy-paste semua file berikut:

| File GAS | Nama di Editor |
|----------|---------------|
| `cmu.gs` | `Code.gs` (hapus isi default, paste isi `cmu.gs`) |
| `index.html` | Klik `+` → HTML → nama: `index` |
| `cek.html` | Klik `+` → HTML → nama: `cek` |
| `admin.html` | Klik `+` → HTML → nama: `admin` |

4. Edit `appsscript.json`:
   - Klik ⚙️ **Project Settings** → centang **"Show appsscript.json manifest file"**
   - Klik file `appsscript.json` di sidebar → paste isi dari `appsscript.json`

---

## 3. Konfigurasi

### A. Ganti Sheet ID
Buka `Code.gs`, cari baris:
```javascript
const SHEET_ID = 'GSHEET_ID_ANDA';
```
Ganti `GSHEET_ID_ANDA` dengan ID Google Sheet Anda.

**Cara cari ID**: Dari URL Sheet → `docs.google.com/spreadsheets/d/**[ID_INI]**/edit`

---

### B. Set Password Admin
1. Di Apps Script Editor → **⚙️ Project Settings**
2. Scroll ke **Script Properties** → klik **Add script property**
3. Isi:
   - **Property**: `ADMIN_PASSWORD`
   - **Value**: *(password pilihan Anda)*
4. Klik **Save**

> Jika tidak diset, password default adalah `admin123`.

---

### C. Set Folder Google Drive (untuk Lampiran)
1. Buat folder di Google Drive untuk menyimpan dokumen lampiran
2. Klik kanan folder → **Share** → ubah ke "Anyone with the link can view"
3. Copy **ID folder** dari URL: `drive.google.com/drive/folders/**[ID_FOLDER_INI]**`
4. Di Apps Script Editor → **⚙️ Project Settings** → **Script Properties**
5. Tambah property:
   - **Property**: `GDRIVE_FOLDER_ID`
   - **Value**: *(ID folder GDrive Anda)*

> Jika tidak diset, file akan disimpan di root Drive akun deployer.

---

## 4. Deploy sebagai Web App

1. Klik **Deploy** → **New deployment**
2. Klik ⚙️ di samping "Select type" → pilih **Web App**
3. Isi konfigurasi:
   - **Description**: CMU v1.0
   - **Execute as**: Me *(akun yang punya Sheet)*
   - **Who has access**: Anyone *(agar karyawan outsource bisa akses tanpa login)*
4. Klik **Deploy** → **Authorize access** jika diminta
5. Copy URL Web App → bagikan ke karyawan

---

## 5. Alur Penggunaan

```
Karyawan                Admin
   │                      │
   ├─[?page=index]        │
   │  Isi form keluhan     │
   │  (NRK/NIK, judul,    │
   │   deskripsi, dll.)   │
   │  → Dapat ID Tiket    │
   │                      │
   ├─[?page=cek]          │
   │  Input NRK/NIK →     │
   │  lihat status tiket   │
   │                      │
   │          ┌──────────[URL default = admin]
   │          │  Login password
   │          │  Lihat semua tiket
   │          │  
   │          ├─ Proses → Assign PIC
   │          │   (Tanggal Proses dicatat)
   │          │   Status: In Progress
   │          │
   │          └─ Selesai → Isi catatan resolusi
   │              (Tanggal Selesai dicatat)
   │              Status: Closed
   │              SLA otomatis terhitung
   │
[Karyawan cek status]
```

---

## 6. URL Akses

| Halaman | URL |
|---------|-----|
| Form Submit Keluhan | `[URL_WEBAPP]?page=index` |
| Cek Status Keluhan | `[URL_WEBAPP]?page=cek` |
| Admin Panel | `[URL_WEBAPP]` *(default)* |

---

## 7. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Error "Sheet 'Keluhan' tidak ditemukan" | Pastikan nama tab persis `Keluhan` (huruf kapital K) |
| Data tidak masuk ke Sheet | Cek `SHEET_ID` di `Code.gs` sudah diganti |
| Admin tidak bisa login | Cek Script Properties sudah di-set, atau coba password `admin123` |
| Tombol aksi tidak muncul | Refresh halaman admin setelah deploy ulang |
| SLA kolom P kosong | Pastikan formula sudah di-drag ke bawah dari P2 |
