import { useEffect } from "react";
import { NavLink, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PredictionPage from "./pages/PredictionPage";
import DashboardPage from "./pages/DashboardPage";
import ChatbotPage from "./pages/ChatbotPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import InfosPage from "./pages/InfosPage";
import { useAuth } from "./context/AuthContext";
import Footer from "./components/Footer";
import { useLocation } from "react-router-dom";
import { useI18n } from "./context/I18nContext";

function App() {
  const { user, signout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const isHomePage = location.pathname === "/home";

  useEffect(() => {
    // Applique un background différent à tout le site sauf la page Home
    document.body.classList.toggle("non-home-body", !isHomePage);
    return () => document.body.classList.remove("non-home-body");
  }, [isHomePage]);

  const navItems = [
    { to: "/home", label: t("nav.home") },
    { to: "/prediction", label: t("nav.prediction") },
    { to: "/dashboard", label: t("nav.dashboard") },
    { to: "/chatbot", label: t("nav.chatbot") },
    { to: "/infos", label: t("nav.infos") },
  ];

  function handleSignOut() {
    signout();
    navigate("/login");
  }

  const languageOptions = [
    { code: "en", short: "EN", label: t("common.english") },
    { code: "fr", short: "FR", label: t("common.french") },
    { code: "ar", short: "AR", label: t("common.arabic") },
  ];

  const languageSwitcher = (
    <div className="lang-switcher" role="group" aria-label={t("common.language")}>
      <span className="lang-globe" aria-hidden="true">🌐</span>
      {languageOptions.map((option) => (
        <button
          key={option.code}
          type="button"
          className={lang === option.code ? "lang-chip active" : "lang-chip"}
          onClick={() => setLang(option.code)}
          aria-label={option.label}
          aria-pressed={lang === option.code}
        >
          {option.short}
        </button>
      ))}
    </div>
  );

  return (
    <div className={isHomePage ? "app-shell" : "app-shell non-home"}>
      {!isAuthPage && user && (
        <header className="top-nav">
          <div className="nav-brand">
            <span className="nav-brand-title">CSIS</span>
            <span className="nav-brand-dot" aria-hidden="true" />
          </div>
          <nav className="top-nav-links" aria-label="Application navigation">
            {languageSwitcher}
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/profile" className="nav-link" style={{ padding: 0 }}>
              <img src={user.avatar || "/cesi.png"} alt="profile" className="avatar-small" />
            </NavLink>
            <span className="nav-link" style={{ cursor: "default", fontWeight: 700 }}>{user.name || user.email}</span>
            <button className="nav-sign-out" onClick={handleSignOut}>
              {t("common.signOut")}
            </button>
          </nav>
        </header>
      )}

      {!isAuthPage && !user && (
        <div className="auth-lang-row">
          {languageSwitcher}
        </div>
      )}

      <main className="content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/home"
            element={user ? <HomePage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/prediction"
            element={user ? <PredictionPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/dashboard"
            element={user ? <DashboardPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/chatbot"
            element={user ? <ChatbotPage /> : <Navigate to="/login" replace />}
          />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/infos" element={user ? <InfosPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={user ? <Navigate to="/home" /> : <Navigate to="/login" />} />
        </Routes>
      </main>
      {/* show footer on all pages except the dedicated Chatbot page */}
      {!isAuthPage && location.pathname !== "/chatbot" && <Footer />}
    </div>
  );
}

export default App;
