// Netlify Scheduled Function — Automatic daily backup to Google Drive
// Runs at 3:00 AM UTC every day (configured in netlify.toml: schedule = "0 3 * * *")
// Reads data from JSONBin, uploads to Google Drive, rotates old backups.

import { getStore } from "@netlify/blobs";

// --- Config from environment (fallback to VITE_ versions for JSONBin) ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
let GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY || process.env.VITE_JSONBIN_MASTER_KEY;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || process.env.VITE_JSONBIN_BIN_ID;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BACKUP_ALERT_EMAIL = process.env.BACKUP_ALERT_EMAIL || "benjamin.fetu@amarillosearch.com";
const MAX_SNAPSHOTS = 7;
const DRIVE_FOLDER_NAME = "Amarillo DSI Profile — Backups";

// --- Helper: retry with exponential backoff ---
async function withRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retry ${attempt}/${maxAttempts} after ${delay}ms:`, err.message);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// --- Google OAuth2: exchange refresh token for access token ---
async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed (${res.status}): ${txt}`);
  }
  const data = await res.json();
  return data.access_token;
}

// --- Read full data from JSONBin ---
async function readJSONBin() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
    headers: { "X-Master-Key": JSONBIN_MASTER_KEY },
  });
  if (!res.ok) {
    throw new Error(`JSONBin read failed (${res.status})`);
  }
  const data = await res.json();
  return data.record;
}

// --- Upload snapshot to Google Drive ---
async function uploadToDrive(accessToken, snapshot, fileName) {
  const metadata = {
    name: fileName,
    mimeType: "application/json",
    parents: [GOOGLE_DRIVE_FOLDER_ID],
  };
  const boundary = "===scheduled_backup===";
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(snapshot)}\r\n` +
    `--${boundary}--`;

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Drive upload failed (${res.status}): ${txt}`);
  }
  return res.json();
}

// --- Auto-create Drive folder if none configured ---
async function ensureDriveFolder(accessToken) {
  if (GOOGLE_DRIVE_FOLDER_ID) return GOOGLE_DRIVE_FOLDER_ID;

  // Search for existing folder by name
  const q = encodeURIComponent(`name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!searchRes.ok) {
    const searchBody = await searchRes.text().catch(() => "");
    console.error(`Drive folder search failed (${searchRes.status}): ${searchBody}`);
    // If it's an auth error (401/403), throw immediately — no point trying to create
    if (searchRes.status === 401 || searchRes.status === 403) {
      throw new Error(
        `Drive API access denied (${searchRes.status}). Le refresh token a probablement expire. ` +
        `Pour les apps Google en mode "test", les tokens expirent apres 7 jours. ` +
        `Regenerez le GOOGLE_REFRESH_TOKEN ou passez l'app en mode "production" dans la Google Cloud Console. ` +
        `Detail: ${searchBody}`
      );
    }
  } else {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      GOOGLE_DRIVE_FOLDER_ID = searchData.files[0].id;
      console.log(`Found existing Drive folder: ${GOOGLE_DRIVE_FOLDER_ID}`);
      return GOOGLE_DRIVE_FOLDER_ID;
    }
  }

  // Create new folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  if (!createRes.ok) {
    const createBody = await createRes.text().catch(() => "");
    console.error(`Drive folder creation failed (${createRes.status}): ${createBody}`);
    if (createRes.status === 401 || createRes.status === 403) {
      throw new Error(
        `Drive API access denied (${createRes.status}). Le refresh token a probablement expire. ` +
        `Pour les apps Google en mode "test", les tokens expirent apres 7 jours. ` +
        `Regenerez le GOOGLE_REFRESH_TOKEN ou passez l'app en mode "production" dans la Google Cloud Console. ` +
        `Detail: ${createBody}`
      );
    }
    throw new Error(`Failed to create Drive folder (${createRes.status}): ${createBody}`);
  }
  const folder = await createRes.json();
  GOOGLE_DRIVE_FOLDER_ID = folder.id;
  console.log(`Created Drive folder: ${GOOGLE_DRIVE_FOLDER_ID}`);
  return GOOGLE_DRIVE_FOLDER_ID;
}

// --- List files in Drive folder ---
async function listDriveFiles(accessToken) {
  const q = encodeURIComponent(`'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&fields=files(id,name,createdTime)&pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Drive list failed (${res.status})`);
  const data = await res.json();
  return data.files || [];
}

// --- Delete file from Drive ---
async function deleteDriveFile(accessToken, fileId) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// --- Send alert email via Resend ---
async function sendAlertEmail(errorMessage) {
  if (!RESEND_API_KEY || !BACKUP_ALERT_EMAIL) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Amarillo DSI Profile <profiling@amarillosearch.com>",
        to: [BACKUP_ALERT_EMAIL],
        subject: "[ALERTE] Echec backup automatique — DSI Profile",
        html: `
          <div style="font-family:sans-serif;padding:20px;">
            <h2 style="color:#e74c3c;">Echec du backup automatique</h2>
            <p><strong>Application :</strong> Amarillo DSI Profile</p>
            <p><strong>Date :</strong> ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>
            <p><strong>Erreur :</strong></p>
            <pre style="background:#f5f5f5;padding:12px;border-radius:4px;color:#333;">${errorMessage}</pre>
            <p style="color:#888;font-size:12px;margin-top:24px;">
              Verifiez les variables d'environnement Google (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_DRIVE_FOLDER_ID) dans le dashboard Netlify.
            </p>
          </div>
        `,
      }),
    });
  } catch (e) {
    console.error("Failed to send alert email:", e);
  }
}

// --- Write backup status to Netlify Blobs ---
async function writeBackupStatus(status) {
  try {
    const store = getStore("dsi-profile-data");
    await store.setJSON("_backup_status", status);
  } catch (e) {
    console.error("Failed to write backup status:", e);
  }
}

// --- Main handler ---
async function backupHandler() {
  const startTime = Date.now();
  console.log("Scheduled backup started at", new Date().toISOString());

  // Check required config (GOOGLE_DRIVE_FOLDER_ID is optional — auto-created if missing)
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    console.log("Google Drive not configured, skipping backup.");
    await writeBackupStatus({
      last_run: new Date().toISOString(),
      result: "skipped",
      error: "Google Drive non configure (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REFRESH_TOKEN manquant)",
    });
    return { statusCode: 200, body: JSON.stringify({ status: "skipped", reason: "Google Drive not configured" }) };
  }

  if (!JSONBIN_MASTER_KEY || !JSONBIN_BIN_ID) {
    const msg = "JSONBIN_MASTER_KEY ou JSONBIN_BIN_ID manquant";
    console.error(msg);
    await writeBackupStatus({ last_run: new Date().toISOString(), result: "error", error: msg });
    await sendAlertEmail(msg);
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }

  try {
    // 1. Get Google access token
    const accessToken = await withRetry(getAccessToken);

    // 1b. Ensure Drive folder exists (auto-create if GOOGLE_DRIVE_FOLDER_ID not set)
    await ensureDriveFolder(accessToken);

    // 2. Read JSONBin data
    const record = await withRetry(readJSONBin);
    const sessionCount = (record.index || []).length;
    console.log(`Data read: ${sessionCount} sessions`);

    // 3. Create snapshot
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fileName = `dsi-profile-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}h${pad(now.getMinutes())}.json`;
    const snapshot = {
      type: "auto",
      timestamp: now.toISOString(),
      version: "1.0",
      appName: "amarillo-dsi-profile",
      sessionCount,
      data: record,
    };

    // 4. Upload to Drive
    const uploaded = await withRetry(() => uploadToDrive(accessToken, snapshot, fileName));
    console.log(`Uploaded: ${fileName} (id: ${uploaded.id})`);

    // 5. Rotate old backups (keep max MAX_SNAPSHOTS)
    try {
      const files = await listDriveFiles(accessToken);
      if (files.length > MAX_SNAPSHOTS) {
        const toDelete = files.slice(MAX_SNAPSHOTS);
        for (const f of toDelete) {
          await deleteDriveFile(accessToken, f.id);
          console.log(`Deleted old backup: ${f.name}`);
        }
      }
    } catch (rotErr) {
      console.error("Rotation error (non-fatal):", rotErr.message);
    }

    // 6. Write success status
    const duration = Date.now() - startTime;
    await writeBackupStatus({
      last_run: now.toISOString(),
      last_success: now.toISOString(),
      result: "success",
      error: null,
      session_count: sessionCount,
      drive_file: uploaded.id,
      drive_filename: fileName,
      drive_folder_id: GOOGLE_DRIVE_FOLDER_ID,
      duration_ms: duration,
    });

    console.log(`Backup completed in ${duration}ms`);
    return { statusCode: 200, body: JSON.stringify({ status: "success", file: fileName, sessions: sessionCount }) };

  } catch (err) {
    console.error("Backup failed:", err);
    await writeBackupStatus({
      last_run: new Date().toISOString(),
      result: "error",
      error: err.message,
    });
    await sendAlertEmail(err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

// Schedule is defined in netlify.toml: [functions."scheduled-backup"] schedule = "0 3 * * *"
export async function handler(event) {
  return backupHandler();
}
