# Setup Deployment ke GitHub Pages & Google Apps Script (GAS)
Dokumen ini menjelaskan langkah demi langkah untuk memigrasikan CMU form ke **GitHub Pages (Frontend)** dan **Google Apps Script (Backend/API)**.

---

## Tahap 1: Setup Backend Google Apps Script (GAS)

1. Buka [Google Apps Script Editor](https://script.google.com).
2. Buat project baru, beri nama **API CMU**.
3. Buka file `cmu_api.gs` yang ada di lokal Anda, **salin semua isi codenya**, lalu *paste* ke dalam Script Editor Google.
4. Di baris awal Code, ubah variabel berikut:
   ```javascript
   const SHEET_ID = 'MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI';
   // Contoh: '1BxX...Hn2k'
   ```
5. *(Opsional)* Jika ingin mengatur folder Google Drive khusus untuk unggahan file, klik icon **Project Settings (Roda Gigi)** di sebelah kiri, *Scroll* ke bagian **Script Properties**, klik **Add script property**, masukkan:
   - **Property**: `GDRIVE_FOLDER_ID`
   - **Value**: Masukkan Folder ID Google Drive anda.
6. Sama seperti di atas, tambahkan password untuk admin:
   - **Property**: `ADMIN_PASSWORD`
   - **Value**: `adminrahasia123` *(contoh)*

### Deploy sebagai Web App
1. Di kanan atas, klik tombol biru **Deploy** > **New Deployment**.
2. Pilih tipe: **Web app**.
3. **Execute as**: `Me` (Penting! Agar file dan datanya masuk ke akun Anda).
4. **Who has access**: `Anyone` (Penting! Harus anyone karena Public API).
5. Klik **Deploy** dan berikan otorisasi izin akun.
6. Salin **URL Web App** yang di-generate. (Bentuknya seperti: `https://script.google.com/macros/s/.../exec`)

---

## Tahap 2: Setup Frontend (Repository Github)

1. Pastikan folder Project lokal Anda ini sudah berisikan:
   - `index.html`
   - `cek.html`
   - `admin.html`
   - `config.js` (dan/atau `config.example.js`)
2. Buka `config.js` dan **Tempelkan URL Web App GAS Anda**:
   ```javascript
   const CMU_CONFIG = {
       GAS_URL: 'https://script.google.com/macros/s/AKfyc...Qgjpd/exec'
   };
   ```
3. Commit dan push proyek ini ke GitHub Repository Anda (gratis).

---

## Tahap 3: Aktifkan GitHub Pages

1. Buka repository GitHub Anda dari Browser.
2. Ke tab **Settings** -> pilih menu **Pages** (di sidebar kiri).
3. Pada opsi **Build and deployment**:
   - Source: `Deploy from a branch`
   - Branch: Pilih cabang `main` atau `master` dan folder `/ (root)`.
4. Klik **Save**.
5. Tunggu 1–2 menit, GitHub akan menampilkan pesan: *"Your site is live at https://[username].github.io/[namarepo]/"*
6. Selesai! Web Anda kini bisa diakses dari link GitHub Pages di atas.

---

## Troubleshooting

- **Admin.html loading terus dan tidak muncul tabel?**
  Pastikan Sheet GSheet benar-benar ada data Header, dan URL di `config.js` valid serta CORS dari AppScript (doPost) berjalan lancar. Cek `Inspect Element > Console` (F12) untuk melihat error spesifik.
- **Upload File Error?**
  Pastikan Anda telah memberi otorisasi yang benar di deployment GAS, dan GDRIVE_FOLDER_ID sesuai (jika dikonfigurasi). 
- **Terpaksa membuat perubahan Apps Script (`cmu_api.gs`)?**
  Setelah save, jangan lupa klik **Deploy > Manage Deployments > Edit (Pencil) > Version: New > Deploy** agar perubahan ter-update untuk publik! (Jika tidak New Version, script lama yang diakses oleh frontend).
