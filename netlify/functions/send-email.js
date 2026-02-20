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

    const logoWhiteUrl = `${siteUrl}/amarillo-logo-white.png`;
    const logoDarkUrl = `${siteUrl}/amarillo-logo-dark.png`;

    // Ensure website has protocol for href (shared across all email types)
    const websiteHref = cfg.contactWebsite.startsWith("http") ? cfg.contactWebsite : `https://${cfg.contactWebsite}`;

    // === INVITATION EMAIL ===
    if (type === "invitation") {
      const { accessCode, assessmentLabel, candidateRole, invitation } = body;

      if (!accessCode) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing access code" }) };
      }

      const inv = invitation || {};
      const whatTitle = inv.what?.title || "À propos de cette évaluation";
      const whatText = inv.what?.text || "";
      const whyTitle = inv.why?.title || "Pourquoi passer cette évaluation ?";
      const whyItems = inv.why?.items || [];
      const howTitle = inv.how?.title || "Comment ça se passe ?";
      const howText = inv.how?.text || "";
      const afterText = inv.after || "";

      const whyHtml = whyItems.map(item =>
        `<li style="color:#ccc; font-size:13px; line-height:1.8;">${item}</li>`
      ).join("");

      const invitationHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#0a0b0e; font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:0;">

    <!-- Header band -->
    <div style="background:linear-gradient(135deg, #FECC02 0%, #E5B800 100%); padding:28px 40px; text-align:center;">
      <img src="${logoDarkUrl}" alt="${cfg.contactName}" style="height:36px; margin-bottom:8px;" />
      <div style="font-size:11px; letter-spacing:4px; color:#0a0b0e; text-transform:uppercase; font-weight:600;">
        Invitation — ${assessmentLabel || "Évaluation"}
      </div>
    </div>

    <div style="padding:40px 40px 32px;">

      <!-- Greeting -->
      <p style="color:#f0f0f0; font-size:16px; margin:0 0 8px;">Bonjour ${candidateName},</p>
      <p style="color:#999; font-size:14px; line-height:1.7; margin:0 0 28px;">
        Dans le cadre de votre recherche de nouveau défi, nous vous invitons à compléter l'évaluation <strong style="color:#FECC02;">${assessmentLabel || "Amarillo Profile™"}</strong>.
      </p>

      <!-- What is this assessment? -->
      ${whatText ? `
      <div style="background:rgba(254,204,2,0.06); border:1px solid rgba(254,204,2,0.15); border-radius:4px; padding:24px 28px; margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:3px; color:#FECC02; text-transform:uppercase; margin-bottom:12px; font-weight:600;">${whatTitle}</div>
        <p style="color:#ccc; font-size:13px; line-height:1.8; margin:0;">${whatText}</p>
      </div>
      ` : ""}

      <!-- Why take it? -->
      ${whyHtml ? `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:24px 28px; margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:3px; color:#52B788; text-transform:uppercase; margin-bottom:12px; font-weight:600;">${whyTitle}</div>
        <ul style="margin:0; padding-left:20px;">${whyHtml}</ul>
      </div>
      ` : ""}

      <!-- How it works -->
      ${howText ? `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:24px 28px; margin-bottom:28px;">
        <div style="font-size:11px; letter-spacing:3px; color:#888; text-transform:uppercase; margin-bottom:12px; font-weight:600;">${howTitle}</div>
        <p style="color:#ccc; font-size:13px; line-height:1.8; margin:0;">${howText}</p>
      </div>
      ` : ""}

      <!-- CTA: Access code + button -->
      <div style="text-align:center; margin-bottom:32px; padding:28px; background:rgba(254,204,2,0.04); border:1px solid rgba(254,204,2,0.1); border-radius:4px;">
        <p style="color:#999; font-size:13px; margin:0 0 16px;">Votre code d'accès personnel :</p>
        <div style="font-family:'Courier New',monospace; font-size:28px; font-weight:700; letter-spacing:6px; color:#FECC02; margin-bottom:20px;">${accessCode}</div>
        <a href="${siteUrl}" style="display:inline-block; padding:16px 40px; background:linear-gradient(135deg,#FECC02,#E5B800); color:#0a0b0e; text-decoration:none; font-weight:700; font-size:14px; letter-spacing:2px; text-transform:uppercase; border-radius:4px;">
          Commencer l'évaluation
        </a>
        <p style="color:#666; font-size:12px; margin-top:16px; line-height:1.6;">
          Cliquez sur le bouton ci-dessus, puis entrez votre code d'accès pour démarrer.
        </p>
      </div>

      <!-- After / Debrief mention -->
      ${afterText ? `
      <div style="padding:16px 20px; background:rgba(58,91,160,0.08); border:1px solid rgba(58,91,160,0.15); border-radius:4px; margin-bottom:28px;">
        <p style="color:#ccc; font-size:13px; line-height:1.7; margin:0;">
          <strong style="color:#f0f0f0;">Et après ?</strong> ${afterText}
        </p>
      </div>
      ` : ""}

      <!-- Contact block (aligned with debrief style) -->
      <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:24px;">
        <p style="color:#ccc; font-size:13px; line-height:1.8; margin:0;">
          <strong style="color:#f0f0f0;">${cfg.contactName}</strong><br>
          <span style="color:#999; font-size:12px;">Cabinet de search et d'approche directe spécialisé dans le recrutement de profils middle et top management pour des rôles à enjeu stratégique.</span><br>
          <a href="mailto:${cfg.contactEmail}" style="color:#FECC02; text-decoration:none;">${cfg.contactEmail}</a>
        </p>
      </div>

    </div>

    <!-- Footer (aligned with debrief style) -->
    <div style="background:rgba(255,255,255,0.02); padding:20px 40px; text-align:center; border-top:1px solid rgba(255,255,255,0.04);">
      <img src="${logoWhiteUrl}" alt="${cfg.contactName}" style="height:20px; margin-bottom:8px; opacity:0.4;" />
      <p style="color:#555; font-size:11px; margin:0;">${assessmentLabel || "Amarillo Profile™"} · Document confidentiel</p>
    </div>

  </div>
</body>
</html>`;

      const invRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: `${cfg.senderName} <${cfg.senderEmail}>`,
          to: [to],
          subject: `Invitation — ${assessmentLabel || "Évaluation"} · ${candidateName}`,
          html: invitationHtml,
        }),
      });

      const invData = await invRes.json();
      if (!invRes.ok) {
        console.error("Resend invitation error:", invData);
        return { statusCode: invRes.status, body: JSON.stringify({ error: invData.message || "Invitation email failed" }) };
      }
      return { statusCode: 200, body: JSON.stringify({ success: true, id: invData.id }) };
    }

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
          `<div style="display:flex;gap:8px;padding:8px 12px;margin-bottom:4px;background:rgba(254,204,2,0.04);border:1px solid rgba(254,204,2,0.12);border-radius:3px;">
            <span style="color:#E5B800;font-weight:700;font-size:13px;flex-shrink:0;">${i + 1}.</span>
            <span style="color:#bbb;font-size:13px;line-height:1.5;">${a}</span>
          </div>`
        ).join("");
        return `
          <div style="margin-bottom:24px;padding:20px 24px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;">
            <div style="font-size:16px;font-weight:600;color:#f0f0f0;margin-bottom:4px;">${wd.icon} ${wd.name} — <span style="color:${wd.levelColor};">${wd.score}/100</span></div>
            <p style="color:#bbb;font-size:13px;line-height:1.7;margin:12px 0 16px;padding-left:8px;border-left:2px solid rgba(254,204,2,0.3);">${wd.commentary}</p>
            <div style="font-size:11px;letter-spacing:2px;color:#E5B800;text-transform:uppercase;margin-bottom:8px;font-weight:600;">Actions recommandées</div>
            ${actionsHtml}
          </div>`;
      }).join("");

      const debriefHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#0a0b0e; font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:0;">
    <div style="background:#0a0b0e; padding:28px 40px; text-align:center; border-bottom:3px solid #FECC02;">
      <img src="${logoWhiteUrl}" alt="${cfg.contactName}" style="height:36px; margin-bottom:10px;" />
      <div style="font-size:11px; letter-spacing:4px; color:#FECC02; text-transform:uppercase; font-weight:600;">Debriefing DSI Profile™</div>
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
      <div style="font-size:11px; letter-spacing:3px; color:#E5B800; text-transform:uppercase; margin-bottom:16px; font-weight:600;">Axes de développement</div>
      ${dimsHtml}` : ""}

      ${conclusion ? `
      <div style="padding:20px 24px; background:rgba(254,204,2,0.04); border:1px solid rgba(254,204,2,0.12); border-radius:4px; margin-bottom:24px;">
        <div style="font-size:11px; letter-spacing:2px; color:#E5B800; text-transform:uppercase; margin-bottom:8px; font-weight:600;">En résumé</div>
        <p style="color:#ccc; font-size:13px; line-height:1.7; margin:0;">${conclusion}</p>
      </div>` : ""}

      <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:24px;">
        <p style="color:#ccc; font-size:13px; line-height:1.8; margin:0;">
          <strong style="color:#f0f0f0;">${cfg.contactName}</strong><br>
          <span style="color:#999; font-size:12px;">Cabinet de search et d'approche directe spécialisé dans le recrutement de profils middle et top management pour des rôles à enjeu stratégique.</span><br>
          <a href="mailto:${cfg.contactEmail}" style="color:#FECC02; text-decoration:none;">${cfg.contactEmail}</a>
        </p>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.02); padding:20px 40px; text-align:center; border-top:1px solid rgba(255,255,255,0.04);">
      <img src="${logoWhiteUrl}" alt="${cfg.contactName}" style="height:20px; margin-bottom:8px; opacity:0.4;" />
      <p style="color:#555; font-size:11px; margin:0;">DSI Profile™ · Document confidentiel</p>
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

    // === ADMIN NOTIFICATION EMAIL ===
    if (type === "admin-notification") {
      const { accessCode, assessmentLabel, candidateRole, completionTime, totalTimeMs } = body;

      const totalMinutes = totalTimeMs ? Math.round(totalTimeMs / 60000) : null;
      const timeStr = totalMinutes ? `${totalMinutes} min` : "N/A";
      const dateStr = completionTime
        ? new Date(completionTime).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" })
        : "N/A";

      const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#0a0b0e; font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:0;">
    <div style="background:#0a0b0e; padding:28px 40px; text-align:center; border-bottom:3px solid #52B788;">
      <img src="${logoWhiteUrl}" alt="${cfg.contactName}" style="height:36px; margin-bottom:10px;" />
      <div style="font-size:11px; letter-spacing:4px; color:#52B788; text-transform:uppercase; font-weight:600;">Test terminé</div>
    </div>
    <div style="padding:36px 40px 28px;">
      <p style="color:#f0f0f0; font-size:16px; margin:0 0 24px;">Un candidat vient de terminer son évaluation.</p>
      <div style="background:rgba(82,183,136,0.06); border:1px solid rgba(82,183,136,0.15); border-radius:4px; padding:24px 28px; margin-bottom:24px;">
        <div style="margin-bottom:12px;">
          <span style="font-size:11px; letter-spacing:2px; color:#888; text-transform:uppercase;">Candidat</span><br/>
          <span style="font-size:18px; font-weight:600; color:#f0f0f0;">${candidateName}</span>
        </div>
        ${candidateRole ? `<div style="margin-bottom:12px;">
          <span style="font-size:11px; letter-spacing:2px; color:#888; text-transform:uppercase;">Poste</span><br/>
          <span style="font-size:14px; color:#ccc;">${candidateRole}</span>
        </div>` : ""}
        <div style="margin-bottom:12px;">
          <span style="font-size:11px; letter-spacing:2px; color:#888; text-transform:uppercase;">Code session</span><br/>
          <span style="font-family:'Courier New',monospace; font-size:20px; font-weight:700; letter-spacing:4px; color:#FECC02;">${accessCode}</span>
        </div>
        <div style="margin-bottom:12px;">
          <span style="font-size:11px; letter-spacing:2px; color:#888; text-transform:uppercase;">Évaluation</span><br/>
          <span style="font-size:13px; color:#ccc;">${assessmentLabel || "DSI Profile"}</span>
        </div>
        <div>
          <span style="font-size:11px; letter-spacing:2px; color:#888; text-transform:uppercase;">Durée</span><br/>
          <span style="font-size:13px; color:#ccc;">${timeStr}</span>
        </div>
      </div>
      <div style="text-align:center; margin-bottom:24px;">
        <a href="${siteUrl}" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#FECC02,#E5B800); color:#0a0b0e; text-decoration:none; font-weight:700; font-size:13px; letter-spacing:2px; text-transform:uppercase; border-radius:4px;">Voir les résultats</a>
      </div>
      <p style="color:#666; font-size:12px; text-align:center;">Complétée le ${dateStr}</p>
    </div>
    <div style="background:rgba(255,255,255,0.02); padding:20px 40px; text-align:center; border-top:1px solid rgba(255,255,255,0.04);">
      <img src="${logoWhiteUrl}" alt="${cfg.contactName}" style="height:20px; margin-bottom:8px; opacity:0.4;" />
      <p style="color:#555; font-size:11px; margin:0;">${assessmentLabel || "Amarillo Profile"} · Notification admin</p>
    </div>
  </div>
</body>
</html>`;

      const adminRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: `${cfg.senderName} <${cfg.senderEmail}>`,
          to: [to],
          subject: `[Notification] ${candidateName} a terminé son ${assessmentLabel || "évaluation"} (${accessCode})`,
          html: adminHtml,
        }),
      });

      const adminData = await adminRes.json();
      if (!adminRes.ok) {
        console.error("Resend admin notification error:", adminData);
        return { statusCode: adminRes.status, body: JSON.stringify({ error: adminData.message || "Admin notification email failed" }) };
      }
      return { statusCode: 200, body: JSON.stringify({ success: true, id: adminData.id }) };
    }

    // === RESULTS EMAIL (default) ===
    const { profileType, globalScore, resultsCode, topStrengths, topDevelopment } = body;

    const strengthsHtml = (topStrengths || []).map(s =>
      `<li style="color:#ccc; font-size:14px; line-height:1.8;">${s}</li>`
    ).join("");

    const developmentHtml = (topDevelopment || []).map(s =>
      `<li style="color:#ccc; font-size:14px; line-height:1.8;">${s}</li>`
    ).join("");

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#0a0b0e; font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:0;">

    <!-- Header band -->
    <div style="background:linear-gradient(135deg, #FECC02 0%, #E5B800 100%); padding:28px 40px; text-align:center;">
      <img src="${logoDarkUrl}" alt="${cfg.contactName}" style="height:36px; margin-bottom:8px;" />
      <div style="font-size:11px; letter-spacing:4px; color:#0a0b0e; text-transform:uppercase; font-weight:600;">DSI Profile™</div>
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
        <p style="color:#999; font-size:13px; margin-top:20px; line-height:1.6;">
          <a href="https://calendar.app.google/ND296BBPA6AN5FNX8" style="color:#FECC02; font-weight:600; text-decoration:underline;">Réservez un créneau</a> pour que l'on debriefe ensemble de votre test.
        </p>
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
          <span style="color:#999; font-size:12px;">Cabinet de search et d'approche directe spécialisé dans le recrutement de profils middle et top management pour des rôles à enjeu stratégique.</span><br>
          <a href="mailto:${cfg.contactEmail}" style="color:#FECC02; text-decoration:none;">${cfg.contactEmail}</a><br>
          <a href="${websiteHref}" style="color:#FECC02; text-decoration:none;">${cfg.contactWebsite}</a>
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:rgba(255,255,255,0.02); padding:24px 40px; text-align:center; border-top:1px solid rgba(255,255,255,0.04);">
      <img src="${logoDarkUrl}" alt="${cfg.contactName}" style="height:20px; margin-bottom:8px; opacity:0.3;" />
      <p style="color:#444; font-size:11px; margin:0;">DSI Profile™ · Ce rapport est strictement confidentiel.</p>
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
