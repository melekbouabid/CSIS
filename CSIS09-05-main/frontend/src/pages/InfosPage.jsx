import { useState } from "react";
import { useI18n } from "../context/I18nContext";
import { usePredictions } from "../context/PredictionsContext";

/* ── helpers ─────────────────────────────────────────────────────────── */

function riskColor(pct) {
  if (pct >= 70) return { color: "#ef2f36", bg: "linear-gradient(135deg,#fff1f1,#ffe4e4)", border: "#fca5a5", glow: "rgba(239,47,54,0.18)" };
  if (pct >= 40) return { color: "#f59e0b", bg: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "#fcd34d", glow: "rgba(245,158,11,0.18)" };
  return { color: "#16a34a", bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "#86efac", glow: "rgba(22,163,74,0.18)" };
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toPretty(key) {
  return key.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

const KEY_FIELDS = ["gender", "age", "academic_level", "employment_status", "addiction_type", "financial_situation"];

const ALL_FIELDS = [
  "gender", "age", "neighborhood_quality", "neighborhood_safety_rating",
  "academic_level", "parental_education", "family_situation", "parental_marital_status",
  "family_criminal_history", "family_psychological_issues", "friend_in_jail",
  "has_psychological_problem", "psychological_condition", "mental_health_treatment",
  "financial_situation", "debt_level", "employment_status", "addiction_type",
];

function generateDiagnosticItems(profile) {
  const items = [];
  if (profile.addiction_type && profile.addiction_type !== "Aucune")
    items.push({ type: "risk", label: "Substance Use", value: profile.addiction_type, detail: "Active substance use is a primary predictor of criminal recidivism and violent behavior." });
  if (profile.family_criminal_history === "Oui")
    items.push({ type: "risk", label: "Family Criminal History", value: "Present", detail: "Family criminality increases individual risk through environmental exposure and behavioral modeling." });
  if (profile.friend_in_jail === "Oui")
    items.push({ type: "risk", label: "Criminal Peer Network", value: "Friend incarcerated", detail: "Proximity to incarcerated individuals indicates exposure to criminal networks and risk normalization." });
  if (profile.has_psychological_problem === "Oui") {
    const cond = (profile.psychological_condition && profile.psychological_condition !== "Aucun")
      ? profile.psychological_condition : "Diagnosed condition";
    items.push({ type: "risk", label: "Mental Health Issue", value: cond, detail: "Untreated psychological conditions correlate with impulsive behavior and poor decision-making." });
  }
  if (["Precaire", "Tres precaire"].includes(profile.financial_situation))
    items.push({ type: "risk", label: "Financial Precarity", value: profile.financial_situation, detail: "Severe financial stress is a key driver of property crimes and desperation-based offenses." });
  if (["Elevee", "Tres elevee"].includes(profile.debt_level))
    items.push({ type: "risk", label: "High Debt Burden", value: profile.debt_level, detail: "Heavy indebtedness increases financial desperation and likelihood of illegal income-seeking." });
  if (["Chomeur", "Sans emploi", "Travailleur informel"].includes(profile.employment_status))
    items.push({ type: "risk", label: "Unstable Employment", value: profile.employment_status, detail: "Lack of stable employment removes a critical social anchor and legal income source." });
  if (["Pauvre", "Tres pauvre"].includes(profile.neighborhood_quality))
    items.push({ type: "risk", label: "Disadvantaged Neighborhood", value: profile.neighborhood_quality, detail: "Residing in a deprived environment increases crime exposure and weakens social norms." });
  if (profile.family_psychological_issues === "Oui")
    items.push({ type: "risk", label: "Family Mental Health Issues", value: "Present", detail: "Family psychological challenges disrupt healthy development and available support structures." });
  if (profile.neighborhood_safety_rating && Number(profile.neighborhood_safety_rating) <= 3)
    items.push({ type: "risk", label: "Low Neighborhood Safety", value: `${profile.neighborhood_safety_rating}/10`, detail: "Low safety rating correlates with higher local crime rates and victimization risk." });
  if (["Divorces", "Separes", "Decedes"].includes(profile.parental_marital_status))
    items.push({ type: "risk", label: "Family Instability", value: profile.parental_marital_status, detail: "Parental separation or loss affects emotional stability and social support availability." });
  if (["Employe", "Etudiant"].includes(profile.employment_status))
    items.push({ type: "protect", label: "Stable Occupation", value: profile.employment_status, detail: "Employment or education provides structure, legal income, and social integration." });
  if (profile.addiction_type === "Aucune")
    items.push({ type: "protect", label: "No Substance Abuse", value: "None detected", detail: "Absence of addiction removes a major behavioral risk amplifier." });
  if (["Aisee", "Moyenne"].includes(profile.financial_situation))
    items.push({ type: "protect", label: "Financial Stability", value: profile.financial_situation, detail: "Adequate resources reduce economic pressure and desperation-driven risk." });
  if (["Bon", "Residentiel"].includes(profile.neighborhood_quality))
    items.push({ type: "protect", label: "Safe Environment", value: profile.neighborhood_quality, detail: "A supportive neighborhood enforces social norms and reduces criminal exposure." });
  if (profile.family_criminal_history === "Non")
    items.push({ type: "protect", label: "Clean Family Background", value: "None", detail: "No family criminal history supports positive behavioral modeling." });
  if (["Licence", "Master", "Doctorat", "Bac+2"].includes(profile.academic_level))
    items.push({ type: "protect", label: "Higher Education", value: profile.academic_level, detail: "Advanced education expands legitimate opportunities and builds social capital." });
  if (profile.has_psychological_problem === "Non")
    items.push({ type: "protect", label: "Good Mental Health", value: "No issues", detail: "Stable mental health supports rational decision-making and prosocial behavior." });
  return items;
}

/* ── Mini gauge (card) ───────────────────────────────────────────────── */

function MiniGauge({ pct, color }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div className="ic-gauge-wrap">
      <svg className="ic-gauge-svg" viewBox="0 0 64 64">
        <circle className="ic-gauge-track" cx="32" cy="32" r={r} />
        <circle
          className="ic-gauge-fill"
          cx="32" cy="32" r={r}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ic-gauge-text" style={{ color }}>{pct}<span className="ic-gauge-pct">%</span></div>
    </div>
  );
}

/* ── Diagnostic tab ──────────────────────────────────────────────────── */

function DiagnosticTab({ profile, result }) {
  const pct = Number(result?.risk_percent) || 0;
  const { color } = riskColor(pct);
  const items = generateDiagnosticItems(profile);
  const riskItems = items.filter((i) => i.type === "risk");
  const protectItems = items.filter((i) => i.type === "protect");
  const label = pct >= 70 ? "HIGH" : pct >= 40 ? "MODERATE" : "LOW";

  return (
    <div className="im-diag">
      <div className="im-diag-summary">
        <div className="im-diag-summary-title">Assessment Summary</div>
        <p className="im-diag-summary-text">
          This profile presents a{" "}
          <strong style={{ color }}>{label} risk level</strong>{" "}
          ({pct}%) with <strong>{riskItems.length}</strong> risk factor{riskItems.length !== 1 ? "s" : ""} and{" "}
          <strong>{protectItems.length}</strong> protective factor{protectItems.length !== 1 ? "s" : ""}.{" "}
          {pct >= 70 && "Immediate intervention is strongly recommended."}
          {pct >= 40 && pct < 70 && "Monitoring and targeted support are advised."}
          {pct < 40 && "Maintain current support structures and monitor periodically."}
        </p>
        <div className="im-diag-meta-row">
          <div className="im-diag-meta-item">
            <span className="im-diag-meta-key">Predicted offense</span>
            <span className="im-diag-meta-val">{result?.predicted_crime_type || "—"}</span>
          </div>
          <div className="im-diag-meta-item">
            <span className="im-diag-meta-key">Model decision</span>
            <span className="im-diag-meta-val">{result?.decision || "—"}</span>
          </div>
        </div>
      </div>

      {riskItems.length > 0 && (
        <div className="im-diag-group">
          <div className="im-diag-group-title im-diag-group-risk">⚠ Risk Factors · {riskItems.length}</div>
          {riskItems.map((item, i) => (
            <div key={i} className="im-diag-item im-diag-item-risk">
              <div className="im-diag-item-top">
                <span className="im-diag-item-label">{item.label}</span>
                <span className="im-diag-item-badge im-badge-risk">{item.value}</span>
              </div>
              <p className="im-diag-item-detail">{item.detail}</p>
            </div>
          ))}
        </div>
      )}

      {protectItems.length > 0 && (
        <div className="im-diag-group">
          <div className="im-diag-group-title im-diag-group-protect">✓ Protective Factors · {protectItems.length}</div>
          {protectItems.map((item, i) => (
            <div key={i} className="im-diag-item im-diag-item-protect">
              <div className="im-diag-item-top">
                <span className="im-diag-item-label">{item.label}</span>
                <span className="im-diag-item-badge im-badge-protect">{item.value}</span>
              </div>
              <p className="im-diag-item-detail">{item.detail}</p>
            </div>
          ))}
        </div>
      )}

      {riskItems.length === 0 && protectItems.length === 0 && (
        <p style={{ color: "#466e9e", fontSize: "0.9rem" }}>No significant factors identified from the available profile data.</p>
      )}
    </div>
  );
}

/* ── Full modal gauge ────────────────────────────────────────────────── */

function Gauge({ pct }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const { color } = riskColor(pct);
  return (
    <div className="im-gauge-wrap">
      <svg className="im-gauge-svg" viewBox="0 0 90 90">
        <circle className="im-gauge-track" cx="45" cy="45" r={r} />
        <circle className="im-gauge-fill" cx="45" cy="45" r={r} stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="im-gauge-text" style={{ color }}>{pct}%</div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */

export default function InfosPage() {
  const { t } = useI18n();
  const { predictions, removePrediction, clearAll, updatePrediction } = usePredictions();

  const [openId, setOpenId] = useState(null);
  const [localName, setLocalName] = useState("");
  const [localNotes, setLocalNotes] = useState("");
  const [localControl, setLocalControl] = useState("");
  const [activeTab, setActiveTab] = useState("diagnostic");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [cardNames, setCardNames] = useState({});

  const openCard = predictions.find((p) => p.id === openId) || null;

  async function saveCardName(id, name) {
    setCardNames((prev) => ({ ...prev, [id]: name }));
    await updatePrediction(id, { name });
  }

  function openEntry(entry) {
    setOpenId(entry.id);
    setLocalName(entry.name || "");
    setLocalNotes(entry.notes || "");
    setLocalControl(entry.control || "");
    setActiveTab("diagnostic");
    setSavedMsg(false);
  }

  function closeModal() { setOpenId(null); }

  async function handleSave() {
    if (!openId) return;
    setSaving(true);
    await updatePrediction(openId, { name: localName, notes: localNotes, control: localControl });
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  return (
    <div className="info-page">
      {/* Page header */}
      <div className="info-header">
        <div className="info-header-icon">📋</div>
        <div className="info-header-body">
          <div className="info-header-kicker">{t("nav.infos")}</div>
          <h1 className="info-header-title">{t("infos.title")}</h1>
          <p className="info-header-sub">{t("infos.subtitle")}</p>
        </div>
        <div className="info-header-right">
          <div className="info-count-badge">{predictions.length} {t("infos.records")}</div>
          {predictions.length > 0 && (
            <button className="info-clear-btn" onClick={clearAll}>🗑 {t("infos.clearAll")}</button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {predictions.length === 0 && (
        <div className="info-empty">
          <div className="info-empty-icon">📭</div>
          <h3 className="info-empty-title">{t("infos.empty")}</h3>
          <p className="info-empty-sub">{t("infos.emptyHint")}</p>
        </div>
      )}

      {/* Cards grid */}
      {predictions.length > 0 && (
        <div className="info-grid">
          {predictions.map((entry, idx) => {
            const pct = Number(entry.result?.risk_percent) || 0;
            const { color, bg, border, glow } = riskColor(pct);
            const isHigh = pct >= 70;
            const isMed = pct >= 40 && pct < 70;
            const label = isHigh ? "HIGH" : isMed ? "MODERATE" : "LOW";
            const diagItems = generateDiagnosticItems(entry.profile || {});
            const riskCount = diagItems.filter((i) => i.type === "risk").length;
            const protectCount = diagItems.filter((i) => i.type === "protect").length;

            return (
              <div
                key={entry.id}
                className="info-card"
                style={{ "--risk-color": color, "--risk-glow": glow }}
              >
                {/* Top progress strip */}
                <div className="ic-strip">
                  <div className="ic-strip-fill" style={{ width: `${pct}%`, background: color }} />
                </div>

                {/* Header band */}
                <div className="ic-head" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
                  <MiniGauge pct={pct} color={color} />
                  <div className="ic-head-info">
                    <div className="ic-level-badge" style={{ background: color + "20", color, border: `1px solid ${border}` }}>
                      {isHigh ? "⚠" : isMed ? "⚡" : "✓"} {label}
                    </div>
                    <div className="ic-crime">{entry.result?.predicted_crime_type || "—"}</div>
                    <div className="ic-decision">{entry.result?.decision || "—"}</div>
                  </div>
                </div>

                {/* Inline name input */}
                <div className="ic-name-row">
                  <span className="ic-name-icon">📁</span>
                  <input
                    className="ic-name-input"
                    value={cardNames[entry.id] ?? entry.name ?? ""}
                    onChange={(e) => setCardNames((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                    onBlur={(e) => saveCardName(entry.id, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                    placeholder="Add a case name…"
                  />
                </div>

                {/* Factor badges */}
                <div className="ic-factors">
                  <div className="ic-factor ic-factor-risk">
                    <span className="ic-factor-dot ic-dot-risk" />
                    <span>{riskCount} risk factor{riskCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="ic-factor-sep" />
                  <div className="ic-factor ic-factor-protect">
                    <span className="ic-factor-dot ic-dot-protect" />
                    <span>{protectCount} protective</span>
                  </div>
                </div>

                {/* Profile snapshot */}
                <div className="ic-body">
                  <div className="ic-section-label">Profile Snapshot</div>
                  <div className="ic-pills">
                    {KEY_FIELDS.map((key) => (
                      <div key={key} className="ic-pill">
                        <span className="ic-pill-key">{toPretty(key)}</span>
                        <span className="ic-pill-val">{entry.profile?.[key] ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes preview */}
                {entry.notes && (
                  <div className="ic-notes-preview">
                    <span className="ic-notes-icon">📝</span>
                    <span>{entry.notes.slice(0, 80)}{entry.notes.length > 80 ? "…" : ""}</span>
                  </div>
                )}

                {/* Footer */}
                <div className="ic-footer">
                  <div className="ic-date">🕐 {formatDate(entry.timestamp)}</div>
                  <div className="ic-footer-btns">
                    <button className="ic-open-btn" onClick={() => openEntry(entry)}>Open →</button>
                    <button className="ic-delete-btn" onClick={() => removePrediction(entry.id)} title="Delete">🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      {openCard && (() => {
        const pct = Number(openCard.result?.risk_percent) || 0;
        const { color, bg, border } = riskColor(pct);
        const label = pct >= 70 ? "HIGH" : pct >= 40 ? "MODERATE" : "LOW";
        return (
          <div className="im-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <div className="im-modal" role="dialog" aria-modal="true">
              <div className="im-header">
                <div className="im-header-dot" style={{ background: color }} />
                <input className="im-name-input" value={localName} onChange={(e) => setLocalName(e.target.value)} placeholder="Untitled Case — click to add a name" />
                <span className="im-risk-chip" style={{ background: color + "1a", color, border: `1px solid ${border}` }}>{label} · {pct}%</span>
                <button className="im-close-btn" onClick={closeModal} aria-label="Close">✕</button>
              </div>
              <div className="im-body">
                <div className="im-left">
                  <Gauge pct={pct} />
                  <div className="im-left-decision" style={{ background: bg, border: `1px solid ${border}` }}>
                    <span style={{ color, fontWeight: 700, fontSize: "0.82rem" }}>
                      {pct >= 70 ? "⚠" : pct >= 40 ? "⚡" : "✓"} {openCard.result?.decision}
                    </span>
                  </div>
                  <div className="im-left-crime">{openCard.result?.predicted_crime_type}</div>
                  <div className="im-left-date">🕐 {formatDate(openCard.timestamp)}</div>
                  <div className="im-divider" />
                  <div className="im-left-section-title">Full Profile</div>
                  <div className="im-profile-fields">
                    {ALL_FIELDS.map((key) => (
                      <div key={key} className="im-profile-row">
                        <span className="im-profile-key">{toPretty(key)}</span>
                        <span className="im-profile-val">{openCard.profile?.[key] ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="im-right">
                  <div className="im-tabs">
                    {[
                      { key: "diagnostic", label: "🔍 Diagnostic" },
                      { key: "notes",      label: "📝 Notes" },
                      { key: "control",    label: "🎯 Control" },
                    ].map((tab) => (
                      <button key={tab.key} className={`im-tab${activeTab === tab.key ? " active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="im-tab-content">
                    {activeTab === "diagnostic" && <DiagnosticTab profile={openCard.profile} result={openCard.result} />}
                    {activeTab === "notes" && (
                      <div className="im-textarea-wrap">
                        <p className="im-textarea-hint">Write your observations and findings about this case.</p>
                        <textarea className="im-textarea" value={localNotes} onChange={(e) => setLocalNotes(e.target.value)} placeholder="Add your observations, findings, or contextual notes here…" />
                      </div>
                    )}
                    {activeTab === "control" && (
                      <div className="im-textarea-wrap">
                        <p className="im-textarea-hint">Describe the intervention plan, recommended actions, or follow-up steps for this case.</p>
                        <textarea className="im-textarea" value={localControl} onChange={(e) => setLocalControl(e.target.value)} placeholder="Describe the control plan, recommended interventions, and follow-up actions…" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="im-footer">
                {savedMsg && <span className="im-saved-msg">✓ Saved successfully</span>}
                <button className="im-save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "💾 Save changes"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
