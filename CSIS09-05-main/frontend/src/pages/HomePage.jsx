import { Link } from "react-router-dom";
import { useI18n } from "../context/I18nContext";

const STATS = [
  { val: "10K+", lbl: "Profiles Analyzed" },
  { val: "18",   lbl: "Risk Features" },
  { val: "21",   lbl: "Crime Types" },
  { val: "4",    lbl: "Step Assessment" },
];

const PROCESS = [
  { num: "01", icon: "👤", title: "Enter Profile",     desc: "Input 18 demographic, social, and economic indicators for the subject." },
  { num: "02", icon: "⚙️", title: "Feature Analysis",  desc: "The ML pipeline extracts and weighs each feature against trained risk patterns." },
  { num: "03", icon: "📊", title: "Risk Scoring",      desc: "XGBoost models produce a calibrated risk score and predicted crime type." },
  { num: "04", icon: "🎯", title: "Actionable Output", desc: "A clear decision, risk percentage, and AI diagnostic guide your next step." },
];

export default function HomePage() {
  const { t } = useI18n();

  const features = [
    {
      icon: "🎯",
      title: t("auth.feature1"),
      desc: t("home.p1"),
      link: "/prediction",
      tags: ["ML Model", "XGBoost", "18 Features"],
      cta: "Start Assessment",
      color: "#0d6efd",
    },
    {
      icon: "📊",
      title: t("auth.feature2"),
      desc: t("home.p2"),
      link: "/dashboard",
      tags: ["Charts", "Feature Importance", "Filters"],
      cta: "View Dashboard",
      color: "#0891b2",
    },
    {
      icon: "⚖️",
      title: t("auth.feature3"),
      desc: t("home.p3"),
      link: "/chatbot",
      tags: ["RAG", "Legal PDFs", "AI Responses"],
      cta: "Ask the Assistant",
      color: "#7c3aed",
    },
  ];

  return (
    <div className="hp-page">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hp-hero">
        {/* Animated background orbs */}
        <div className="hp-hero-orb hp-hero-orb-1" />
        <div className="hp-hero-orb hp-hero-orb-2" />
        <div className="hp-hero-orb hp-hero-orb-3" />
        <div className="hp-hero-grid" />

        {/* Floating particles */}
        <div className="hp-particle hp-p1" />
        <div className="hp-particle hp-p2" />
        <div className="hp-particle hp-p3" />
        <div className="hp-particle hp-p4" />
        <div className="hp-particle hp-p5" />
        <div className="hp-particle hp-p6" />

        <div className="hp-hero-inner">
          {/* Left: text */}
          <div className="hp-hero-text">
            <div className="hp-badge">
              <span className="hp-badge-dot" aria-hidden="true" />
              {t("home.kicker")}
            </div>

            <h1 className="hp-headline">
              {t("home.titleA")}{" "}
              <span className="hp-headline-accent">{t("home.titleB")}</span>
            </h1>

            <p className="hp-lead">{t("home.lead")}</p>

            <div className="hp-hero-actions">
              <Link to="/prediction" className="hp-btn-primary">
                <span>{t("nav.prediction")}</span>
                <span className="hp-btn-arrow">→</span>
              </Link>
              <Link to="/dashboard" className="hp-btn-secondary">
                {t("nav.dashboard")}
              </Link>
            </div>

            <div className="hp-hero-stats">
              {STATS.map((s, i) => (
                <div key={s.val} className="hp-hero-stat-group">
                  <div className="hp-hero-stat">
                    <div className="hp-hero-stat-val">{s.val}</div>
                    <div className="hp-hero-stat-lbl">{s.lbl}</div>
                  </div>
                  {i < STATS.length - 1 && <div className="hp-stat-sep" />}
                </div>
              ))}
            </div>
          </div>

          {/* Right: visual */}
          <div className="hp-hero-visual">
            <div className="hp-vis-glow" />
            <div className="hp-vis-ring hp-vis-ring-1" />
            <div className="hp-vis-ring hp-vis-ring-2" />
            <div className="hp-vis-ring hp-vis-ring-3" />
            <div className="hp-vis-frame">
              <div className="hp-vis-scan" />
              <div className="hp-chip hp-chip-tl">
                <span className="hp-chip-dot" aria-hidden="true" />
                System Active
              </div>
              <div className="hp-chip hp-chip-br">🤖 AI Analysis</div>
              <div className="hp-chip hp-chip-bl">📈 98.2% Accuracy</div>
              <img src="/cesi.png" alt="CSIS" className="hp-vis-img" />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="hp-section hp-section-process">
        <div className="hp-section-hdr">
          <div className="hp-section-kicker">Workflow</div>
          <h2 className="hp-section-title">How It Works</h2>
          <p className="hp-section-sub">Four clear steps from raw input to actionable risk intelligence.</p>
        </div>

        <div className="hp-process-wrap">
          <div className="hp-process-track" />
          <div className="hp-process-grid">
            {PROCESS.map((step, i) => (
              <div key={step.num} className="hp-process-card" style={{ "--i": i }}>
                <div className="hp-process-num-bubble">{step.num}</div>
                <div className="hp-process-icon-wrap">{step.icon}</div>
                <h3 className="hp-process-title">{step.title}</h3>
                <p className="hp-process-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core capabilities ─────────────────────────────────── */}
      <section className="hp-section">
        <div className="hp-section-hdr">
          <div className="hp-section-kicker">Features</div>
          <h2 className="hp-section-title">Core Capabilities</h2>
          <p className="hp-section-sub">{t("home.note")}</p>
        </div>

        <div className="hp-feat-grid">
          {features.map((f, i) => (
            <div key={f.title} className="hp-feat-card" style={{ "--accent": f.color, "--i": i }}>
              <div className="hp-feat-card-bg" />
              <div className="hp-feat-icon-wrap">{f.icon}</div>
              <h3 className="hp-feat-title">{f.title}</h3>
              <p className="hp-feat-desc">{f.desc}</p>
              <div className="hp-feat-tags">
                {f.tags.map((tag) => (
                  <span key={tag} className="hp-feat-tag">{tag}</span>
                ))}
              </div>
              <Link to={f.link} className="hp-feat-link">
                {f.cta}
                <span className="hp-feat-link-arrow">→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="hp-cta">
        <div className="hp-cta-orb hp-cta-orb-1" />
        <div className="hp-cta-orb hp-cta-orb-2" />
        <div className="hp-cta-orb hp-cta-orb-3" />
        <div className="hp-cta-grid" />
        <div className="hp-cta-inner">
          <div className="hp-cta-badge">
            <span className="hp-cta-badge-dot" />
            Ready to begin
          </div>
          <h2 className="hp-cta-title">Start Your First Assessment</h2>
          <p className="hp-cta-sub">{t("home.signature")}</p>
          <div className="hp-cta-actions">
            <Link to="/prediction" className="hp-cta-btn-primary">
              Launch Prediction
              <span className="hp-btn-arrow">→</span>
            </Link>
            <Link to="/chatbot" className="hp-cta-btn-secondary">Ask the AI Assistant</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
