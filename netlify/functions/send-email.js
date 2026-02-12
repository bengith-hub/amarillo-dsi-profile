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
    const { to, candidateName, profileType, globalScore, resultsCode, topStrengths, topDevelopment, emailConfig } = JSON.parse(event.body);

    if (!to || !candidateName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    // Dynamic config with defaults
    const cfg = {
      senderName: "Amarillo Search — Profiling",
      senderEmail: "profiling@amarillosearch.com",
      contactName: "Amarillo Search",
      contactDesc: "Cabinet de recrutement spécialisé IT & Digital",
      contactEmail: "profiling@amarillosearch.com",
      contactWebsite: "www.amarillosearch.com",
      greeting: "Merci d'avoir complété votre évaluation DSI Profile™. Voici un récapitulatif de vos résultats. Vous trouverez ci-dessous votre profil identifié ainsi que votre score global.",
      ...(emailConfig || {}),
    };

    const siteUrl = process.env.URL || "https://amarillo-dsi-profile.netlify.app";

    const strengthsHtml = (topStrengths || []).map(s =>
      `<li style="color:#ccc; font-size:14px; line-height:1.8;">${s}</li>`
    ).join("");

    const developmentHtml = (topDevelopment || []).map(s =>
      `<li style="color:#ccc; font-size:14px; line-height:1.8;">${s}</li>`
    ).join("");

    // Ensure website has protocol for href
    const websiteHref = cfg.contactWebsite.startsWith("http") ? cfg.contactWebsite : `https://${cfg.contactWebsite}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#0a0b0e; font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:0;">

    <!-- Header band -->
    <div style="background:linear-gradient(135deg, #FECC02 0%, #E5B800 100%); padding:32px 40px; text-align:center;">
      <div style="font-size:11px; letter-spacing:6px; color:#0a0b0e; text-transform:uppercase; font-weight:700; margin-bottom:4px;">${cfg.contactName}</div>
      <div style="font-size:22px; color:#0a0b0e; font-weight:700; letter-spacing:1px;">DSI Profile™</div>
    </div>

    <div style="padding:40px 40px 32px;">

      <!-- Greeting -->
      <p style="color:#f0f0f0; font-size:16px; margin:0 0 8px;">Bonjour ${candidateName},</p>
      <p style="color:#999; font-size:14px; line-height:1.7; margin:0 0 32px;">
        ${cfg.greeting}
      </p>

      <!-- Profile card -->
      <div style="background:rgba(254,204,2,0.06); border:1px solid rgba(254,204,2,0.15); border-radius:4px; padding:28px 32px; margin-bottom:24px;">
        <div style="font-size:11px; letter-spacing:3px; color:#FECC02; text-transform:uppercase; margin-bottom:12px; font-weight:600;">Votre profil</div>
        <h2 style="color:#f0f0f0; font-size:22px; margin:0 0 16px; font-weight:600;">${profileType}</h2>
        <div style="display:inline-block; background:#FECC02; color:#0a0b0e; padding:8px 20px; border-radius:2px; font-size:14px; font-weight:700; letter-spacing:1px;">
          Score global : ${globalScore} / 100
        </div>
      </div>

      <!-- Strengths -->
      ${strengthsHtml ? `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:24px 28px; margin-bottom:16px;">
        <div style="font-size:11px; letter-spacing:3px; color:#52B788; text-transform:uppercase; margin-bottom:12px; font-weight:600;">Points forts identifiés</div>
        <ul style="margin:0; padding-left:20px;">${strengthsHtml}</ul>
      </div>
      ` : ""}

      <!-- Development -->
      ${developmentHtml ? `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:24px 28px; margin-bottom:32px;">
        <div style="font-size:11px; letter-spacing:3px; color:#E8A838; text-transform:uppercase; margin-bottom:12px; font-weight:600;">Axes de développement</div>
        <ul style="margin:0; padding-left:20px;">${developmentHtml}</ul>
      </div>
      ` : ""}

      <!-- CTA -->
      <div style="text-align:center; margin-bottom:32px;">
        <p style="color:#999; font-size:13px; margin:0 0 16px;">Accédez à votre rapport détaillé avec l'ensemble de vos scores dimensionnels :</p>
        <a href="${siteUrl}" style="display:inline-block; padding:16px 40px; background:linear-gradient(135deg,#FECC02,#E5B800); color:#0a0b0e; text-decoration:none; font-weight:700; font-size:14px; letter-spacing:2px; text-transform:uppercase; border-radius:4px;">
          Consulter mon rapport complet
        </a>
        <p style="color:#666; font-size:12px; margin-top:16px;">Code d'accès : <strong style="color:#FECC02; letter-spacing:2px;">${resultsCode}</strong></p>
      </div>

      <!-- Divider -->
      <div style="border-top:1px solid rgba(255,255,255,0.06); margin-bottom:32px;"></div>

      <!-- Contact block -->
      <div style="background:rgba(254,204,2,0.04); border:1px solid rgba(254,204,2,0.1); border-radius:4px; padding:24px 28px; margin-bottom:32px;">
        <div style="font-size:11px; letter-spacing:3px; color:#FECC02; text-transform:uppercase; margin-bottom:12px; font-weight:600;">Une question ? Contactez-nous</div>
        <p style="color:#ccc; font-size:14px; line-height:1.8; margin:0;">
          <strong style="color:#f0f0f0;">${cfg.contactName}</strong><br>
          ${cfg.contactDesc}<br>
          <a href="mailto:${cfg.contactEmail}" style="color:#FECC02; text-decoration:none;">${cfg.contactEmail}</a><br>
          <a href="${websiteHref}" style="color:#FECC02; text-decoration:none;">${cfg.contactWebsite}</a>
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:rgba(255,255,255,0.02); padding:24px 40px; text-align:center; border-top:1px solid rgba(255,255,255,0.04);">
      <p style="color:#555; font-size:11px; letter-spacing:2px; text-transform:uppercase; margin:0 0 8px;">${cfg.contactName} · DSI Profile™</p>
      <p style="color:#444; font-size:11px; margin:0;">Ce rapport est strictement confidentiel et destiné uniquement au candidat évalué.</p>
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
        from: `${cfg.senderName} <${cfg.senderEmail}>`,
        to: [to],
        subject: `Vos résultats DSI Profile™ — ${candidateName}`,
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
