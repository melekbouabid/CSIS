import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [showNotif, setShowNotif] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Not yet");

  const oldPwdRef = useRef();
  const newPwdRef = useRef();
  const confirmPwdRef = useRef();

  useEffect(() => {
    setHasChanges(
      name !== (user?.name || "") ||
      email !== (user?.email || "") ||
      avatarPreview !== (user?.avatar || null)
    );
  }, [name, email, avatarPreview, user]);

  const profileCompleteness = [name?.trim(), email?.trim(), avatarPreview].filter(Boolean).length * 33;
  const securityScore = Math.min(100, Math.max(40, profileCompleteness - 10));

  function handleFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setErr("Image must be smaller than 5MB");
      setShowNotif(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setAvatarPreview(reader.result); setErr(null); };
    reader.readAsDataURL(f);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) { setErr("Name is required"); setShowNotif(true); return; }
    if (!email.trim()) { setErr("Email is required"); setShowNotif(true); return; }
    const res = await updateProfile({ email, name, avatar: avatarPreview });
    if (res.ok) {
      setMsg("Profile updated successfully!");
      setErr(null);
      setHasChanges(false);
      setLastUpdated(new Date().toLocaleString());
    } else {
      setErr(res.error || "Failed to update profile");
      setMsg(null);
    }
    setShowNotif(true);
    setTimeout(() => setShowNotif(false), 4000);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    const oldP = oldPwdRef.current.value;
    const newP = newPwdRef.current.value;
    const confirmP = confirmPwdRef.current.value;

    if (!oldP || !newP || !confirmP) { setErr("All password fields are required"); setShowNotif(true); return; }
    if (newP.length < 4) { setErr("New password must be at least 4 characters"); setShowNotif(true); return; }
    if (newP !== confirmP) { setErr("New passwords do not match"); setShowNotif(true); return; }

    const res = await changePassword(oldP, newP);
    if (res.ok) {
      setMsg("Password changed successfully!");
      setErr(null);
      oldPwdRef.current.value = "";
      newPwdRef.current.value = "";
      confirmPwdRef.current.value = "";
    } else {
      setErr(res.error);
      setMsg(null);
    }
    setShowNotif(true);
    setTimeout(() => setShowNotif(false), 4000);
  }

  return (
    <div className="pf-page">
      {/* Hero Banner */}
      <div className="profile-hero">
        <img src={avatarPreview || "/cesi.png"} alt="avatar" className="profile-hero-img" />
        <div className="profile-hero-info">
          <h2>{name || user?.name || t("profile.accountSettings")}</h2>
          <p>{email || user?.email}</p>
          <div className="profile-hero-chips">
            <span className="profile-hero-chip">✓ {t("profile.profileCompleteness")}: {profileCompleteness}%</span>
            <span className="profile-hero-chip">🔒 {t("profile.securityScore")}: {securityScore}%</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {showNotif && msg && (
        <div className="pf-notif pf-notif-success">
          <span>✓</span>
          <span>{msg}</span>
        </div>
      )}
      {showNotif && err && (
        <div className="pf-notif pf-notif-error">
          <span>✕</span>
          <span>{err}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="pf-stats-row">
        <div className="pf-stat-card">
          <div className="pf-stat-title">{t("profile.profileCompleteness")}</div>
          <div className="pf-stat-val">{profileCompleteness}%</div>
          <div className="pf-stat-bar">
            <div className="pf-stat-bar-fill" style={{ width: `${profileCompleteness}%` }} />
          </div>
        </div>
        <div className="pf-stat-card">
          <div className="pf-stat-title">{t("profile.securityScore")}</div>
          <div className="pf-stat-val">{securityScore}%</div>
          <div className="pf-stat-sub">Keep your password fresh every 30 days.</div>
        </div>
        <div className="pf-stat-card">
          <div className="pf-stat-title">{t("profile.lastUpdate")}</div>
          <div className="pf-stat-val-sm">{lastUpdated}</div>
          <div className="pf-stat-sub">Changes sync instantly to your session.</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="pf-tab-bar">
        <button
          className={`pf-tab-btn${activeTab === "personal" ? " active" : ""}`}
          onClick={() => setActiveTab("personal")}
        >
          👤 {t("profile.personalInfo")}
        </button>
        <button
          className={`pf-tab-btn${activeTab === "security" ? " active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          🔐 {t("profile.security")}
        </button>
      </div>

      {/* Personal tab */}
      {activeTab === "personal" && (
        <form onSubmit={handleSave}>
          <div className="pf-panel">
            {/* Avatar section */}
            <div className="pf-section">
              <h3 className="pf-section-title">Profile photo</h3>
              <div className="pf-avatar-row">
                <div>
                  <img src={avatarPreview || "/cesi.png"} alt="avatar" className="profile-avatar-large" />
                  <label className="pf-avatar-upload">
                    📷 Change photo
                    <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                  </label>
                  <div className="pf-avatar-hint">JPG, PNG • Max 5MB</div>
                </div>
                <div className="pf-avatar-tip">
                  <p style={{ margin: "0 0 6px" }}>Upload a clear photo of yourself. It will appear in your profile header.</p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#466e9e" }}>Recommended size: 400×400 pixels</p>
                </div>
              </div>
            </div>

            {/* Personal info section */}
            <div className="pf-section">
              <h3 className="pf-section-title">Personal information</h3>
              <div className="pf-field-grid">
                <div className="pf-field">
                  <label className="pf-field-label">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="profile-input"
                    placeholder="Your full name"
                  />
                  <p className="pf-field-hint">This name will appear in your profile and nav bar</p>
                </div>
                <div className="pf-field">
                  <label className="pf-field-label">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="profile-input"
                    placeholder="your@email.com"
                  />
                  <p className="pf-field-hint">Your login email address</p>
                </div>
              </div>
            </div>
          </div>

          {hasChanges && (
            <div className="pf-save-row">
              <button type="submit" className="pf-save-btn">✓ Save changes</button>
              <button
                type="button"
                className="pf-cancel-btn"
                onClick={() => {
                  setName(user?.name || "");
                  setEmail(user?.email || "");
                  setAvatarPreview(user?.avatar || null);
                  setHasChanges(false);
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <form onSubmit={handleChangePassword}>
          <div className="pf-security-card">
            <h3 className="pf-security-title">Change password</h3>
            <p className="pf-security-sub">
              Enhance your account security by updating your password regularly. Use a combination of letters, numbers, and symbols for better protection.
            </p>

            <div className="pf-pwd-field">
              <label className="pf-pwd-label">Current password</label>
              <input type="password" ref={oldPwdRef} className="profile-input" placeholder="Enter your current password" />
            </div>
            <div className="pf-pwd-field">
              <label className="pf-pwd-label">New password</label>
              <input type="password" ref={newPwdRef} className="profile-input" placeholder="Enter a new password (minimum 4 characters)" />
              <p className="pf-pwd-hint">Password must be at least 4 characters long</p>
            </div>
            <div className="pf-pwd-field">
              <label className="pf-pwd-label">Confirm new password</label>
              <input type="password" ref={confirmPwdRef} className="profile-input" placeholder="Confirm your new password" />
            </div>

            <button type="submit" className="pf-update-btn">🔒 Update password</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProfilePage;
