// Netlify Function — Expose Google config to frontend
// Returns the Google Client ID and Drive Folder ID from env vars
// or from Netlify Blobs (auto-created folder ID stored by scheduled-backup).

import { getStore } from "@netlify/blobs";

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

  // If no folder ID in env, check if the scheduled backup auto-created one
  if (!driveFolderId) {
    try {
      const store = getStore("dsi-profile-data");
      const status = await store.get("_backup_status", { type: "json" });
      if (status && status.drive_folder_id) {
        driveFolderId = status.drive_folder_id;
      }
    } catch (_) {}
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      googleClientId: process.env.GOOGLE_CLIENT_ID || "",
      driveFolderId,
    }),
  };
}
