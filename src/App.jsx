import { useState, useEffect, useCallback, useRef } from "react";
import amarilloLogoWhite from "./assets/amarillo-logo-white.png";
import amarilloLogoDark from "./assets/amarillo-logo-dark.png";
import ASSESSMENTS, { DEFAULT_ASSESSMENT } from "./assessments";

// ============================================================
// AMARILLO PROFILE™ v4
// Multi-assessment platform: Admin + Candidate + JSONBin
// Deploy on: GitHub + Netlify + JSONBin.io
// ============================================================

// --- CONFIGURATION (from environment variables) ---
const JSONBIN_BASE = "https://api.jsonbin.io/v3";
const JSONBIN_MASTER_KEY = import.meta.env.VITE_JSONBIN_MASTER_KEY;
const JSONBIN_BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "amarillo2025";

// --- ASSESSMENT HELPER ---
function getAssessment(type) {
  return ASSESSMENTS[type] || ASSESSMENTS[DEFAULT_ASSESSMENT];
}

// Default assessment for pages that don't have a session yet
const defaultAssmt = getAssessment(DEFAULT_ASSESSMENT);

// --- UTILS ---
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "AMA-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function selectQuestions(format, assessment) {
  const fmt = assessment.formats[format];
  const perDim = fmt.questionsPerDim;
  const selected = [];

  // 1. Standard dimension questions
  assessment.dimensions.forEach((dim) => {
    const dimQs = assessment.questions.filter((q) => q.dim === dim.id).sort((a, b) => a.order - b.order);
    selected.push(...dimQs.slice(0, perDim));
  });

  // 2. Mirror questions (for coherence index)
  if (assessment.mirrorQuestions) {
    const mirrorCount = fmt.mirrorCount || 0;
    const mirrors = [...assessment.mirrorQuestions];
    // Shuffle then take mirrorCount
    for (let i = mirrors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mirrors[i], mirrors[j]] = [mirrors[j], mirrors[i]];
    }
    selected.push(...mirrors.slice(0, mirrorCount));
  }

  // 3. Desirability questions (for social desirability scale)
  if (assessment.desirabilityQuestions) {
    const desCount = fmt.desirabilityCount || 0;
    const desQs = [...assessment.desirabilityQuestions];
    for (let i = desQs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [desQs[i], desQs[j]] = [desQs[j], desQs[i]];
    }
    selected.push(...desQs.slice(0, desCount));
  }

  // 4. Shuffle all questions together
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  return selected;
}

// --- JSONBin API ---
async function readBin() {
  const res = await fetch(`${JSONBIN_BASE}/b/${JSONBIN_BIN_ID}/latest`, {
    headers: { "X-Master-Key": JSONBIN_MASTER_KEY }
  });
  const data = await res.json();
  return data.record;
}

async function updateBin(record) {
  const res = await fetch(`${JSONBIN_BASE}/b/${JSONBIN_BIN_ID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_MASTER_KEY
    },
    body: JSON.stringify(record)
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`JSONBin ${res.status}: ${msg || res.statusText}`);
  }
}

async function saveSession(session) {
  try {
    const record = await readBin();
    record.sessions[session.code] = session;
    const idx = record.index.findIndex(s => s.code === session.code);
    const summary = {
      code: session.code,
      name: session.candidateName,
      role: session.candidateRole,
      format: session.format,
      assessmentType: session.assessmentType || DEFAULT_ASSESSMENT,
      status: session.status,
      email: session.candidateEmail || "",
      createdAt: session.createdAt,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) record.index[idx] = summary;
    else record.index.push(summary);
    await updateBin(record);
    return true;
  } catch (e) {
    console.error("Save error:", e);
    return false;
  }
}

async function loadSession(code) {
  try {
    const record = await readBin();
    return record.sessions[code] || null;
  } catch (e) {
    return null;
  }
}

async function loadAllSessions() {
  try {
    const record = await readBin();
    return record.index || [];
  } catch (e) {
    return [];
  }
}

// --- COMPONENTS ---
const RANK_WEIGHTS = [1.0, 0.50, 0.15, 0.0];

// Scoring normalization constants (based on RANK_WEIGHTS with scores [1,2,3,4])
const WEIGHT_SUM = RANK_WEIGHTS.reduce((a, b) => a + b, 0);
const SCORE_THEORETICAL_MIN = (1 * RANK_WEIGHTS[0] + 2 * RANK_WEIGHTS[1] + 3 * RANK_WEIGHTS[2] + 4 * RANK_WEIGHTS[3]) / WEIGHT_SUM;
const SCORE_THEORETICAL_MAX = (4 * RANK_WEIGHTS[0] + 3 * RANK_WEIGHTS[1] + 2 * RANK_WEIGHTS[2] + 1 * RANK_WEIGHTS[3]) / WEIGHT_SUM;
const SCORE_RANDOM_EXPECTED = 2.5;

function normalizeScore(raw) {
  return Math.round(Math.max(0, Math.min(100, ((raw - SCORE_THEORETICAL_MIN) / (SCORE_THEORETICAL_MAX - SCORE_THEORETICAL_MIN)) * 100)));
}

// Significance vs random: compute z-score using permutation variance
// Var[single_question] = (1/(n-1)) * Σ(w_i - w̄)² * Σ(s_j - s̄)² / (Σw)²
// where n=4, s=[1,2,3,4], w=RANK_WEIGHTS
function computeSignificance(globalScore, questionsPerDim) {
  const n = 4;
  const wMean = WEIGHT_SUM / n;
  const wVar = RANK_WEIGHTS.reduce((s, w) => s + (w - wMean) ** 2, 0);
  const sVar = [1,2,3,4].reduce((s, v) => s + (v - 2.5) ** 2, 0); // = 5.0
  const varSingle = (1 / (n - 1)) * wVar * sVar / (WEIGHT_SUM ** 2);
  const varGlobal = varSingle / (questionsPerDim * 12);
  const sigma = Math.sqrt(varGlobal);
  const zScore = sigma > 0 ? (globalScore - SCORE_RANDOM_EXPECTED) / sigma : 0;
  return { zScore, sigma };
}

function RankingCard({ question, dimColor, onComplete }) {
  const [ranked, setRanked] = useState([]);
  const [remaining, setRemaining] = useState(() => [...question.options].sort(() => Math.random() - 0.5));
  const rankLabels = ["1er — Me ressemble le plus", "2e", "3e", "4e — Me ressemble le moins"];
  const rankColors = ["#FECC02", "#b8923a", "#7a6a4a", "#4a4a4a"];

  const selectOption = (opt) => {
    const newRanked = [...ranked, opt];
    const newRemaining = remaining.filter((o) => o.id !== opt.id);
    setRanked(newRanked);
    setRemaining(newRemaining);
    if (newRanked.length === 4) setTimeout(() => onComplete(newRanked), 500);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 13, color: "#888", margin: 0, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
          Classez de la plus proche à la plus éloignée de vous
        </p>
        {ranked.length > 0 && (
          <button onClick={() => { setRemaining([...remaining, ranked[ranked.length - 1]]); setRanked(ranked.slice(0, -1)); }}
            style={{ fontSize: 12, color: "#888", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
            ← Annuler
          </button>
        )}
      </div>
      {ranked.map((opt, i) => (
        <div key={opt.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", marginBottom: 8, background: `${rankColors[i]}11`, border: `1px solid ${rankColors[i]}44`, borderRadius: 2, animation: "slideIn 0.3s ease" }}>
          <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: rankColors[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0a0b0e", fontFamily: "'DM Mono', monospace" }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.5 }}>{opt.text}</div>
            <div style={{ fontSize: 11, color: rankColors[i], marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{rankLabels[i]}</div>
          </div>
        </div>
      ))}
      {ranked.length > 0 && ranked.length < 4 && (
        <div style={{ padding: "8px 0", margin: "12px 0", borderTop: "1px dashed rgba(255,255,255,0.08)", fontSize: 12, color: "#555", textAlign: "center", fontFamily: "'DM Mono', monospace" }}>
          Sélectionnez votre {ranked.length + 1}{ranked.length === 0 ? "er" : "e"} choix
        </div>
      )}
      {remaining.map((opt) => (
        <button key={opt.id} onClick={() => selectOption(opt)}
          style={{ display: "block", width: "100%", textAlign: "left", padding: "16px 20px", marginBottom: 8, fontSize: 15, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, color: "#ccc", cursor: "pointer", transition: "all 0.2s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${dimColor}15`; e.currentTarget.style.borderColor = `${dimColor}55`; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#ccc"; }}>
          {opt.text}
        </button>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

function RadarChart({ scores, dimensions, size = 440 }) {
  const pad = 120;
  const vw = size + pad * 2;
  const c = vw / 2, r = size * 0.38, n = dimensions.length;
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return { x: c + (v / 4) * r * Math.cos(a), y: c + (v / 4) * r * Math.sin(a) }; };
  return (
    <svg viewBox={`0 0 ${vw} ${vw}`} style={{ width: "100%", maxWidth: vw, display: "block", margin: "0 auto" }}>
      {[1,2,3,4].map(l => <polygon key={l} data-radar="grid" points={dimensions.map((_,i) => { const p=pt(i,l); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
      {dimensions.map((d,i) => { const p=pt(i,4); return <line key={d.id} data-radar="radial" x1={c} y1={c} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />; })}
      <polygon data-radar="area" points={dimensions.map((d,i) => { const p=pt(i,scores[d.id]||0); return `${p.x},${p.y}`; }).join(" ")} fill="rgba(254,204,2,0.15)" stroke="#FECC02" strokeWidth="2.5" />
      {dimensions.map((d,i) => { const p=pt(i,scores[d.id]||0); return <circle key={d.id} data-radar="dot" cx={p.x} cy={p.y} r="5" fill={d.color} stroke="#fff" strokeWidth="1.5" />; })}
      {dimensions.map((d,i) => { const p=pt(i,4.9); const a=(360*i)/n-90; const isR=a>-90&&a<90; const isB=a>0&&a<180; return <text key={d.id} data-radar="label" x={p.x} y={p.y} textAnchor={Math.abs(a+90)<10||Math.abs(a-90)<10?"middle":isR?"start":"end"} dominantBaseline={isB?"hanging":"auto"} fill="#999" fontSize="11" fontFamily="'DM Sans', sans-serif">{d.icon} {d.name}</text>; })}
    </svg>
  );
}

function ScoreBar({ dimension, score }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span data-dim-label style={{ color: "#d0d0d0", fontSize: 13 }}>{dimension.icon} {dimension.name}</span>
        <span data-score-value style={{ color: dimension.color, fontWeight: 700, fontSize: 14, fontFamily: "'DM Mono', monospace" }}>{score.toFixed(2)}/4</span>
      </div>
      <div data-bar-bg style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: "100%", borderRadius: 4, width: `${(score/4)*100}%`, background: `linear-gradient(90deg, ${dimension.color}, ${dimension.color}cc)`, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function getAnalysis(scores, assessment) {
  const { dimensions, pillars, profiles } = assessment;
  const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
  const top3 = sorted.slice(0,3).map(([id]) => dimensions.find(d => d.id===id));
  const bottom3 = sorted.slice(-3).map(([id]) => dimensions.find(d => d.id===id));
  const avg = Object.values(scores).reduce((a,b) => a+b, 0) / dimensions.length;
  const ps = pillars.map((_,pi) => { const ds=dimensions.filter(d=>d.pillar===pi); return ds.reduce((s,d)=>s+(scores[d.id]||0),0)/ds.length; });

  // Weighted profile matching: compute match score for each profile
  const profileMatches = profiles.map(p => {
    const w = p.weights || [0.33, 0.34, 0.33];
    const weightedScore = ps.reduce((sum, s, i) => sum + s * w[i], 0);
    const eligible = weightedScore >= (p.minScore || 0);
    // Normalize to percentage (max possible = 4.0)
    const pct = Math.min(Math.round((weightedScore / 4.0) * 100), 100);
    return { ...p, weightedScore, eligible, pct };
  });

  // Primary profile: first eligible in priority order
  const match = profileMatches.find(p => p.eligible) || profileMatches[profileMatches.length - 1];
  // Top 3 profiles by weighted score (for display)
  const topProfiles = [...profileMatches].sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 3);

  // Normalized scores (0-100 scale)
  const avgNorm = normalizeScore(avg);
  const pillarScoresNorm = ps.map(s => normalizeScore(s));
  const scoresNorm = {};
  Object.entries(scores).forEach(([id, s]) => { scoresNorm[id] = normalizeScore(s); });

  return {
    top3, bottom3, avg, pillarScores: ps,
    profile: match.name, description: match.description,
    strengths: match.strengths, development: match.development, context: match.context,
    matchPct: match.pct,
    topProfiles,
    avgNorm, pillarScoresNorm, scoresNorm,
  };
}

function computeReliability(session, assessment) {
  if (!session || !assessment.mirrorPairs) return null;
  const answers = session.answers || {};
  const config = assessment.reliabilityConfig || {};
  const sessionQuestions = session.questions || [];

  // Build a map: for each dim, track the order of questions as they appeared in the session
  // This lets us find which answer index corresponds to a specific question order
  const dimOrderMap = {};
  sessionQuestions.forEach((q) => {
    if (!dimOrderMap[q.dim]) dimOrderMap[q.dim] = [];
    dimOrderMap[q.dim].push(q.order);
  });

  // --- Coherence index ---
  const threshold = config.coherenceThreshold || 1.5;
  const pairs = assessment.mirrorPairs.map(pair => {
    const originalScores = answers[pair.originalDim] || [];
    const mirrorScores = answers[pair.mirrorDim] || [];
    // Find the answer index for the original question with the matching order
    const orderList = dimOrderMap[pair.originalDim] || [];
    const origIdx = orderList.indexOf(pair.originalOrder);
    const origScore = origIdx >= 0 ? originalScores[origIdx] : undefined;
    const mirrorScore = mirrorScores.length > 0 ? mirrorScores[0] : undefined;
    if (origScore === undefined || mirrorScore === undefined) return null;
    const gap = Math.abs(origScore - mirrorScore);
    return { ...pair, origScore, mirrorScore, gap, coherent: gap <= threshold };
  }).filter(Boolean);

  const coherentCount = pairs.filter(p => p.coherent).length;
  const coherenceIndex = pairs.length > 0 ? Math.round((coherentCount / pairs.length) * 100) : null;
  const coherenceLevel = coherenceIndex !== null
    ? (config.coherenceLevels || []).find(l => coherenceIndex >= l.min) || { label: "—", color: "#888" }
    : { label: "—", color: "#888" };

  // --- Desirability score ---
  const desScores = answers.desirability || [];
  const desirabilityRaw = desScores.length > 0
    ? desScores.reduce((a, b) => a + b, 0) / desScores.length
    : null;
  // Invert: high raw score = low desirability (sincere), low raw score = high desirability
  // score 1 = picked the "too perfect" answer first → high desirability
  // score 4 = picked the honest/vulnerable answer first → low desirability
  // Normalize: (4 - avg) / 3 * 100 → 0% = perfectly sincere, 100% = max desirability
  const desirabilityScore = desirabilityRaw !== null
    ? Math.round(Math.max(0, Math.min(100, ((4 - desirabilityRaw) / 3) * 100)))
    : null;
  const desirabilityLevel = desirabilityScore !== null
    ? (config.desirabilityLevels || []).find(l => desirabilityScore <= l.max) || { label: "—", color: "#888" }
    : { label: "—", color: "#888" };

  return {
    coherenceIndex, coherencePairs: pairs, coherenceLevel,
    desirabilityScore, desirabilityLevel,
  };
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [view, setView] = useState("landing");
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminAssessmentType, setAdminAssessmentType] = useState(DEFAULT_ASSESSMENT);
  const [adminPwd, setAdminPwd] = useState("");
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [resumeCode, setResumeCode] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedBefore, setElapsedBefore] = useState(0);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newFormat, setNewFormat] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [seenCompletedCodes, setSeenCompletedCodes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("amarillo_seen_completed") || "[]"); } catch { return []; }
  });
  const resultsRef = useRef(null);

  // Get current assessment config (from session or default)
  const currentAssessment = getAssessment(currentSession?.assessmentType || DEFAULT_ASSESSMENT);
  const adminAssessment = getAssessment(adminAssessmentType);

  useEffect(() => { if (view === "admin") loadSessions(); }, [view]);
  useEffect(() => { if (view === "quiz") setStartTime(Date.now()); }, [view]);

  const loadSessions = async () => {
    setLoading(true);
    const s = await loadAllSessions();
    setSessions(s);
    // Compute notifications: completed sessions not yet seen
    const unseen = s.filter(sess => sess.status === "completed" && !seenCompletedCodes.includes(sess.code));
    setNotifications(unseen);
    setLoading(false);
  };

  const markNotificationSeen = (code) => {
    const updated = [...seenCompletedCodes, code];
    setSeenCompletedCodes(updated);
    localStorage.setItem("amarillo_seen_completed", JSON.stringify(updated));
    setNotifications(prev => prev.filter(n => n.code !== code));
  };

  const createSession = async () => {
    setAdminError("");
    const code = generateCode();
    const session = {
      code, candidateName: newName, candidateRole: newRole, format: newFormat,
      assessmentType: adminAssessmentType,
      status: "pending", answers: {}, currentQ: 0, createdAt: new Date().toISOString(),
      totalTimeMs: 0, questions: selectQuestions(newFormat, adminAssessment).map((q, i) => ({ ...q, idx: i })),
    };
    const ok = await saveSession(session);
    if (!ok) {
      setAdminError("Erreur lors de la sauvegarde (403). Verifiez la cle API JSONBin ou le quota du compte.");
      return;
    }
    setNewName(""); setNewRole("");
    await loadSessions();
  };

  const startQuiz = (session) => {
    setCurrentSession(session);
    setQuestions(session.questions);
    setCurrentQ(session.currentQ || 0);
    setElapsedBefore(session.totalTimeMs || 0);
    setView("quiz");
  };

  const handleResume = async () => {
    setResumeError("");
    const code = resumeCode.trim().toUpperCase();
    if (!code) { setResumeError("Veuillez entrer un code"); return; }
    setLoading(true);
    const session = await loadSession(code);
    setLoading(false);
    if (!session) { setResumeError("Code introuvable. Vérifiez et réessayez."); return; }
    if (session.status === "completed") { setCurrentSession(session); setIsAdminView(false); setView("results"); return; }
    startQuiz(session);
  };

  const handleRankComplete = async (rankedOptions) => {
    const q = questions[currentQ];
    const ws = rankedOptions.reduce((s, o, i) => s + o.score * RANK_WEIGHTS[i], 0) / RANK_WEIGHTS.reduce((a, b) => a + b, 0);
    const newAnswers = { ...currentSession.answers };
    if (!newAnswers[q.dim]) newAnswers[q.dim] = [];
    newAnswers[q.dim] = [...newAnswers[q.dim], ws];
    const elapsed = elapsedBefore + (Date.now() - startTime);
    const nextQ = currentQ + 1;
    const isLast = nextQ >= questions.length;
    const updated = { ...currentSession, answers: newAnswers, currentQ: nextQ, totalTimeMs: elapsed, status: isLast ? "completed" : "in_progress" };
    setCurrentSession(updated);

    if (nextQ % 5 === 0 || isLast) await saveSession(updated);

    setTimeout(() => {
      if (isLast) { setIsAdminView(false); setView("results"); }
      else { setCurrentQ(nextQ); }
    }, 300);
  };

  const handleSaveAndQuit = async () => {
    setSaving(true);
    const elapsed = elapsedBefore + (Date.now() - startTime);
    const updated = { ...currentSession, currentQ, totalTimeMs: elapsed, status: "in_progress" };
    await saveSession(updated);
    setSaving(false);
    setView("landing");
  };

  const computeScores = () => {
    if (!currentSession) return {};
    const scores = {};
    const DEVIATION_ALPHA = 1.0;
    currentAssessment.dimensions.forEach((dim) => {
      const arr = currentSession.answers[dim.id] || [];
      if (arr.length === 0) { scores[dim.id] = 0; return; }
      // Non-linear deviation weighting: answers far from random (2.5) count more
      let wSum = 0, wsSum = 0;
      arr.forEach(s => {
        const w = 1 + DEVIATION_ALPHA * Math.abs(s - SCORE_RANDOM_EXPECTED);
        wsSum += s * w;
        wSum += w;
      });
      scores[dim.id] = wsSum / wSum;
    });
    return scores;
  };

  const formatTime = (ms) => { const m = Math.floor(ms / 60000); const s = Math.floor((ms % 60000) / 1000); return `${m} min ${s}s`; };

  const handleDownloadPDF = async () => {
    if (!resultsRef.current) return;
    const el = resultsRef.current;
    const name = currentSession?.candidateName?.replace(/\s+/g, "_") || "Candidat";

    // --- Prepare: add pdf-mode class, hide interactive elements ---
    el.classList.add("pdf-mode");
    const hideEls = el.querySelectorAll("[data-pdf-hide], [data-pdf-hide-btns]");
    hideEls.forEach(e => e.style.display = "none");
    const footer = el.querySelector("[data-section='footer']");
    if (footer) footer.style.borderTop = "none";

    // --- Swap logos to dark version ---
    const logos = el.querySelectorAll("img[data-logo]");
    const originalSrcs = [];
    logos.forEach(img => { originalSrcs.push(img.src); img.src = amarilloLogoDark; });

    // --- Inject light-theme CSS overrides ---
    const lightCSS = `
      [data-pdf-container] { background: #ffffff !important; }
      [data-pdf-container] * { color: #333 !important; }
      [data-pdf-container] h1, [data-pdf-container] h2, [data-pdf-container] h3,
      [data-pdf-container] strong, [data-pdf-container] b {
        color: #1a1a1a !important;
      }
      [data-pdf-container] [data-section="footer"] * { color: #999 !important; }
      [data-pdf-container] [data-section="footer"] img { opacity: 0.7 !important; }

      /* Boxes: invert semi-transparent backgrounds */
      [data-pdf-container] [style*="rgba(255,255,255,0.0"] { background: rgba(0,0,0,0.02) !important; }
      [data-pdf-container] [style*="rgba(255,255,255,0.06)"] { background: rgba(0,0,0,0.04) !important; }
      [data-pdf-container] [style*="rgba(254,204,2,0.0"] { background: rgba(254,204,2,0.06) !important; }
      [data-pdf-container] [style*="rgba(82,183,136,0.0"] { background: rgba(82,183,136,0.06) !important; }
      [data-pdf-container] [style*="rgba(58,91,160,0.0"] { background: rgba(58,91,160,0.06) !important; }

      /* Borders */
      [data-pdf-container] [style*="rgba(255,255,255"] { border-color: rgba(0,0,0,0.08) !important; }
      [data-pdf-container] [style*="rgba(254,204,2,0.12)"] { border-color: rgba(254,204,2,0.25) !important; }
      [data-pdf-container] [style*="rgba(82,183,136,0.15)"] { border-color: rgba(82,183,136,0.25) !important; }
      [data-pdf-container] [style*="rgba(58,91,160,0.15)"] { border-color: rgba(58,91,160,0.25) !important; }

      /* Profile title: yellow badge with dark text */
      [data-pdf-container] [data-profile-title] {
        color: #1a1a1a !important;
        background: #FECC02 !important;
        padding: 4px 12px !important;
        border-radius: 2px !important;
        display: inline-block !important;
      }

      /* Score badge: dark bg + yellow text (keep) */
      [data-pdf-container] [data-score-badge] {
        background: #1a1a1a !important;
        color: #FECC02 !important;
      }

      /* Section headers with yellow color → dark */
      [data-pdf-container] [data-section-header="yellow"] { color: #8B7000 !important; }
      [data-pdf-container] [data-section-header="green"] { color: #2D6A4F !important; }
      [data-pdf-container] [data-section-header="blue"] { color: #3A5BA0 !important; }

      /* Score values: keep pillar colors (they work on white) */
      [data-pdf-container] [data-score-value] { color: inherit !important; }

      /* Score bar background: light gray */
      [data-pdf-container] [data-bar-bg] { background: rgba(0,0,0,0.06) !important; }

      /* Radar chart */
      [data-pdf-container] [data-radar="grid"] { stroke: rgba(0,0,0,0.1) !important; }
      [data-pdf-container] [data-radar="radial"] { stroke: rgba(0,0,0,0.06) !important; }
      [data-pdf-container] [data-radar="area"] {
        fill: rgba(254,204,2,0.12) !important;
        stroke: #C9A200 !important;
      }
      [data-pdf-container] [data-radar="dot"] { stroke: #333 !important; }
      [data-pdf-container] [data-radar="label"] { fill: #555 !important; }

      /* ScoreBar dimension labels */
      [data-pdf-container] [data-dim-label] { color: #333 !important; }

      /* Pillar score number */
      [data-pdf-container] [data-pillar-score] { color: #1a1a1a !important; }
      [data-pdf-container] [data-pillar-unit] { color: #999 !important; }

      /* Synthesis scores */
      [data-pdf-container] [data-synth-score="green"] { color: #2D6A4F !important; }
      [data-pdf-container] [data-synth-score="yellow"] { color: #8B7000 !important; }

      /* DSI Profile footer text */
      [data-pdf-container] [data-dsi-label] { color: #C9A200 !important; }
    `;
    const styleEl = document.createElement("style");
    styleEl.id = "pdf-light-theme";
    styleEl.textContent = lightCSS;
    document.head.appendChild(styleEl);

    try {
      await new Promise(r => setTimeout(r, 100));

      // Use html2pdf.js — it respects CSS page-break rules
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [16, 10, 14, 10],
        filename: `${currentAssessment.pdfPrefix}_${name}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: 880 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      const worker = html2pdf().set(opt).from(el);
      await worker.toPdf().get("pdf").then((pdf) => {
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        const totalPages = pdf.internal.getNumberOfPages();

        // Remove last page if it's essentially empty (just whitespace from padding)
        if (totalPages > 1) {
          // Always keep — we can't easily detect empty pages in jsPDF
        }

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(190, 190, 190);
          pdf.text(`${i} / ${totalPages}`, pw / 2, ph - 4, { align: "center" });
        }
      }).save();
    } catch (err) {
      console.error("PDF generation error:", err);
    }

    // --- Cleanup: restore everything ---
    styleEl.remove();
    el.classList.remove("pdf-mode");
    hideEls.forEach(e => e.style.display = "");
    if (footer) footer.style.borderTop = "";
    logos.forEach((img, idx) => { img.src = originalSrcs[idx]; });
  };

  const handleDownloadExecutivePDF = async () => {
    if (!currentSession || !currentAssessment) return;
    const scores = computeScores();
    const analysis = getAnalysis(scores, currentAssessment);
    const reliability = computeReliability(currentSession, currentAssessment);
    const fmt = currentAssessment.formats[currentSession.format] || currentAssessment.formats.standard;
    const sig = computeSignificance(analysis.avg, fmt.questionsPerDim);
    const absZ = Math.abs(sig.zScore);
    const sigLabel = absZ >= 3 ? "Hautement significatif" : absZ >= 2 ? "Significatif" : absZ >= 1 ? "Faiblement significatif" : "Non significatif";

    // Build radar SVG (light theme, compact)
    const dims = currentAssessment.dimensions;
    const n = dims.length, sz = 200, pad = 60, vw = sz + pad * 2, cx = vw / 2, r = sz * 0.38;
    const pt = (i, v) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return { x: cx + (v / 4) * r * Math.cos(a), y: cx + (v / 4) * r * Math.sin(a) }; };
    const gridPolys = [1,2,3,4].map(l => `<polygon points="${dims.map((_,i) => { const p=pt(i,l); return `${p.x},${p.y}`; }).join(" ")}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`).join("");
    const radials = dims.map((d,i) => { const p=pt(i,4); return `<line x1="${cx}" y1="${cx}" x2="${p.x}" y2="${p.y}" stroke="rgba(0,0,0,0.05)" stroke-width="1"/>`; }).join("");
    const area = `<polygon points="${dims.map((d,i) => { const p=pt(i,scores[d.id]||0); return `${p.x},${p.y}`; }).join(" ")}" fill="rgba(254,204,2,0.15)" stroke="#C9A200" stroke-width="2"/>`;
    const dots = dims.map((d,i) => { const p=pt(i,scores[d.id]||0); return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${d.color}" stroke="#fff" stroke-width="1"/>`; }).join("");
    const labels = dims.map((d,i) => { const p=pt(i,5.2); const a=(360*i)/n-90; const anch = Math.abs(a+90)<15||Math.abs(a-90)<15 ? "middle" : (a>-90&&a<90) ? "start" : "end"; const bl = (a>0&&a<180) ? "hanging" : "auto"; return `<text x="${p.x}" y="${p.y}" text-anchor="${anch}" dominant-baseline="${bl}" fill="#555" font-size="8" font-family="sans-serif">${d.icon} ${d.name}</text>`; }).join("");
    const radarSVG = `<svg viewBox="0 0 ${vw} ${vw}" width="280" height="280" xmlns="http://www.w3.org/2000/svg">${gridPolys}${radials}${area}${dots}${labels}</svg>`;

    const pillarsHTML = currentAssessment.pillars.map((p, i) =>
      `<div style="flex:1;text-align:center;padding:8px 12px;background:${p.color}0a;border:1px solid ${p.color}33;border-radius:2px">
        <div style="font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:${p.color};margin-bottom:4px;font-weight:600">${p.name}</div>
        <div style="font-size:28px;font-weight:700;color:#1a1a1a">${analysis.pillarScoresNorm[i]}</div>
        <div style="font-size:10px;color:#888">/100</div>
      </div>`
    ).join("");

    const top3HTML = analysis.top3.map(d =>
      `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:11px">
        <span style="color:#333">${d.icon} ${d.name}</span>
        <span style="color:#2D6A4F;font-weight:700;font-family:monospace">${analysis.scoresNorm[d.id]}/100</span>
      </div>`
    ).join("");

    const bottom3HTML = analysis.bottom3.map(d =>
      `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:11px">
        <span style="color:#333">${d.icon} ${d.name}</span>
        <span style="color:#8B7000;font-weight:700;font-family:monospace">${analysis.scoresNorm[d.id]}/100</span>
      </div>`
    ).join("");

    const topProfilesHTML = analysis.topProfiles.map((tp, i) =>
      `<span style="display:inline-block;padding:3px 8px;margin-right:6px;background:${i===0?'#FECC0215':'#f5f5f5'};border:1px solid ${i===0?'#FECC0244':'#e0e0e0'};border-radius:2px;font-size:10px;font-family:monospace">
        ${tp.name} ${tp.pct}%
      </span>`
    ).join("");

    // Reliability badges
    let reliabilityHTML = "";
    if (reliability) {
      const cohColor = reliability.coherenceLevel.color;
      const desColor = reliability.desirabilityLevel.color;
      const sigColor = absZ >= 3 ? "#52B788" : absZ >= 2 ? "#6A97DF" : absZ >= 1 ? "#FECC02" : "#e74c3c";
      reliabilityHTML = `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="font-size:9px;padding:3px 8px;border-radius:2px;background:${cohColor}18;color:${cohColor};font-family:monospace">
            Coherence ${reliability.coherenceIndex}% — ${reliability.coherenceLevel.label}
          </span>
          <span style="font-size:9px;padding:3px 8px;border-radius:2px;background:${desColor}18;color:${desColor};font-family:monospace">
            Desirabilite ${reliability.desirabilityScore}% — ${reliability.desirabilityLevel.label}
          </span>
          <span style="font-size:9px;padding:3px 8px;border-radius:2px;background:${sigColor}18;color:${sigColor};font-family:monospace">
            Significativite z=${sig.zScore.toFixed(1)} — ${sigLabel}
          </span>
        </div>`;
    }

    const dateStr = currentSession.createdAt ? new Date(currentSession.createdAt).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR");

    const html = `
      <div id="exec-pdf" style="width:780px;padding:28px 32px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#333;background:#fff">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #FECC02;padding-bottom:12px;margin-bottom:16px">
          <div>
            <img src="${amarilloLogoDark}" style="height:28px;margin-bottom:4px" />
            <div style="font-size:16px;font-weight:700;color:#1a1a1a">Synthese Candidat(e)</div>
          </div>
          <div style="text-align:right;font-size:10px;color:#888;font-family:monospace">
            <div>${currentSession.code}</div>
            <div>${dateStr} · ${fmt.label}</div>
            <div>Poste : ${currentSession.candidateRole || currentAssessment.defaultRole}</div>
          </div>
        </div>

        <!-- Profile + Score -->
        <div style="display:flex;gap:16px;margin-bottom:14px;align-items:center">
          <div style="flex:1">
            <div style="display:inline-block;background:#FECC02;color:#1a1a1a;padding:4px 12px;border-radius:2px;font-size:14px;font-weight:700;margin-bottom:8px">${analysis.profile}</div>
            <div style="display:flex;gap:10px;margin-bottom:8px">
              <span style="padding:4px 10px;background:#1a1a1a;color:#FECC02;border-radius:2px;font-size:12px;font-family:monospace;font-weight:700">Indice global : ${analysis.avgNorm}/100</span>
              <span style="padding:4px 10px;background:#f5f5f5;border-radius:2px;font-size:12px;font-family:monospace">Correspondance : ${analysis.matchPct}%</span>
            </div>
            <div style="font-size:10px;color:#888;margin-bottom:6px">${topProfilesHTML}</div>
          </div>
        </div>

        <!-- Pillars -->
        <div style="display:flex;gap:10px;margin-bottom:14px">
          ${pillarsHTML}
        </div>

        <!-- Radar + Synthesis side by side -->
        <div style="display:flex;gap:14px;margin-bottom:14px">
          <div style="flex:0 0 280px;text-align:center">
            ${radarSVG}
          </div>
          <div style="flex:1;display:flex;gap:10px">
            <div style="flex:1;padding:10px 12px;background:#f8fdf8;border:1px solid #d4edda;border-radius:2px">
              <div style="font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#2D6A4F;font-weight:700;margin-bottom:8px">Points forts</div>
              ${top3HTML}
            </div>
            <div style="flex:1;padding:10px 12px;background:#fffdf5;border:1px solid #ffeeba;border-radius:2px">
              <div style="font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#8B7000;font-weight:700;margin-bottom:8px">Axes de developpement</div>
              ${bottom3HTML}
            </div>
          </div>
        </div>

        <!-- Reliability -->
        <div style="padding:8px 12px;background:#fafafa;border:1px solid #eee;border-radius:2px;margin-bottom:12px">
          <div style="font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#888;font-weight:600;margin-bottom:6px">Indicateurs de fiabilite</div>
          ${reliabilityHTML}
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding-top:8px;border-top:1px solid #eee;font-size:9px;color:#aaa">
          ${currentAssessment.label} · Rapport confidentiel · ${currentSession.code}
        </div>
      </div>
    `;

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.innerHTML = html;
    document.body.appendChild(container);
    const el = container.querySelector("#exec-pdf");

    try {
      await new Promise(r => setTimeout(r, 150));
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `${currentAssessment.pdfPrefix}_SYNTHESE_${currentSession.code}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: 850 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error("Executive PDF generation error:", err);
    }
    document.body.removeChild(container);
  };

  const handleSendEmail = async () => {
    if (!candidateEmail.includes("@") || emailSending) return;
    setEmailSending(true);
    setEmailError("");
    setEmailSent(false);
    try {
      // Save email to JSONBin
      if (currentSession) {
        const updated = { ...currentSession, candidateEmail };
        setCurrentSession(updated);
        await saveSession(updated);
      }
      // Send email via Netlify Function
      const scores = computeScores();
      const analysis = getAnalysis(scores, currentAssessment);
      const res = await fetch("/.netlify/functions/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: candidateEmail,
          candidateName: currentSession.candidateName,
          profileType: analysis.profile,
          globalScore: analysis.avg.toFixed(2),
          resultsCode: currentSession.code,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setEmailSent(true);
    } catch (e) {
      setEmailError("Erreur lors de l'envoi. Réessayez plus tard.");
      console.error("Email error:", e);
    } finally {
      setEmailSending(false);
    }
  };

  const progress = questions.length > 0 ? (currentQ / questions.length) * 100 : 0;

  const box = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2 };
  const input = { width: "100%", padding: "14px 16px", fontSize: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, color: "#f0f0f0", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" };
  const btn = (active = true) => ({ padding: "14px 28px", fontSize: 14, fontFamily: "'DM Mono', monospace", fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", background: active ? "linear-gradient(135deg, #FECC02, #E5B800)" : "rgba(255,255,255,0.05)", color: active ? "#0a0b0e" : "#555", border: "none", borderRadius: 2, cursor: active ? "pointer" : "default" });
  const btnOutline = { padding: "12px 24px", fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 1, background: "transparent", color: "#888", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, cursor: "pointer" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0e", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ===== LANDING ===== */}
      {view === "landing" && (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px", textAlign: "center", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: 32, alignSelf: "center" }}>
            <img src={amarilloLogoWhite} alt="Amarillo Search" style={{ width: "clamp(220px, 50vw, 340px)", objectFit: "contain", display: "block" }} />
          </div>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #FECC02, #FEE066, #FECC02)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Amarillo Profiling
          </h1>
          <p style={{ color: "#888", fontSize: 15, marginBottom: 48, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
            Plateforme d'évaluations comportementales
          </p>

          {/* Main action: start or resume */}
          <div style={{ ...box, padding: "40px 36px", marginBottom: 24, textAlign: "center", borderTop: "2px solid #FECC02" }}>
            <label style={{ display: "block", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#FECC02", marginBottom: 6, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
              Commencer ou reprendre une évaluation
            </label>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
              Entrez votre code d'accès pour accéder à votre session
            </p>
            <div style={{ display: "flex", gap: 12, maxWidth: 400, margin: "0 auto" }}>
              <input type="text" value={resumeCode} onChange={(e) => setResumeCode(e.target.value.toUpperCase())} placeholder="AMA-XXXX" maxLength={8}
                style={{ ...input, flex: 1, fontFamily: "'DM Mono', monospace", letterSpacing: 3, textAlign: "center", fontSize: 20 }}
                onKeyDown={(e) => e.key === "Enter" && handleResume()} />
              <button onClick={handleResume} disabled={loading} style={btn(!loading)}>
                {loading ? "..." : "→"}
              </button>
            </div>
            {resumeError && <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 8 }}>{resumeError}</p>}
          </div>

          <button onClick={() => setView("adminLogin")} style={{ ...btnOutline, marginTop: 16 }}>
            Accès Administration
          </button>
        </div>
      )}

      {/* ===== ADMIN LOGIN ===== */}
      {view === "adminLogin" && (
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, marginBottom: 32, color: "#FECC02" }}>Administration</h2>
          <div style={{ ...box, padding: 32 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Mot de passe</label>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input type={showPassword ? "text" : "password"} value={adminPwd} onChange={(e) => setAdminPwd(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && adminPwd === ADMIN_PASSWORD) setView("admin"); }}
                style={{ ...input, paddingRight: 48 }} />
              <button onClick={() => setShowPassword(!showPassword)} type="button"
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <button onClick={() => { if (adminPwd === ADMIN_PASSWORD) setView("admin"); }} style={btn(adminPwd.length > 0)}>Connexion</button>
          </div>
          <button onClick={() => setView("landing")} style={{ ...btnOutline, marginTop: 24 }}>← Retour</button>
        </div>
      )}

      {/* ===== ADMIN PANEL ===== */}
      {view === "admin" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, color: "#FECC02", margin: 0 }}>Administration</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Notification bell */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowNotifications(!showNotifications)}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, padding: "8px 10px", cursor: "pointer", position: "relative", display: "flex", alignItems: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={notifications.length > 0 ? "#FECC02" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                  {notifications.length > 0 && (
                    <span style={{
                      position: "absolute", top: -6, right: -6, background: "#e74c3c", color: "#fff",
                      fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'DM Mono', monospace", lineHeight: 1,
                    }}>
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {showNotifications && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0, width: 340, maxHeight: 400, overflowY: "auto",
                    background: "#1a1b1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100,
                  }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", fontFamily: "'DM Mono', monospace" }}>
                      Notifications {notifications.length > 0 && `(${notifications.length})`}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "24px 16px", textAlign: "center", color: "#555", fontSize: 13 }}>Aucune nouvelle notification</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.code} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(254,204,2,0.06)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          onClick={async () => {
                            const full = await loadSession(n.code);
                            if (full) {
                              markNotificationSeen(n.code);
                              setShowNotifications(false);
                              setCurrentSession(full);
                              setIsAdminView(true);
                              setView("results");
                            }
                          }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 4, background: "#52B788", flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>{n.name}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#888", paddingLeft: 16 }}>
                            {n.role} · {n.code} · Test termine
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => { setView("landing"); setAdminPwd(""); setShowNotifications(false); }} style={btnOutline}>← Accueil</button>
            </div>
          </div>

          <div style={{ ...box, padding: 32, marginBottom: 40 }}>
            <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#FECC02", marginBottom: 24 }}>Créer une nouvelle évaluation</h3>

            {/* Assessment type selector — visible only when multiple assessments exist */}
            {Object.keys(ASSESSMENTS).length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>Type d'évaluation</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {Object.values(ASSESSMENTS).map((assmt) => (
                    <button key={assmt.id} onClick={() => setAdminAssessmentType(assmt.id)}
                      style={{
                        flex: 1, padding: "14px 12px", textAlign: "center", borderRadius: 2, cursor: "pointer",
                        background: adminAssessmentType === assmt.id ? "rgba(254,204,2,0.12)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${adminAssessmentType === assmt.id ? "#FECC02" : "rgba(255,255,255,0.08)"}`,
                        color: adminAssessmentType === assmt.id ? "#FECC02" : "#888",
                      }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700 }}>{assmt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Candidat</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Prénom Nom" style={input} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>Poste visé</label>
                <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder={adminAssessment.rolePlaceholder} style={input} />
              </div>
            </div>

            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#888", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>Format</label>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              {Object.entries(adminAssessment.formats).map(([key, fmt]) => (
                <button key={key} onClick={() => setNewFormat(key)}
                  style={{
                    flex: 1, padding: "16px 12px", textAlign: "center", borderRadius: 2, cursor: "pointer",
                    background: newFormat === key ? "rgba(254,204,2,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${newFormat === key ? "#FECC02" : "rgba(255,255,255,0.08)"}`,
                    color: newFormat === key ? "#FECC02" : "#888",
                  }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{fmt.label}</div>
                  <div style={{ fontSize: 12 }}>{fmt.total} questions</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{fmt.duration}</div>
                </button>
              ))}
            </div>

            <button onClick={createSession} disabled={!newName.trim()} style={{ ...btn(!!newName.trim()), width: "100%" }}>
              Générer le code d'accès
            </button>
            {adminError && (
              <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 12, padding: "10px 14px", background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 2 }}>
                {adminError}
              </p>
            )}
          </div>

          <div style={{ ...box, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#888", margin: 0 }}>Sessions ({sessions.length})</h3>
              <button onClick={loadSessions} style={{ ...btnOutline, padding: "6px 14px", fontSize: 11 }}>Rafraîchir</button>
            </div>

            {sessions.length === 0 && <p style={{ color: "#555", textAlign: "center", padding: 24 }}>Aucune session créée</p>}

            {sessions.map((s) => {
              const statusColors = { pending: "#888", in_progress: "#FECC02", completed: "#52B788" };
              const statusLabels = { pending: "En attente", in_progress: "En cours", completed: "Terminé" };
              return (
                <div key={s.code} style={{ padding: "16px 20px", marginBottom: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{s.role} · {getAssessment(s.assessmentType || DEFAULT_ASSESSMENT).label} · {getAssessment(s.assessmentType || DEFAULT_ASSESSMENT).formats[s.format]?.label}{s.email ? ` · ${s.email}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, letterSpacing: 3, color: "#FECC02", fontWeight: 700 }}>{s.code}</span>
                    <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 2, background: `${statusColors[s.status]}22`, color: statusColors[s.status], fontFamily: "'DM Mono', monospace" }}>
                      {statusLabels[s.status]}
                    </span>
                    {s.status === "completed" && (
                      <button onClick={async () => { const full = await loadSession(s.code); if (full) { setCurrentSession(full); setIsAdminView(true); setView("results"); } }}
                        style={{ ...btnOutline, padding: "6px 14px", fontSize: 11, color: "#52B788", borderColor: "#52B78844" }}>
                        Voir résultats
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Methodology section */}
          {adminAssessment.methodology && (
            <div style={{ ...box, padding: 32, marginTop: 40 }}>
              <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#FECC02", marginBottom: 24 }}>{adminAssessment.methodology.title}</h3>
              {adminAssessment.methodology.sections.map((section, i) => (
                <div key={i} style={{ marginBottom: i < adminAssessment.methodology.sections.length - 1 ? 24 : 0 }}>
                  <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#d0d0d0", marginBottom: 8 }}>{section.heading}</h4>
                  <p style={{ fontSize: 13, lineHeight: 1.8, color: "#888", margin: 0 }}>{section.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== QUIZ ===== */}
      {view === "quiz" && questions.length > 0 && currentQ < questions.length && (() => {
        const q = questions[currentQ];
        // Mirror questions: show the original dimension they mirror
        // Desirability questions: show a neutral "Posture managériale" label
        const isMirror = q.dim.startsWith("mirror_");
        const isDesirability = q.dim === "desirability";
        const dimId = isMirror ? q.mirrorOf?.dim : q.dim;
        const dim = currentAssessment.dimensions.find((d) => d.id === dimId) || { name: "Posture Managériale", icon: "🎭", color: "#888", pillar: 0 };
        const pillar = isDesirability ? { name: "Posture & Authenticité", color: "#888" } : currentAssessment.pillars[dim.pillar];
        const fmt = currentAssessment.formats[currentSession.format];
        return (
          <div style={{ maxWidth: 750, margin: "0 auto", padding: "40px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#FECC02", letterSpacing: 2 }}>AMARILLO {currentAssessment.label.toUpperCase()}</span>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#666" }}>{currentQ + 1} / {questions.length}</span>
                <button onClick={handleSaveAndQuit} disabled={saving}
                  style={{ ...btnOutline, padding: "6px 14px", fontSize: 11 }}>
                  {saving ? "Sauvegarde..." : "Sauvegarder et quitter"}
                </button>
              </div>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 8 }}>
              <div style={{ height: "100%", borderRadius: 2, width: `${progress}%`, background: "linear-gradient(90deg, #FECC02, #E5B800)", transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 32, fontFamily: "'DM Mono', monospace" }}>
              {fmt.label} · {fmt.duration} · Code : {currentSession.code}
            </div>

            <div key={currentQ} style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ padding: "6px 14px", borderRadius: 2, fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: 1, background: `${pillar.color}15`, color: pillar.color, border: `1px solid ${pillar.color}33` }}>{pillar.name}</span>
                <span style={{ fontSize: 12, color: "#666" }}>›</span>
                <span style={{ fontSize: 13, color: dim.color }}>{dim.icon} {dim.name}</span>
              </div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700, lineHeight: 1.4, marginBottom: 32, color: "#f0f0f0" }}>{q.text}</h2>
              <RankingCard key={`${currentQ}-${q.dim}`} question={q} dimColor={dim.color} onComplete={handleRankComplete} />
            </div>
            <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
          </div>
        );
      })()}

      {/* ===== RESULTS ===== */}
      {view === "results" && currentSession && (() => {
        const scores = computeScores();
        const analysis = getAnalysis(scores, currentAssessment);
        const reliability = computeReliability(currentSession, currentAssessment);
        return (
          <div ref={resultsRef} data-pdf-container style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", background: "#0a0b0e" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ marginBottom: 24 }}>
                <img data-logo src={amarilloLogoWhite} alt="Amarillo Search" style={{ width: "clamp(180px, 40vw, 280px)", objectFit: "contain", display: "block", margin: "0 auto 16px" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 4, color: "#FECC02", textTransform: "uppercase", fontWeight: 500 }}>Rapport d'évaluation</span>
              </div>
              <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em", color: "#f0f0f0" }}>{currentSession.candidateName}</h1>
              <p style={{ color: "#888", fontSize: 15 }}>
                {currentSession.candidateRole || currentAssessment.defaultRole} · {currentAssessment.formats[currentSession.format]?.label} · {new Date(currentSession.createdAt).toLocaleDateString("fr-FR")}
                {currentSession.totalTimeMs > 0 && ` · Temps : ${formatTime(currentSession.totalTimeMs)}`}
              </p>
            </div>

            <div data-section="profile" style={{ padding: "32px 36px", marginBottom: 40, background: "rgba(254,204,2,0.03)", border: "1px solid rgba(254,204,2,0.12)", borderLeft: "4px solid #FECC02", borderRadius: 2 }}>
              <h2 data-profile-title style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, marginBottom: 12, color: "#FECC02" }}>{analysis.profile}</h2>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <div data-score-badge style={{ padding: "6px 16px", background: "rgba(254,204,2,0.08)", borderRadius: 2, fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#FECC02" }}>
                  Indice global : {analysis.avgNorm}/100
                </div>
                <div data-score-badge style={{ padding: "6px 16px", background: "rgba(254,204,2,0.08)", borderRadius: 2, fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#FECC02" }}>
                  Correspondance : {analysis.matchPct}%
                </div>
                <div data-score-badge style={{ padding: "6px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 2, fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#666" }}>
                  Score brut : {analysis.avg.toFixed(2)} / 4.00
                </div>
              </div>
              <p style={{ color: "#bbb", lineHeight: 1.8, fontSize: 15, marginBottom: 20 }}>{analysis.description}</p>

              {/* Top 3 profile matches */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {analysis.topProfiles.map((tp, i) => (
                  <div key={i} style={{ padding: "8px 14px", background: i === 0 ? "rgba(254,204,2,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? "rgba(254,204,2,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 2, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                    <span style={{ color: i === 0 ? "#FECC02" : "#888" }}>{tp.name}</span>
                    <span style={{ color: "#666", marginLeft: 8 }}>{tp.pct}%</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                <div style={{ padding: "16px 20px", background: "rgba(82,183,136,0.05)", border: "1px solid rgba(82,183,136,0.15)", borderRadius: 2 }}>
                  <div data-section-header="green" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#52B788", marginBottom: 8 }}>Atouts identifiés</div>
                  <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{analysis.strengths}</p>
                </div>
                <div style={{ padding: "16px 20px", background: "rgba(254,204,2,0.03)", border: "1px solid rgba(254,204,2,0.12)", borderRadius: 2 }}>
                  <div data-section-header="yellow" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#FECC02", marginBottom: 8 }}>Axes de développement recommandés</div>
                  <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{analysis.development}</p>
                </div>
                <div style={{ padding: "16px 20px", background: "rgba(58,91,160,0.05)", border: "1px solid rgba(58,91,160,0.15)", borderRadius: 2 }}>
                  <div data-section-header="blue" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#6A97DF", marginBottom: 8 }}>Environnements adaptés</div>
                  <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{analysis.context}</p>
                </div>
              </div>
            </div>

            <div data-section="radar" style={{ ...box, padding: 32, marginBottom: 40 }}>
              <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: 24, textAlign: "center" }}>Profil Radar — {currentAssessment.dimensions.length} Dimensions</h3>
              <RadarChart scores={scores} dimensions={currentAssessment.dimensions} />
            </div>

            <div data-section="pillars" style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
              {currentAssessment.pillars.map((p, i) => (
                <div key={i} style={{ flex: "1 1 250px", padding: "24px 28px", background: `${p.color}08`, border: `1px solid ${p.color}22`, borderRadius: 2 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: p.color, marginBottom: 12 }}>{p.name}</div>
                  <div data-pillar-score style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 36, color: "#f0f0f0" }}>{analysis.pillarScoresNorm[i]}</div>
                  <div data-pillar-unit style={{ fontSize: 12, color: "#666" }}>/100</div>
                  <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono', monospace", marginTop: 4 }}>({analysis.pillarScores[i].toFixed(2)} / 4.00)</div>
                </div>
              ))}
            </div>

            {currentAssessment.pillars.map((p, pi) => (
              <div key={pi} data-section="pillar-detail" style={{ ...box, padding: "28px 32px", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: p.color, marginBottom: 20 }}>{p.name}</h3>
                {currentAssessment.dimensions.filter(d => d.pillar === pi).map(dim => <ScoreBar key={dim.id} dimension={dim} score={scores[dim.id]} />)}
              </div>
            ))}

            <div data-section="synthesis" style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px", padding: "28px 32px", background: "rgba(45,106,79,0.06)", border: "1px solid rgba(45,106,79,0.2)", borderRadius: 2 }}>
                <h3 data-section-header="green" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#52B788", marginBottom: 16 }}>Points forts</h3>
                {analysis.top3.map(dim => (
                  <div key={dim.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", color: "#aaa", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span data-dim-label>{dim.icon} {dim.name}</span>
                    <span data-synth-score="green" style={{ color: "#52B788", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{analysis.scoresNorm[dim.id]}/100</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: "1 1 280px", padding: "28px 32px", background: "rgba(254,204,2,0.04)", border: "1px solid rgba(254,204,2,0.15)", borderRadius: 2 }}>
                <h3 data-section-header="yellow" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#FECC02", marginBottom: 16 }}>Axes de développement</h3>
                {analysis.bottom3.map(dim => (
                  <div key={dim.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", color: "#aaa", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span data-dim-label>{dim.icon} {dim.name}</span>
                    <span data-synth-score="yellow" style={{ color: "#FECC02", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{analysis.scoresNorm[dim.id]}/100</span>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Reliability indicators (admin-only) --- */}
            {isAdminView && reliability && (
              <div data-pdf-hide="true" style={{ ...box, padding: 32, marginBottom: 40, borderLeft: "4px solid #888" }}>
                <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: 8 }}>Indicateurs de fiabilité</h3>
                <p style={{ fontSize: 11, color: "#555", marginBottom: 24, fontFamily: "'DM Mono', monospace" }}>Visible uniquement par l'administrateur</p>

                <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
                  {/* Coherence index */}
                  <div style={{ flex: "1 1 280px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "#ccc" }}>Indice de cohérence</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: reliability.coherenceLevel.color }}>
                        {reliability.coherenceIndex !== null ? `${reliability.coherenceIndex}%` : "—"}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", marginBottom: 8 }}>
                      <div style={{ height: "100%", borderRadius: 4, width: `${reliability.coherenceIndex || 0}%`, background: reliability.coherenceLevel.color, transition: "width 1s ease" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 2, background: `${reliability.coherenceLevel.color}22`, color: reliability.coherenceLevel.color, fontFamily: "'DM Mono', monospace" }}>
                        {reliability.coherenceIndex >= 70 ? "✓" : reliability.coherenceIndex >= 50 ? "⚠" : "🚨"} {reliability.coherenceLevel.label}
                      </span>
                      <span style={{ fontSize: 11, color: "#555" }}>
                        {reliability.coherencePairs.filter(p => p.coherent).length}/{reliability.coherencePairs.length} paires cohérentes
                      </span>
                    </div>
                  </div>

                  {/* Desirability score */}
                  <div style={{ flex: "1 1 280px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "#ccc" }}>Désirabilité sociale</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: reliability.desirabilityLevel.color }}>
                        {reliability.desirabilityScore !== null ? `${reliability.desirabilityScore}%` : "—"}
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", marginBottom: 8 }}>
                      <div style={{ height: "100%", borderRadius: 4, width: `${reliability.desirabilityScore || 0}%`, background: reliability.desirabilityLevel.color, transition: "width 1s ease" }} />
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 2, background: `${reliability.desirabilityLevel.color}22`, color: reliability.desirabilityLevel.color, fontFamily: "'DM Mono', monospace" }}>
                      {reliability.desirabilityScore <= 50 ? "✓" : reliability.desirabilityScore <= 75 ? "⚠" : "🚨"} {reliability.desirabilityLevel.label}
                    </span>
                  </div>
                </div>

                {/* Significance vs random */}
                {(() => {
                  const fmt = currentAssessment.formats[currentSession.format] || currentAssessment.formats.standard;
                  const sig = computeSignificance(analysis.avg, fmt.questionsPerDim);
                  const absZ = Math.abs(sig.zScore);
                  const sigLabel = absZ >= 3 ? "Hautement significatif" : absZ >= 2 ? "Significatif" : absZ >= 1 ? "Faiblement significatif" : "Non significatif";
                  const sigColor = absZ >= 3 ? "#52B788" : absZ >= 2 ? "#6A97DF" : absZ >= 1 ? "#FECC02" : "#e74c3c";
                  const sigIcon = absZ >= 2 ? "✓" : absZ >= 1 ? "⚠" : "🚨";
                  return (
                    <div style={{ flex: "1 1 280px", marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: "#ccc" }}>Significativité vs. hasard</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: sigColor }}>
                          z = {sig.zScore.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", marginBottom: 8 }}>
                        <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(100, absZ / 4 * 100)}%`, background: sigColor, transition: "width 1s ease" }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 2, background: `${sigColor}22`, color: sigColor, fontFamily: "'DM Mono', monospace" }}>
                          {sigIcon} {sigLabel}
                        </span>
                        <span style={{ fontSize: 11, color: "#555" }}>
                          {absZ >= 2 ? "Résultat fiable, nettement au-dessus du hasard" : absZ >= 1 ? "Résultat à interpréter avec prudence" : "Score proche d'une réponse aléatoire"}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Detail: coherence pairs */}
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 12, color: "#666", cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>Détail des paires miroir</summary>
                  <div style={{ marginTop: 12 }}>
                    {reliability.coherencePairs.map((pair, i) => {
                      const origDim = currentAssessment.dimensions.find(d => d.id === pair.originalDim);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", marginBottom: 4, background: pair.coherent ? "rgba(82,183,136,0.05)" : "rgba(231,76,60,0.08)", border: `1px solid ${pair.coherent ? "rgba(82,183,136,0.15)" : "rgba(231,76,60,0.2)"}`, borderRadius: 2, fontSize: 12 }}>
                          <span style={{ color: "#aaa" }}>{origDim?.icon} {origDim?.name}</span>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", color: "#888" }}>{pair.origScore.toFixed(2)} → {pair.mirrorScore.toFixed(2)}</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: pair.coherent ? "#52B788" : "#e74c3c" }}>Δ {pair.gap.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            )}

            {/* --- Email section --- */}
            <div data-pdf-hide="true" style={{ ...box, padding: 32, marginBottom: 40 }}>
              <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#888", marginBottom: 16 }}>Recevoir vos résultats par email</h3>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} placeholder="votre@email.com"
                  style={{ ...input, flex: 1, minWidth: 200 }}
                  onKeyDown={(e) => e.key === "Enter" && candidateEmail.includes("@") && !emailSending && handleSendEmail()} />
                <button onClick={handleSendEmail} disabled={!candidateEmail.includes("@") || emailSending}
                  style={btn(candidateEmail.includes("@") && !emailSending)}>
                  {emailSending ? "Envoi..." : emailSent ? "✓ Envoyé" : "Envoyer"}
                </button>
              </div>
              {emailSent && <p style={{ color: "#52B788", fontSize: 13, marginTop: 8 }}>✓ Email envoyé avec succès !</p>}
              {emailError && <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 8 }}>{emailError}</p>}
            </div>

            {/* --- Footer --- */}
            <div data-section="footer" style={{ textAlign: "center", padding: "32px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <img data-logo src={amarilloLogoWhite} alt="Amarillo Search" style={{ width: 140, objectFit: "contain", marginBottom: 12, opacity: 0.5, display: "block", margin: "0 auto 12px" }} />
              <div data-dsi-label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: 4, color: "#FECC0288", textTransform: "uppercase", marginBottom: 8, fontWeight: 500 }}>{currentAssessment.label}</div>
              <p style={{ fontSize: 12, color: "#444", marginBottom: 16 }}>Rapport confidentiel · Code session : {currentSession.code}</p>
              <div data-pdf-hide-btns="true" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={handleDownloadPDF} style={{ ...btnOutline, color: "#FECC02", borderColor: "#FECC0255" }}>
                  📄 Telecharger PDF
                </button>
                {isAdminView && (
                  <button onClick={handleDownloadExecutivePDF} style={{ ...btnOutline, color: "#3A5BA0", borderColor: "#3A5BA055" }}>
                    📋 PDF Dirigeant (anonyme)
                  </button>
                )}
                <button onClick={() => { setCurrentSession(null); setView("landing"); }} style={btnOutline}>← Retour à l'accueil</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
