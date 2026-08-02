import React from "react";
import { useI18n } from "../context/I18nContext";
import "./Footer.css";

function Footer() {
  const { t } = useI18n();

  const trustedPartners = [
    { src: "/police.png", name: "Sûreté Nationale", sub: "Ministère de l'Intérieur" },
    { src: "/tunis.png", name: "République Tunisienne", sub: "Gouvernement" },
    { src: "/sos.png", name: "Protection de l'Enfant", sub: "Ben Arous · Tunis" },
    { src: "/adel.png", name: "Ministère de la Justice", sub: "Tunisie" },
    { src: "/1.jpg", name: "Partenaire Institutionnel", sub: "Tunisie" },
    { src: "/3.jpg", name: "Organisation Partenaire", sub: "Tunisie" },
    { src: "/2.svg", name: "Partenaire Associé", sub: "Tunisie" },
  ];

  return (
    <footer className="ft">
      <div className="ft-top-divider"></div>

      <div className="ft-main">
        {/* Brand Section */}
        <div className="ft-brand">
          <div className="ft-logo-row">
            <div className="ft-logo-img">
              <img src="/cesi.png" alt="CSIS" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          </div>
          <div className="ft-badge">
            <span>AI Intelligence Hub — Active</span>
          </div>
          <p className="ft-brand-desc">
            Turns complex behavioral and social signals into clear risk intelligence that institutions can act on early. Secure intelligence. Smarter prevention.
          </p>
        </div>

        {/* Product Section */}
        <div className="ft-col">
          <div className="ft-col-head">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Product</span>
          </div>
          <ul className="ft-links">
            <li><a href="/prediction">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              {t("nav.prediction")}
            </a></li>
            <li><a href="/dashboard">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              {t("nav.dashboard")}
            </a></li>
            <li><a href="#">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              Risk Scoring
            </a></li>
            <li><a href="/chatbot">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              {t("nav.chatbot")}
            </a></li>
            <li><a href="#">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              Analytics
            </a></li>
          </ul>
        </div>

        {/* Company Section */}
        <div className="ft-col">
          <div className="ft-col-head">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Company</span>
          </div>
          <ul className="ft-links">
            <li><a href="#">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              {t("footer.about")}
            </a></li>
            <li><a href="#">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              {t("footer.careers")}
            </a></li>
            <li><a href="#">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              {t("footer.privacy")}
            </a></li>
            <li><a href="#">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              {t("footer.terms")}
            </a></li>
          </ul>
        </div>

        {/* Contact Section */}
        <div className="ft-col">
          <div className="ft-col-head">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            <span>Contact</span>
          </div>
          <div className="ft-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            <a href="mailto:csis@gmail.com">csis@gmail.com</a>
          </div>
          <div className="ft-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>+216 98 745 455</span>
          </div>
          <div className="ft-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Tunis, Tunisie</span>
          </div>
          <div className="ft-social">
            <a href="#" aria-label="Facebook">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="ft-divider-wrap"><div className="ft-divider"></div></div>

      {/* Trusted Partners Section */}
      <div className="ft-trust">
        <div className="ft-trust-label">Trusted by</div>
        <div className="ft-trust-grid">
          {trustedPartners.map((partner, index) => (
            <div key={index} className="ft-trust-card">
              <img src={partner.src} alt={partner.name} className="ft-trust-image" />
              <span className="tc-name">{partner.name}</span>
              <span className="tc-sub">{partner.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ft-bottom">
        <span className="ft-copy">© 2026 <strong>CSIS</strong> — All rights reserved.</span>
        <div className="ft-links-bottom">
          <a href="#">{t("footer.privacy")}</a>
          <a href="#">{t("footer.terms")}</a>
          <a href="#">Compliance</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
