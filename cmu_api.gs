/**
 * CMU API Layer — Google Apps Script
 * Digunakan sebagai JSON REST API untuk frontend GitHub Pages
 * 
 * File ini DITAMBAHKAN ke project GAS yang sudah ada (bersama cmu.gs).
 * cmu.gs berisi semua logic & helper functions.
 * File ini hanya bertugas menerima HTTP request dan mengembalikan JSON.
 *
 * ─── Endpoint ───────────────────────────────────────────────────────
 *  GET  ?action=getKeluhanList           → semua tiket (admin)
 *  GET  ?action=getMyKeluhan&nrk=XXX    → tiket by NRK/NIK (karyawan)
 *  GET  ?action=getPicList               → list PIC
 *
 *  POST  action=submitKeluhan   + data={json form payload}
 *  POST  action=updateStatus    + ticketId, picNama, prioritas, catatan
 *  POST  action=closeKeluhan    + ticketId, catatan
 *  POST  action=rejectKeluhan   + ticketId, catatan
 *  POST  action=verifyAdmin     + password
 *  POST  action=uploadFile      + base64, fileName, mimeType
 * ────────────────────────────────────────────────────────────────────
 */

// ── GET Handler ──────────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || '';

    if (action === 'getKeluhanList') return _res(getKeluhanList());
    if (action === 'getMyKeluhan')   return _res(getMyKeluhan(e.parameter.nrk || ''));
    if (action === 'getPicList')     return _res(getPicList());

    return _res({ error: 'Unknown action: ' + action });
  } catch (err) {
    return _res({ error: err.toString() });
  }
}

// ── POST Handler ─────────────────────────────────────────────────────
// Frontend mengirim FormData → field tersedia di e.parameter
function doPost(e) {
  try {
    const action = e.parameter.action || '';

    if (action === 'submitKeluhan') {
      const data = JSON.parse(e.parameter.data || '{}');
      return _res(submitKeluhan(data));
    }

    if (action === 'updateStatus') {
      return _res(updateStatus(
        e.parameter.ticketId,
        e.parameter.picNama,
        e.parameter.prioritas,
        e.parameter.catatan || ''
      ));
    }

    if (action === 'closeKeluhan') {
      return _res(closeKeluhan(e.parameter.ticketId, e.parameter.catatan || ''));
    }

    if (action === 'rejectKeluhan') {
      return _res(rejectKeluhan(e.parameter.ticketId, e.parameter.catatan || ''));
    }

    if (action === 'verifyAdmin') {
      return _res({ success: verifyAdmin(e.parameter.password || '') });
    }

    if (action === 'uploadFile') {
      return _res(uploadFileToDrive(
        e.parameter.base64,
        e.parameter.fileName,
        e.parameter.mimeType
      ));
    }

    return _res({ error: 'Unknown action: ' + action });
  } catch (err) {
    return _res({ error: err.toString() });
  }
}

// ── Helper ────────────────────────────────────────────────────────────
function _res(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
