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
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.34, vy: (Math.random() - 0.5) * 0.34,
      r: Math.random() * 1.9 + 0.7, phase: Math.random() * Math.PI * 2,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.016;
        if (p.x < 0 || p.x > c.width)  p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77,171,247,${0.22 + Math.sin(p.phase) * 0.17})`;
        ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 125) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(13,110,253,${(1 - d / 125) * 0.22})`;
            ctx.lineWidth = 0.6;
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

function getPwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const PW_LABELS  = ["", "Weak", "Fair", "Good", "Strong"];
const PW_CLASSES = ["", "lp-pw-weak", "lp-pw-fair", "lp-pw-good", "lp-pw-strong"];

const BENEFITS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "AI Risk Predictions",
    desc: "XGBoost-powered 18-factor criminal behavior assessment",
    tag: "AI",
    color: "#3b82f6",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: "Legal Intelligence Chat",
    desc: "RAG chatbot over 1,485+ Tunisian law articles",
    tag: "RAG",
    color: "#8b5cf6",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    title: "Personal Dashboard",
    desc: "Track all your assessments and predictions in one place",
    tag: "Data",
    color: "#06b6d4",
  },
];

function SignupPage() {
  const [name, setName]         = useState("");
  const [age, setAge]           = useState("");
  const [phone, setPhone]       = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const auth     = useAuth();
  const { t }    = useI18n();
  const navigate = useNavigate();

  const pwStrength = getPwStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !age.trim() || !phone.trim() || !location.trim() || !email.trim() || !password.trim()) {
      return setError(t("auth.fillAll"));
    }
    const numericAge = Number(age);
    if (!Number.isFinite(numericAge) || numericAge < 1 || numericAge > 120) {
      return setError("Please enter a valid age.");
    }
    setLoading(true);
    setError(null);
    const res = await auth.signup(email.trim(), password, name.trim(), null, numericAge, phone.trim(), location.trim());
    setLoading(false);
    if (res.ok) navigate("/home");
    else setError(res.error || t("auth.signUpFailed"));
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
          <div className="lp-brand-copy">
            <span className="lp-brand-kicker">
              <span className="lp-brand-kicker-dot" aria-hidden="true" />
              Platform Registration
            </span>
            <h1 className="lp-brand-headline">Join CSIS Platform</h1>
            <p className="lp-brand-lead">
              Gain full access to AI-driven criminal risk assessment and Tunisian legal intelligence tools.
            </p>
          </div>

          <ul className="lp-feats">
            {BENEFITS.map((b, i) => (
              <li
                key={i}
                className="lp-feat"
                style={{
                  "--fi": i,
                  "--fc": b.color,
                  "--fc-bg": b.color + "1a",
                  "--fc-border": b.color + "30",
                }}
              >
                <span className="lp-feat-icon">{b.icon}</span>
                <div className="lp-feat-content">
                  <div className="lp-feat-row">
                    <div className="lp-feat-name">{b.title}</div>
                    <span className="lp-feat-tag">{b.tag}</span>
                  </div>
                  <div className="lp-feat-desc">{b.desc}</div>
                </div>
              </li>
            ))}
          </ul>

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
      <main className="lp-panel lp-panel-su">
        <div className="lp-panel-glow lp-panel-glow-1" aria-hidden="true" />
        <div className="lp-panel-glow lp-panel-glow-2" aria-hidden="true" />
        <div className="lp-panel-mesh" aria-hidden="true" />

        <div className="lp-panel-inner lp-panel-inner-su">

          {/* Header */}
          <div className="lp-head lp-head-su">
            <span className="lp-head-badge">
              <span className="lp-head-ring" aria-hidden="true" />
              <span className="lp-head-dot" />
              New Account
            </span>
            <h2 className="lp-head-title">Create account</h2>
            <p className="lp-head-sub">Join law enforcement professionals on CSIS</p>
          </div>

          {/* Form */}
          <form className="lp-form lp-form-grid" onSubmit={handleSubmit} noValidate>

            {/* Full name */}
            <div className="lp-field lp-span2" style={{ "--fi": 0 }}>
              <label className="lp-lbl">{t("auth.fullName")}</label>
              <div className="lp-ctrl">
                <span className="lp-ctrl-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  className="lp-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.yourName")}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Age */}
            <div className="lp-field" style={{ "--fi": 1 }}>
              <label className="lp-lbl">{t("common.age")}</label>
              <div className="lp-ctrl">
                <span className="lp-ctrl-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
                <input
                  className="lp-input"
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="18"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="lp-field" style={{ "--fi": 1 }}>
              <label className="lp-lbl">{t("common.phone")}</label>
              <div className="lp-ctrl">
                <span className="lp-ctrl-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
                <input
                  className="lp-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+216 00 000 000"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="lp-field lp-span2" style={{ "--fi": 2 }}>
              <label className="lp-lbl">{t("common.location")}</label>
              <div className="lp-ctrl">
                <span className="lp-ctrl-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                <input
                  className="lp-input"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Tunis, Tunisia"
                  autoComplete="country"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="lp-field lp-span2" style={{ "--fi": 3 }}>
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
            <div className="lp-field lp-span2" style={{ "--fi": 4 }}>
              <label className="lp-lbl">{t("common.password")}</label>
              <div className="lp-ctrl">
                <span className="lp-ctrl-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  className="lp-input lp-input-pw"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "Hide" : "Show"}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <div className={`lp-pw-strength ${PW_CLASSES[pwStrength]}`}>
                  <div className="lp-pw-bars">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className={`lp-pw-bar${pwStrength >= n ? " active" : ""}`} />
                    ))}
                  </div>
                  <span className="lp-pw-label">{PW_LABELS[pwStrength]}</span>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="lp-err lp-span2 lp-field" style={{ "--fi": 5 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="lp-submit lp-span2 lp-field"
              type="submit"
              disabled={loading}
              style={{ "--fi": error ? 6 : 5 }}
            >
              {loading
                ? <span className="lp-dots"><span/><span/><span/></span>
                : <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lp-submit-icon">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    <span>{t("auth.createAccountBtn")}</span>
                  </>
              }
            </button>

            {/* Divider */}
            <div className="lp-sep lp-span2 lp-field" style={{ "--fi": error ? 7 : 6 }}>
              <span>Already on CSIS?</span>
            </div>

            {/* Sign in link */}
            <Link to="/login" className="lp-reg lp-span2 lp-field" style={{ "--fi": error ? 8 : 7 }}>
              Sign in to your account
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

export default SignupPage;
