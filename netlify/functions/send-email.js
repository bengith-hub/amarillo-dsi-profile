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
    const body = JSON.parse(event.body);
    const { to, candidateName, emailConfig, type } = body;

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

    // === DEBRIEF EMAIL ===
    if (type === "debrief") {
      const { profileType, globalScore, strongPoints, weakDimensions, paradoxes, conclusion } = body;

      const strongHtml = (strongPoints || []).map(s =>
        `<span style="display:inline-block;padding:4px 12px;margin:3px;background:rgba(82,183,136,0.1);border:1px solid rgba(82,183,136,0.25);border-radius:3px;font-size:13px;color:#52B788;">${s}</span>`
      ).join("");

      const paradoxesHtml = (paradoxes || []).map(p =>
        `<div style="padding:12px 16px;margin-bottom:8px;background:rgba(254,204,2,0.06);border:1px solid rgba(254,204,2,0.15);border-radius:4px;">
          <div style="font-size:11px;letter-spacing:2px;color:#FECC02;font-weight:600;margin-bottom:4px;">PARADOXE — ${p.dims}</div>
          <p style="color:#ccc;font-size:13px;line-height:1.6;margin:0;">${p.insight}</p>
        </div>`
      ).join("");

      const dimsHtml = (weakDimensions || []).map(wd => {
        const actionsHtml = (wd.actions || []).map((a, i) =>
          `<div style="display:flex;gap:8px;padding:8px 12px;margin-bottom:4px;background:rgba(58,91,160,0.06);border:1px solid rgba(58,91,160,0.12);border-radius:3px;">
            <span style="color:#3A5BA0;font-weight:700;font-size:13px;flex-shrink:0;">${i + 1}.</span>
            <span style="color:#bbb;font-size:13px;line-height:1.5;">${a}</span>
          </div>`
        ).join("");
        return `
          <div style="margin-bottom:24px;padding:20px 24px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;">
            <div style="font-size:16px;font-weight:600;color:#f0f0f0;margin-bottom:4px;">${wd.icon} ${wd.name} — <span style="color:${wd.levelColor};">${wd.score}/100</span></div>
            <p style="color:#bbb;font-size:13px;line-height:1.7;margin:12px 0 16px;padding-left:8px;border-left:2px solid rgba(58,91,160,0.3);">${wd.commentary}</p>
            <div style="font-size:11px;letter-spacing:2px;color:#3A5BA0;text-transform:uppercase;margin-bottom:8px;font-weight:600;">Actions recommandées</div>
            ${actionsHtml}
          </div>`;
      }).join("");

      const debriefHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#0a0b0e; font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:0;">
    <div style="background:linear-gradient(135deg, #3A5BA0 0%, #2D4A8A 100%); padding:28px 40px; text-align:center;">
      <div style="font-size:11px; letter-spacing:6px; color:rgba(255,255,255,0.7); text-transform:uppercase; font-weight:600; margin-bottom:4px;">${cfg.contactName}</div>
      <div style="font-size:20px; color:#fff; font-weight:700; letter-spacing:1px;">Debriefing DSI Profile™</div>
    </div>
    <div style="padding:36px 40px 28px;">
      <p style="color:#f0f0f0; font-size:16px; margin:0 0 8px;">Bonjour ${candidateName},</p>
      <p style="color:#999; font-size:14px; line-height:1.7; margin:0 0 24px;">
        Suite à notre échange, voici la synthèse de votre debriefing DSI Profile™. Ce document reprend les points clés abordés ainsi que les recommandations de développement.
      </p>

      <div style="background:rgba(254,204,2,0.06); border:1px solid rgba(254,204,2,0.15); border-radius:4px; padding:20px 24px; margin-bottom:24px;">
        <div style="font-size:11px; letter-spacing:3px; color:#FECC02; text-transform:uppercase; margin-bottom:8px; font-weight:600;">Votre profil</div>
        <div style="font-size:18px; color:#f0f0f0; font-weight:600; margin-bottom:8px;">${profileType || ""}</div>
        <div style="display:inline-block; background:#FECC02; color:#0a0b0e; padding:6px 16px; border-radius:2px; font-size:13px; font-weight:700;">Score global : ${globalScore || 0} / 100</div>
      </div>

      ${strongHtml ? `
      <div style="margin-bottom:24px;">
        <div style="font-size:11px; letter-spacing:3px; color:#52B788; text-transform:uppercase; margin-bottom:10px; font-weight:600;">Vos points forts</div>
        <div>${strongHtml}</div>
      </div>` : ""}

      ${paradoxesHtml ? `<div style="margin-bottom:24px;">${paradoxesHtml}</div>` : ""}

      ${dimsHtml ? `
      <div style="font-size:11px; letter-spacing:3px; color:#3A5BA0; text-transform:uppercase; margin-bottom:16px; font-weight:600;">Axes de développement</div>
      ${dimsHtml}` : ""}

      ${conclusion ? `
      <div style="padding:20px 24px; background:rgba(58,91,160,0.06); border:1px solid rgba(58,91,160,0.15); border-radius:4px; margin-bottom:24px;">
        <div style="font-size:11px; letter-spacing:2px; color:#3A5BA0; text-transform:uppercase; margin-bottom:8px; font-weight:600;">En résumé</div>
        <p style="color:#ccc; font-size:13px; line-height:1.7; margin:0;">${conclusion}</p>
      </div>` : ""}

      <div style="text-align:center; margin-bottom:28px;">
        <a href="https://calendar.app.google/ND296BBPA6AN5FNX8" style="display:inline-block; padding:14px 36px; background:linear-gradient(135deg,#3A5BA0,#2D4A8A); color:#fff; text-decoration:none; font-weight:700; font-size:13px; letter-spacing:2px; text-transform:uppercase; border-radius:4px;">
          Réserver un suivi
        </a>
      </div>

      <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:24px;">
        <p style="color:#ccc; font-size:13px; line-height:1.8; margin:0;">
          <strong style="color:#f0f0f0;">${cfg.contactName}</strong><br>
          ${cfg.contactDesc}<br>
          <a href="mailto:${cfg.contactEmail}" style="color:#FECC02; text-decoration:none;">${cfg.contactEmail}</a>
        </p>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.02); padding:20px 40px; text-align:center; border-top:1px solid rgba(255,255,255,0.04);">
      <p style="color:#555; font-size:11px; margin:0;">${cfg.contactName} · DSI Profile™ · Document confidentiel</p>
    </div>
  </div>
</body>
</html>`;

      const debriefRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: `${cfg.senderName} <${cfg.senderEmail}>`,
          to: [to],
          subject: `Debriefing DSI Profile™ — ${candidateName}`,
          html: debriefHtml,
        }),
      });

      const debriefData = await debriefRes.json();
      if (!debriefRes.ok) {
        console.error("Resend debrief error:", debriefData);
        return { statusCode: debriefRes.status, body: JSON.stringify({ error: debriefData.message || "Debrief email failed" }) };
      }
      return { statusCode: 200, body: JSON.stringify({ success: true, id: debriefData.id }) };
    }

    // === RESULTS EMAIL (default) ===
    const { profileType, globalScore, resultsCode, topStrengths, topDevelopment } = body;

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

      <!-- Methodology explanation -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:24px 28px; margin-bottom:24px;">
        <div style="font-size:11px; letter-spacing:3px; color:#888; text-transform:uppercase; margin-bottom:12px; font-weight:600;">À propos de cette évaluation</div>
        <p style="color:#999; font-size:12px; line-height:1.8; margin:0;">
          Le DSI Profile™ est un outil d'évaluation comportementale conçu pour cartographier les compétences managériales des dirigeants IT. Fondé sur le Competing Values Framework (Quinn &amp; Rohrbaugh), la théorie du leadership transformationnel (Bass &amp; Avolio) et les référentiels de maturité IT (COBIT, CMMI), il évalue 12 dimensions regroupées en 3 piliers : Leadership &amp; Influence, Excellence Opérationnelle et Innovation &amp; Posture. Le candidat répond à des mises en situation professionnelles (Situational Judgment Test) en classant 4 options de la plus à la moins représentative de son approche. Ce format à choix forcé, reconnu pour sa validité prédictive, réduit les biais de désirabilité sociale. Les scores sont normalisés sur une échelle de 0 à 100. Cet outil est un instrument d'aide au recrutement et de développement professionnel.
        </p>
      </div>

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
