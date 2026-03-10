/**
 * CMU - Complaint Management Unit
 * GOS Indoraya | Google Apps Script Backend
 *
 * VERSI: GitHub Pages + GAS API
 * Tambahkan doPost() ini ke project GAS Anda (gabungkan dengan cmu.gs sebelumnya).
 *
 * KONFIGURASI: Ganti nilai di bawah ini sebelum deploy
 */

const SHEET_ID = '1k-Ju975WmYTX5zknlN3Gt84teOE2Y16ZbvFuGDe2Y6w'; // ← ganti dengan ID Google Sheet Anda
const SHEET_KELUHAN = 'Keluhan';
const ADMIN_PASSWORD_KEY = 'ADMIN_PASSWORD';

// ─────────────────────────────────────────────
//  ROUTING (GET) — tetap bisa serve admin via ?page=admin jika mau
// ─────────────────────────────────────────────
function doGet(e) {
  const page = (e.parameter && e.parameter.page) || '';
  if (page === 'admin') {
    return HtmlService.createHtmlOutput('<p>Gunakan GitHub Pages untuk akses admin panel.</p>');
  }
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'CMU API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────
//  API ENDPOINT (POST) — dipanggil dari GitHub Pages frontend
//  Content-Type: text/plain (menghindari CORS preflight)
//  Body: JSON string { action, ...params }
// ─────────────────────────────────────────────
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    let result;

    switch (action) {
      case 'submitKeluhan':
        result = submitKeluhan(params.data);
        break;
      case 'getMyKeluhan':
        result = getMyKeluhan(params.nrkNik);
        break;
      case 'getKeluhanList':
        result = getKeluhanList();
        break;
      case 'updateStatus':
        if (!_verifyToken(params.token)) { result = { success: false, message: 'Akses ditolak: Sesi admin tidak valid atau expired.' }; break; }
        result = updateStatus(params.ticketId, params.picNama, params.prioritas, params.catatan);
        break;
      case 'closeKeluhan':
        if (!_verifyToken(params.token)) { result = { success: false, message: 'Akses ditolak: Sesi admin tidak valid atau expired.' }; break; }
        result = closeKeluhan(params.ticketId, params.catatan);
        break;
      case 'rejectKeluhan':
        if (!_verifyToken(params.token)) { result = { success: false, message: 'Akses ditolak: Sesi admin tidak valid atau expired.' }; break; }
        result = rejectKeluhan(params.ticketId, params.catatan);
        break;
      case 'verifyAdmin':
        result = verifyAdmin(params.password);
        break;
      case 'getPicList':
        result = { success: true, list: getPicList() };
        break;
      case 'uploadFileToDrive':
        result = uploadFileToDrive(params.base64Data, params.fileName, params.mimeType);
        break;
      default:
        result = { success: false, message: 'Action tidak dikenal: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'Server error: ' + err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
 * Generate ID Tiket: CMU-YYYYMMDD-XXXX (4 digit)
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
    ids.forEach(r => {
      if (r[0] && r[0].toString().indexOf('CMU-' + dateStr) === 0) countToday++;
    });
  }
  const seq = String(countToday + 1).padStart(4, '0');
  return 'CMU-' + dateStr + '-' + seq;
}

// ─────────────────────────────────────────────
//  EMPLOYEE: SUBMIT KELUHAN
//  Schema kolom Tab Keluhan (A–S), 19 kolom:
//  A:ID  B:TglSubmit  C:NRK/NIK  D:Nama  E:Klien  F:Jabatan
//  G:NoHP  H:Email  I:Kategori  J:SubKategori  K:Deskripsi
//  L:Prioritas(admin)  M:Status  N:PICNama  O:TglProses
//  P:TglSelesai  Q:SLA(Hari)  R:CatatanAdmin  S:FileGDriveURL
// ─────────────────────────────────────────────
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
      ticketId,
      new Date(),
      data.nrk_nik.trim(),
      data.nama.trim(),
      data.klien.trim(),
      (data.jabatan || '').trim(),
      (data.nohp || '').trim(),
      (data.email || '').trim(),
      data.kategori,
      data.subKategori.trim(),
      data.deskripsi.trim(),
      '',           // L: Prioritas (admin set)
      'Open',       // M: Status
      '',           // N: PIC Nama
      '',           // O: Tanggal Proses
      '',           // P: Tanggal Selesai
      '',           // Q: SLA (Hari) — formula GSheet
      '',           // R: Catatan Admin
      (data.fileUrl || '')  // S: File GDrive URL
    ]);

    CacheService.getScriptCache().remove('keluhan_all');
    return { success: true, ticketId, message: 'Keluhan berhasil tercatat dengan ID: ' + ticketId };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.toString() };
  }
}

// ─────────────────────────────────────────────
//  GDRIVE: UPLOAD DOKUMEN
// ─────────────────────────────────────────────
function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    const folderId = PropertiesService.getScriptProperties().getProperty('GDRIVE_FOLDER_ID');
    const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, url: file.getUrl(), id: file.getId() };
  } catch (e) {
    return { success: false, message: 'Upload gagal: ' + e.toString() };
  }
}

// ─────────────────────────────────────────────
//  EMPLOYEE: CEK STATUS
// ─────────────────────────────────────────────
function getMyKeluhan(nrkNik) {
  try {
    if (!nrkNik || nrkNik.toString().trim() === '') return [];
    const sheet = getSheet(SHEET_KELUHAN);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    const data = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
    const key = nrkNik.toString().trim();
    return data.filter(r => r[2].toString().trim() === key).map(r => _formatRow(r)).reverse();
  } catch (e) { return []; }
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
  } catch (e) { return []; }
}

// ─────────────────────────────────────────────
//  ADMIN: PROSES  / SELESAI / REJECT
// ─────────────────────────────────────────────
function updateStatus(ticketId, picNama, prioritas, catatan) {
  try {
    const sheet = getSheet(SHEET_KELUHAN);
    const rowIndex = _findRowByTicketId(sheet, ticketId);
    if (!rowIndex) return { success: false, message: 'Tiket tidak ditemukan.' };
    if (sheet.getRange(rowIndex, 13).getValue() === 'Closed')
      return { success: false, message: 'Tiket sudah ditutup.' };
    sheet.getRange(rowIndex, 12).setValue(prioritas || 'Middle');
    sheet.getRange(rowIndex, 13).setValue('In Progress');
    sheet.getRange(rowIndex, 14).setValue(picNama || '');
    sheet.getRange(rowIndex, 15).setValue(new Date());
    if (catatan) sheet.getRange(rowIndex, 18).setValue(catatan);
    CacheService.getScriptCache().remove('keluhan_all');
    return { success: true, message: 'Tiket ' + ticketId + ' berhasil diproses.' };
  } catch (e) { return { success: false, message: 'Error: ' + e.toString() }; }
}

function closeKeluhan(ticketId, catatan) {
  try {
    const sheet = getSheet(SHEET_KELUHAN);
    const rowIndex = _findRowByTicketId(sheet, ticketId);
    if (!rowIndex) return { success: false, message: 'Tiket tidak ditemukan.' };
    if (!sheet.getRange(rowIndex, 15).getValue())
      return { success: false, message: 'Tiket harus diproses terlebih dahulu.' };
    sheet.getRange(rowIndex, 13).setValue('Closed');
    sheet.getRange(rowIndex, 16).setValue(new Date());
    if (catatan) sheet.getRange(rowIndex, 18).setValue(catatan);
    CacheService.getScriptCache().remove('keluhan_all');
    return { success: true, message: 'Tiket ' + ticketId + ' berhasil ditutup.' };
  } catch (e) { return { success: false, message: 'Error: ' + e.toString() }; }
}

function rejectKeluhan(ticketId, catatan) {
  try {
    const sheet = getSheet(SHEET_KELUHAN);
    const rowIndex = _findRowByTicketId(sheet, ticketId);
    if (!rowIndex) return { success: false, message: 'Tiket tidak ditemukan.' };
    sheet.getRange(rowIndex, 13).setValue('Rejected');
    if (catatan) sheet.getRange(rowIndex, 18).setValue(catatan);
    CacheService.getScriptCache().remove('keluhan_all');
    return { success: true, message: 'Tiket ' + ticketId + ' ditolak.' };
  } catch (e) { return { success: false, message: 'Error: ' + e.toString() }; }
}

// ─────────────────────────────────────────────
//  ADMIN: VERIFIKASI PASSWORD & PIC LIST
// ─────────────────────────────────────────────
function verifyAdmin(password) {
  try {
    const stored = PropertiesService.getScriptProperties().getProperty(ADMIN_PASSWORD_KEY);
    if (password === (stored || 'admin123')) {
      const token = Utilities.getUuid();
      CacheService.getScriptCache().put('auth_' + token, 'valid', 21600); // Token aktif 6 jam
      return { success: true, ok: true, token: token };
    }
    return { success: true, ok: false };
  } catch (e) { return { success: false, ok: false, message: e.toString() }; }
}

function _verifyToken(token) {
  if (!token) return false;
  return CacheService.getScriptCache().get('auth_' + token) === 'valid';
}

function getPicList() {
  // Kembalikan array kosong jika tidak menggunakan sheet Referensi
  return [];
}

// ─────────────────────────────────────────────
//  HELPERS
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

function _formatRow(r) {
  const fmt = d => d instanceof Date && !isNaN(d)
    ? Utilities.formatDate(d, 'GMT+7', 'dd MMM yyyy HH:mm') : (d ? d.toString() : '');
  let slaHari = r[16];
  if (!slaHari && r[14] instanceof Date && !isNaN(r[14])) {
    const end = r[15] instanceof Date && !isNaN(r[15]) ? r[15] : new Date();
    slaHari = Math.floor((end - r[14]) / (1000 * 60 * 60 * 24));
  }
  return {
    id: r[0] || '', tglSubmit: fmt(r[1]), nrkNik: r[2] || '', nama: r[3] || '',
    klien: r[4] || '', jabatan: r[5] || '', nohp: r[6] || '', email: r[7] || '',
    kategori: r[8] || '', subKategori: r[9] || '', deskripsi: r[10] || '',
    prioritas: r[11] || '', status: r[12] || 'Open', picNama: r[13] || '',
    tglProses: fmt(r[14]), tglSelesai: fmt(r[15]),
    sla: slaHari !== '' ? slaHari : '', catatan: r[17] || '', fileUrl: r[18] || ''
  };
}
