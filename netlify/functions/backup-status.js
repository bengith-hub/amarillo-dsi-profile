// Netlify Function — Expose Google config to frontend
// Returns the Google Client ID and Drive Folder ID from env vars
// so the frontend can initiate OAuth without hardcoding credentials.

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      googleClientId: process.env.GOOGLE_CLIENT_ID || "",
      driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || "",
    }),
  };
}
