import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let animId;

    const setSize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(c);

    const pts = Array.from({ length: 58 }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.36,
      vy: (Math.random() - 0.5) * 0.36,
      r: Math.random() * 2 + 0.7,
      phase: Math.random() * Math.PI * 2,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.016;
        if (p.x < 0 || p.x > c.width)  p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77,171,247,${0.22 + Math.sin(p.phase) * 0.18})`;
        ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 128) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(13,110,253,${(1 - d / 128) * 0.24})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="lp-neural-canvas" />;
}

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "AI-Powered Predictions",
    desc: "XGBoost trained on 10,000 behavioral records",
    tag: "ML",
    color: "#3b82f6",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: "Legal Knowledge Base",
    desc: "1,485+ Tunisian law articles — semantic RAG",
    tag: "RAG",
    color: "#8b5cf6",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Real-time Risk Scoring",
    desc: "18-factor criminal behavior assessment engine",
    tag: "Live",
    color: "#06b6d4",
  },
];

function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const auth     = useAuth();
  const { t }    = useI18n();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await auth.signin(email.trim(), password);
    setLoading(false);
    if (res.ok) navigate("/home");
    else setError(res.error || t("auth.signInFailed"));
  }

  return (
    <div className="lp-root">

      {/* ════════════════════════════ BRAND PANEL ════════════════════════════ */}
      <aside className="lp-brand">
        <NeuralCanvas />
        <div className="lp-brand-bg" aria-hidden="true" />
        <div className="lp-brand-grid" aria-hidden="true" />
        <div className="lp-orb lp-orb-1" aria-hidden="true" />
        <div className="lp-orb lp-orb-2" aria-hidden="true" />
        <div className="lp-orb lp-orb-3" aria-hidden="true" />
        <div className="lp-scan-line" aria-hidden="true" />

        <div className="lp-brand-body">
          {/* Heading */}
          <div className="lp-brand-copy">
            <span className="lp-brand-kicker">
              <span className="lp-brand-kicker-dot" aria-hidden="true" />
              Criminal Behavior Intelligence
            </span>
            <h1 className="lp-brand-headline">CSIS Platform</h1>
            <p className="lp-brand-lead">
              Advanced AI-driven risk assessment and legal intelligence for law enforcement professionals.
            </p>
          </div>

          {/* Feature list */}
          <ul className="lp-feats">
            {FEATURES.map((f, i) => (
              <li
                key={i}
                className="lp-feat"
                style={{
                  "--fi": i,
                  "--fc": f.color,
                  "--fc-bg": f.color + "1a",
                  "--fc-border": f.color + "30",
                }}
              >
                <span className="lp-feat-icon">{f.icon}</span>
                <div className="lp-feat-content">
                  <div className="lp-feat-row">
                    <div className="lp-feat-name">{f.title}</div>
                    <span className="lp-feat-tag">{f.tag}</span>
                  </div>
                  <div className="lp-feat-desc">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* Stats bar */}
          <div className="lp-stats">
            {[["1,485+", "Legal Articles"], ["18", "Risk Factors"], ["10K", "Records"]].map(([val, key], i) => (
              <>
                {i > 0 && <div key={`sep-${i}`} className="lp-stat-sep" />}
                <div key={val} className="lp-stat">
                  <span className="lp-stat-val">{val}</span>
                  <span className="lp-stat-key">{key}</span>
                </div>
              </>
            ))}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════ FORM PANEL ════════════════════════════ */}
      <main className="lp-panel">
        <div className="lp-panel-glow lp-panel-glow-1" aria-hidden="true" />
        <div className="lp-panel-glow lp-panel-glow-2" aria-hidden="true" />
        <div className="lp-panel-mesh" aria-hidden="true" />

        <div className="lp-panel-inner">

          {/* Header */}
          <div className="lp-head">
            <span className="lp-head-badge">
              <span className="lp-head-ring" aria-hidden="true" />
              <span className="lp-head-dot" />
              Secure Portal
            </span>
            <h2 className="lp-head-title">Welcome back</h2>
            <p className="lp-head-sub">Sign in to your intelligence dashboard</p>
          </div>

          {/* System status */}
          <div className="lp-sys-status">
            <span className="lp-sys-dot" />
            <span className="lp-sys-text">All systems operational</span>
            <span className="lp-sys-badge">99.9% uptime</span>
          </div>

          {/* Form */}
          <form className="lp-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="lp-field" style={{ "--fi": 0 }}>
              <label className="lp-lbl">{t("common.email")}</label>
              <div className="lp-ctrl">
                <span className="lp-ctrl-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  className="lp-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field" style={{ "--fi": 1 }}>
              <div className="lp-lbl-row">
                <label className="lp-lbl">{t("common.password")}</label>
                <a href="#" className="lp-forgot">Forgot password?</a>
              </div>
              <div className="lp-ctrl">
                <span className="lp-ctrl-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  className="lp-input lp-input-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="lp-err lp-field" style={{ "--fi": 2 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="lp-submit lp-field"
              type="submit"
              disabled={loading}
              style={{ "--fi": error ? 3 : 2 }}
            >
              {loading
                ? <span className="lp-dots"><span/><span/><span/></span>
                : <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lp-submit-icon">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    <span>{t("auth.signInBtn")}</span>
                  </>
              }
            </button>

            {/* Divider */}
            <div className="lp-sep lp-field" style={{ "--fi": error ? 4 : 3 }}>
              <span>New to CSIS?</span>
            </div>

            {/* Register */}
            <Link to="/signup" className="lp-reg lp-field" style={{ "--fi": error ? 5 : 4 }}>
              Create an account
            </Link>
          </form>

          {/* Security note */}
          <footer className="lp-foot">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Protected with end-to-end encryption · TLS 1.3
          </footer>

        </div>
      </main>
    </div>
  );
}

export default LoginPage;
