// Netlify Function — Blob storage for backup status
// Mirrors the ATS store pattern: GET/PUT entity data in Netlify Blobs

import { getStore } from "@netlify/blobs";

export async function handler(event) {
  const entity = new URL(event.rawUrl || `https://x.x${event.path}?${event.rawQuery || ""}`).searchParams.get("entity");

  if (!entity) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing ?entity= param" }) };
  }

  const store = getStore("dsi-profile-data");

  // GET — read entity
  if (event.httpMethod === "GET") {
    try {
      const data = await store.get(entity, { type: "json" });
      if (data === null) {
        return { statusCode: 200, body: JSON.stringify(null) };
      }
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
    } catch (err) {
      console.error("Store GET error:", err);
      return { statusCode: 500, body: JSON.stringify({ error: "Read failed" }) };
    }
  }

  // PUT — write entity
  if (event.httpMethod === "PUT") {
    try {
      const data = JSON.parse(event.body);
      await store.setJSON(entity, data);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (err) {
      console.error("Store PUT error:", err);
      return { statusCode: 500, body: JSON.stringify({ error: "Write failed" }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
}
