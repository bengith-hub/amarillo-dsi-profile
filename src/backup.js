// ============================================================
// AMARILLO DSI PROFILE — Backup & Restore Module
// Google Drive integration + local JSON export/import
// ============================================================

const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";
const GIS_SCRIPT = "https://accounts.google.com/gsi/client";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

// --- GIS state (module-level) ---
let _gisLoaded = false;
let _tokenClient = null;
let _accessToken = null;
let _tokenExpiry = 0;

// ============================================================
// GOOGLE IDENTITY SERVICES (GIS)
// ============================================================

/** Load Google Identity Services script dynamically */
export function loadGIS() {
  if (_gisLoaded && window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.accounts?.oauth2) {
      _gisLoaded = true;
      resolve();
      return;
    }
    // Check if script tag already exists
    if (document.querySelector(`script[src="${GIS_SCRIPT}"]`)) {
      const check = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(check);
          _gisLoaded = true;
          resolve();
        }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error("GIS load timeout")); }, 10000);
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT;
    script.async = true;
    script.onload = () => {
      _gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Impossible de charger Google Identity Services."));
    document.head.appendChild(script);
  });
}

/** Initialize OAuth2 token client */
export function initTokenClient(clientId) {
  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity Services non chargé. Appelez loadGIS() d'abord.");
  }
  // Reset if client ID changed
  if (_tokenClient && _tokenClient._clientId !== clientId) {
    _tokenClient = null;
    _accessToken = null;
    _tokenExpiry = 0;
  }
  if (!_tokenClient) {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: () => {}, // replaced on each requestAccessToken call
    });
    _tokenClient._clientId = clientId;
  }
}

/** Request an access token via popup. Returns the token string. */
export function requestAccessToken() {
  return new Promise((resolve, reject) => {
    if (_accessToken && Date.now() < _tokenExpiry) {
      resolve(_accessToken);
      return;
    }
    if (!_tokenClient) {
      reject(new Error("Token client non initialisé. Appelez initTokenClient() d'abord."));
      return;
    }
    _tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(`Erreur OAuth: ${response.error}`));
        return;
      }
      _accessToken = response.access_token;
      _tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000;
      resolve(_accessToken);
    };
    _tokenClient.error_callback = () => {
      reject(new Error("Authentification Google annulée ou échouée."));
    };
    _tokenClient.requestAccessToken();
  });
}

// ============================================================
// LOCAL BACKUP
// ============================================================

/** Download the full JSONBin record as a local .json file */
export function downloadLocalBackup(record) {
  const snapshot = createSnapshot(record, "manual");
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const filename = `dsi-profile-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}h${pad(now.getMinutes())}.json`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  return filename;
}

// ============================================================
// GOOGLE DRIVE
// ============================================================

/** Upload a snapshot to Google Drive (multipart upload) */
export async function uploadToDrive(accessToken, folderId, record, type = "manual") {
  const snapshot = createSnapshot(record, type);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fileName = `dsi-profile-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}h${pad(now.getMinutes())}.json`;

  const metadata = {
    name: fileName,
    mimeType: "application/json",
    parents: [folderId],
  };

  const boundary = "===backup_boundary===";
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(snapshot, null, 2)}\r\n` +
    `--${boundary}--`;

  const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Erreur upload Drive (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { fileId: data.id, fileName };
}

/** List backup files in the Drive folder */
export async function listDriveBackups(accessToken, folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(
    `${DRIVE_FILES}?q=${q}&orderBy=createdTime desc&fields=files(id,name,createdTime,size)&pageSize=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error(`Erreur liste Drive (${res.status})`);
  }
  const data = await res.json();
  return data.files || [];
}

/** Download a specific backup file from Drive */
export async function downloadFromDrive(accessToken, fileId) {
  const res = await fetch(`${DRIVE_FILES}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Erreur téléchargement Drive (${res.status})`);
  }
  return res.json();
}

/** Delete a file from Drive */
export async function deleteFromDrive(accessToken, fileId) {
  const res = await fetch(`${DRIVE_FILES}/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Erreur suppression Drive (${res.status})`);
  }
}

// ============================================================
// RESTORE
// ============================================================

/**
 * Restore data from a backup object into JSONBin.
 * Validates structure before writing.
 */
export async function restoreFromBackup(data, updateBinFn) {
  // Validate required keys
  if (!data || typeof data !== "object") {
    throw new Error("Données invalides : objet attendu.");
  }
  if (!data.sessions || typeof data.sessions !== "object") {
    throw new Error("Données invalides : clé 'sessions' manquante.");
  }
  if (!Array.isArray(data.index)) {
    throw new Error("Données invalides : clé 'index' manquante ou non-tableau.");
  }

  // Preserve or set defaults for emailConfig
  if (!data.emailConfig || typeof data.emailConfig !== "object") {
    data.emailConfig = {};
  }

  // Remove backupStatus from restored data (don't overwrite current status)
  delete data.backupStatus;

  await updateBinFn(data);
  return true;
}

/**
 * Parse and validate a local backup file.
 * Supports both snapshot wrapper format and raw data format.
 */
export async function parseBackupFile(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Le fichier n'est pas un JSON valide.");
  }

  // Snapshot wrapper format: { type, timestamp, version, data: { sessions, index, ... } }
  if (parsed.data && parsed.data.sessions && Array.isArray(parsed.data.index)) {
    return {
      data: parsed.data,
      metadata: {
        type: parsed.type || "unknown",
        timestamp: parsed.timestamp,
        sessionCount: parsed.sessionCount || parsed.data.index.length,
      },
    };
  }

  // Raw format: { sessions, index, emailConfig }
  if (parsed.sessions && Array.isArray(parsed.index)) {
    return {
      data: parsed,
      metadata: {
        type: "raw",
        timestamp: null,
        sessionCount: parsed.index.length,
      },
    };
  }

  throw new Error("Format de backup non reconnu. Attendu: sessions + index.");
}

// ============================================================
// SNAPSHOT
// ============================================================

/** Create a full snapshot object with metadata */
export function createSnapshot(record, type = "manual") {
  return {
    type,
    timestamp: new Date().toISOString(),
    version: "1.0",
    appName: "amarillo-dsi-profile",
    sessionCount: (record.index || []).length,
    data: record,
  };
}
