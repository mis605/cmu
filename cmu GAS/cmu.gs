/**
 * CMU - Complaint Management Unit
 * GOS Indoraya | Google Apps Script Backend
 * 
 * KONFIGURASI: Ganti nilai di bawah ini sebelum deploy
 */

const SHEET_ID = 'GSHEET_ID_ANDA';
const SHEET_KELUHAN = 'Keluhan';
const SHEET_REF = 'Referensi';
const ADMIN_PASSWORD_KEY = 'ADMIN_PASSWORD';
// Opsional: ID folder GDrive untuk dokumen upload
// Set via Script Properties key: GDRIVE_FOLDER_ID
// Jika tidak diset, file disimpan di root Drive akun deployer

// ─────────────────────────────────────────────
//  ROUTING
// ─────────────────────────────────────────────
function doGet(e) {
  const page = e.parameter.page || 'index';

  if (page === 'index') {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('CMU - Submit Keluhan | GOS Indoraya')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (page === 'cek') {
    return HtmlService.createHtmlOutputFromFile('cek')
      .setTitle('CMU - Cek Status Keluhan | GOS Indoraya')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createHtmlOutputFromFile('admin')
    .setTitle('CMU - Admin Panel | GOS Indoraya')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet '" + sheetName + "' tidak ditemukan.");
  return sheet;
}

/**
 * Generate ID Tiket: CMU-YYYYMMDD-XXXX (4 digit sequential harian)
 */
function generateTicketId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = now.getFullYear().toString() + pad(now.getMonth() + 1) + pad(now.getDate());

  const sheet = getSheet(SHEET_KELUHAN);
  const lastRow = sheet.getLastRow();
  let countToday = 0;

  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(function(r) {
      if (r[0] && r[0].toString().indexOf('CMU-' + dateStr) === 0) countToday++;
    });
  }

  const seq = String(countToday + 1).padStart(4, '0');
  return 'CMU-' + dateStr + '-' + seq;
}

function getServiceUrl() {
  return ScriptApp.getService().getUrl();
}

// ─────────────────────────────────────────────
//  EMPLOYEE: SUBMIT KELUHAN
// ─────────────────────────────────────────────
/**
 * Schema kolom Tab Keluhan (A–S):
 * A: ID Tiket       B: Tanggal Submit    C: NRK/NIK
 * D: Nama Pelapor   E: Klien/Penempatan  F: Jabatan
 * G: No HP/WA       H: Email Aktif       I: Kategori
 * J: Sub Kategori   K: Deskripsi         L: Prioritas (admin set)
 * M: Status         N: PIC Nama          O: Tanggal Proses
 * P: Tanggal Selesai Q: SLA (Hari)      R: Catatan Admin
 * S: File GDrive URL
 *
 * @param {Object} data - Form data dari index.html
 * @returns {Object} { success, ticketId, message }
 */
function submitKeluhan(data) {
  try {
    const required = ['nrk_nik', 'nama', 'klien', 'nohp', 'email', 'kategori', 'subKategori', 'deskripsi'];
    for (const f of required) {
      if (!data[f] || data[f].toString().trim() === '') {
        return { success: false, message: 'Field wajib belum diisi: ' + f };
      }
    }

    const sheet = getSheet(SHEET_KELUHAN);
    const ticketId = generateTicketId();

    sheet.appendRow([
      ticketId,                                  // A: ID Tiket
      new Date(),                                // B: Tanggal Submit
      data.nrk_nik.toString().trim(),            // C: NRK / NIK
      data.nama.toString().trim(),               // D: Nama Pelapor
      data.klien.toString().trim(),              // E: Nama Klien / Penempatan
      (data.jabatan || '').toString().trim(),    // F: Jabatan
      (data.nohp || '').toString().trim(),       // G: No HP / WhatsApp
      (data.email || '').toString().trim(),      // H: Email Aktif
      data.kategori,                             // I: Kategori
      data.subKategori.toString().trim(),        // J: Sub Kategori
      data.deskripsi.toString().trim(),          // K: Deskripsi
      '',                                        // L: Prioritas (diisi admin)
      'Open',                                    // M: Status
      '',                                        // N: PIC Nama
      '',                                        // O: Tanggal Proses
      '',                                        // P: Tanggal Selesai
      '',                                        // Q: SLA (Hari) — formula di GSheet
      '',                                        // R: Catatan Admin
      (data.fileUrl || '')                       // S: File GDrive URL
    ]);

    CacheService.getScriptCache().remove('keluhan_all');
    return { success: true, ticketId: ticketId, message: 'Keluhan berhasil tercatat dengan ID: ' + ticketId };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.toString() };
  }
}

// ─────────────────────────────────────────────
//  GDRIVE: UPLOAD DOKUMEN
// ─────────────────────────────────────────────
/**
 * Upload file dari client (base64) ke Google Drive
 * @param {string} base64Data - Konten file dalam format base64
 * @param {string} fileName   - Nama file asli
 * @param {string} mimeType   - MIME type (e.g. 'application/pdf', 'image/jpeg')
 * @returns {Object} { success, url, id, message }
 */
function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    const props = PropertiesService.getScriptProperties();
    const folderId = props.getProperty('GDRIVE_FOLDER_ID');
    const folder = folderId
      ? DriveApp.getFolderById(folderId)
      : DriveApp.getRootFolder();

    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = folder.createFile(blob);

    // Set link agar bisa dilihat siapa saja yang punya link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { success: true, url: file.getUrl(), id: file.getId() };
  } catch (e) {
    return { success: false, message: 'Upload gagal: ' + e.toString() };
  }
}

// ─────────────────────────────────────────────
//  EMPLOYEE: CEK STATUS KELUHAN (by NRK/NIK)
// ─────────────────────────────────────────────
function getMyKeluhan(nrkNik) {
  try {
    if (!nrkNik || nrkNik.toString().trim() === '') return [];
    const sheet = getSheet(SHEET_KELUHAN);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
    const key = nrkNik.toString().trim();

    return data
      .filter(r => r[2].toString().trim() === key)
      .map(r => _formatRow(r))
      .reverse();
  } catch (e) {
    return [];
  }
}

// ─────────────────────────────────────────────
//  ADMIN: AMBIL SEMUA KELUHAN
// ─────────────────────────────────────────────
function getKeluhanList() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('keluhan_all');
  if (cached) return JSON.parse(cached);

  try {
    const sheet = getSheet(SHEET_KELUHAN);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
    const result = data.map(r => _formatRow(r)).reverse();

    cache.put('keluhan_all', JSON.stringify(result), 300);
    return result;
  } catch (e) {
    return [];
  }
}

// ─────────────────────────────────────────────
//  ADMIN: PROSES KELUHAN (Assign PIC)
// ─────────────────────────────────────────────
/**
 * Admin memproses tiket: set PIC, Prioritas, Tanggal Proses, Status → In Progress
 * @param {string} ticketId
 * @param {string} picNama
 * @param {string} prioritas - High / Middle / Low
 * @param {string} catatan
 */
function updateStatus(ticketId, picNama, prioritas, catatan) {
  try {
    const sheet = getSheet(SHEET_KELUHAN);
    const rowIndex = _findRowByTicketId(sheet, ticketId);
    if (!rowIndex) return { success: false, message: 'Tiket ' + ticketId + ' tidak ditemukan.' };

    const currentStatus = sheet.getRange(rowIndex, 13).getValue(); // M: Status
    if (currentStatus === 'Closed') {
      return { success: false, message: 'Tiket sudah ditutup, tidak bisa diproses ulang.' };
    }

    sheet.getRange(rowIndex, 12).setValue(prioritas || 'Middle'); // L: Prioritas
    sheet.getRange(rowIndex, 13).setValue('In Progress');          // M: Status
    sheet.getRange(rowIndex, 14).setValue(picNama || '');          // N: PIC Nama
    sheet.getRange(rowIndex, 15).setValue(new Date());             // O: Tanggal Proses
    if (catatan) sheet.getRange(rowIndex, 18).setValue(catatan);   // R: Catatan Admin

    CacheService.getScriptCache().remove('keluhan_all');
    return { success: true, message: 'Tiket ' + ticketId + ' berhasil diproses.' };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.toString() };
  }
}

// ─────────────────────────────────────────────
//  ADMIN: TUTUP KELUHAN
// ─────────────────────────────────────────────
function closeKeluhan(ticketId, catatan) {
  try {
    const sheet = getSheet(SHEET_KELUHAN);
    const rowIndex = _findRowByTicketId(sheet, ticketId);
    if (!rowIndex) return { success: false, message: 'Tiket tidak ditemukan.' };

    const tglProses = sheet.getRange(rowIndex, 15).getValue(); // O: Tanggal Proses
    if (!tglProses) {
      return { success: false, message: 'Tiket harus diproses terlebih dahulu.' };
    }

    sheet.getRange(rowIndex, 13).setValue('Closed');             // M: Status
    sheet.getRange(rowIndex, 16).setValue(new Date());           // P: Tanggal Selesai
    if (catatan) sheet.getRange(rowIndex, 18).setValue(catatan); // R: Catatan Admin

    CacheService.getScriptCache().remove('keluhan_all');
    return { success: true, message: 'Tiket ' + ticketId + ' berhasil ditutup.' };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.toString() };
  }
}

// ─────────────────────────────────────────────
//  ADMIN: REJECT
// ─────────────────────────────────────────────
function rejectKeluhan(ticketId, catatan) {
  try {
    const sheet = getSheet(SHEET_KELUHAN);
    const rowIndex = _findRowByTicketId(sheet, ticketId);
    if (!rowIndex) return { success: false, message: 'Tiket tidak ditemukan.' };

    sheet.getRange(rowIndex, 13).setValue('Rejected');           // M: Status
    if (catatan) sheet.getRange(rowIndex, 18).setValue(catatan); // R: Catatan Admin

    CacheService.getScriptCache().remove('keluhan_all');
    return { success: true, message: 'Tiket ' + ticketId + ' ditolak.' };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.toString() };
  }
}

// ─────────────────────────────────────────────
//  ADMIN: VERIFIKASI PASSWORD
// ─────────────────────────────────────────────
function verifyAdmin(password) {
  try {
    const stored = PropertiesService.getScriptProperties().getProperty(ADMIN_PASSWORD_KEY);
    return password === (stored || 'admin123');
  } catch (e) {
    return false;
  }
}

// ─────────────────────────────────────────────
//  REFERENSI
// ─────────────────────────────────────────────
function getPicList() {
  try {
    const sheet = getSheet(SHEET_REF);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    return sheet.getRange(2, 3, lastRow - 1, 1).getValues()
      .map(r => r[0]).filter(v => v !== '');
  } catch (e) {
    return [];
  }
}

// ─────────────────────────────────────────────
//  INTERNAL HELPERS
// ─────────────────────────────────────────────
function _findRowByTicketId(sheet, ticketId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0].toString() === ticketId.toString()) return i + 2;
  }
  return null;
}

/**
 * Format row array → JSON object
 * Kolom A(0)–S(18), total 19 kolom
 */
function _formatRow(r) {
  const fmt = (d) => d instanceof Date && !isNaN(d)
    ? Utilities.formatDate(d, 'GMT+7', 'dd MMM yyyy HH:mm')
    : (d ? d.toString() : '');

  // SLA fallback (jika formula GSheet belum jalan)
  let slaHari = r[16]; // Q
  if (!slaHari && r[14] instanceof Date && !isNaN(r[14])) {
    const end = r[15] instanceof Date && !isNaN(r[15]) ? r[15] : new Date();
    slaHari = Math.floor((end - r[14]) / (1000 * 60 * 60 * 24));
  }

  return {
    id:          r[0]  || '',
    tglSubmit:   fmt(r[1]),
    nrkNik:      r[2]  || '',
    nama:        r[3]  || '',
    klien:       r[4]  || '',
    jabatan:     r[5]  || '',
    nohp:        r[6]  || '',
    email:       r[7]  || '',
    kategori:    r[8]  || '',
    subKategori: r[9]  || '',
    deskripsi:   r[10] || '',
    prioritas:   r[11] || '',
    status:      r[12] || 'Open',
    picNama:     r[13] || '',
    tglProses:   fmt(r[14]),
    tglSelesai:  fmt(r[15]),
    sla:         slaHari !== '' ? slaHari : '',
    catatan:     r[17] || '',
    fileUrl:     r[18] || ''
  };
}
