/**
 * CMU — API Client Helper
 * Menggantikan google.script.run untuk GitHub Pages frontend.
 * 
 * Membutuhkan config.js yang dimuat sebelum file ini.
 * Semua fungsi mengembalikan Promise.
 */

const _API_URL = CMU_CONFIG.apiUrl;

// ── GET — Read Operations ────────────────────────────────────────────────────
async function apiGet(action, params = {}) {
    const url = new URL(_API_URL);
    url.searchParams.set('action', action);
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}

// ── POST — Write Operations ──────────────────────────────────────────────────
// Menggunakan FormData agar tidak ada preflight CORS OPTIONS request
async function apiPost(action, params = {}) {
    const fd = new FormData();
    fd.append('action', action);
    for (const [k, v] of Object.entries(params)) {
        fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    const res = await fetch(_API_URL, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}

// ── Shortcut helpers ─────────────────────────────────────────────────────────
const API = {
    // Employee
    submitKeluhan: (data) => apiPost('submitKeluhan', { data }),
    getMyKeluhan: (nrk) => apiGet('getMyKeluhan', { nrk }),
    uploadFile: (base64, fileName, mimeType) => apiPost('uploadFile', { base64, fileName, mimeType }),

    // Admin reads
    getKeluhanList: () => apiGet('getKeluhanList'),
    getPicList: () => apiGet('getPicList'),

    // Admin writes
    verifyAdmin: (password) => apiPost('verifyAdmin', { password }),
    updateStatus: (ticketId, picNama, prioritas, catatan) =>
        apiPost('updateStatus', { ticketId, picNama, prioritas, catatan }),
    closeKeluhan: (ticketId, catatan) => apiPost('closeKeluhan', { ticketId, catatan }),
    rejectKeluhan: (ticketId, catatan) => apiPost('rejectKeluhan', { ticketId, catatan }),
};
