// Netlify Function — Send results email via Resend API
// Environment variable: RESEND_API_KEY (set in Netlify dashboard)

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing API key" }) };
  }

  try {
    const { to, candidateName, profileType, globalScore, resultsCode } = JSON.parse(event.body);

    if (!to || !candidateName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const siteUrl = process.env.URL || "https://amarillo-dsi-profile.netlify.app";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#0a0b0e; font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:40px 24px;">

    <div style="text-align:center; margin-bottom:32px;">
      <div style="font-size:12px; letter-spacing:4px; color:#E8A838; text-transform:uppercase; margin-bottom:8px;">Amarillo Search</div>
      <h1 style="font-size:28px; color:#f0f0f0; margin:0 0 8px;">DSI Profile™</h1>
      <p style="color:#888; font-size:14px; margin:0;">Résultats de votre évaluation</p>
    </div>

    <div style="background:rgba(232,168,56,0.08); border:1px solid rgba(232,168,56,0.2); border-left:4px solid #E8A838; border-radius:4px; padding:24px 28px; margin-bottom:24px;">
      <h2 style="color:#E8A838; font-size:20px; margin:0 0 8px;">${profileType}</h2>
      <p style="color:#aaa; font-size:14px; margin:0;">Score global : <strong style="color:#E8A838;">${globalScore} / 4.00</strong></p>
    </div>

    <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:24px 28px; margin-bottom:24px;">
      <p style="color:#ccc; font-size:14px; margin:0 0 4px;">Candidat : <strong style="color:#f0f0f0;">${candidateName}</strong></p>
      <p style="color:#ccc; font-size:14px; margin:0;">Code session : <strong style="color:#E8A838; letter-spacing:2px;">${resultsCode}</strong></p>
    </div>

    <div style="text-align:center; margin-bottom:32px;">
      <a href="${siteUrl}" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#E8A838,#D4912A); color:#0a0b0e; text-decoration:none; font-weight:700; font-size:14px; letter-spacing:1px; text-transform:uppercase; border-radius:4px;">
        Voir mes résultats complets
      </a>
      <p style="color:#666; font-size:12px; margin-top:12px;">Utilisez votre code <strong>${resultsCode}</strong> pour accéder à vos résultats détaillés.</p>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:24px; text-align:center;">
      <p style="color:#555; font-size:11px; letter-spacing:2px; text-transform:uppercase; margin:0;">Amarillo Search · DSI Profile™</p>
      <p style="color:#444; font-size:11px; margin:8px 0 0;">Ce rapport est confidentiel.</p>
    </div>

  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Amarillo Search <onboarding@resend.dev>",
        to: [to],
        subject: `DSI Profile™ — Résultats de ${candidateName}`,
        html: htmlBody,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return { statusCode: res.status, body: JSON.stringify({ error: data.message || "Email send failed" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: data.id }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
}
