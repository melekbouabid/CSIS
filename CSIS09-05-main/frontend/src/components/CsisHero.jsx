import React from "react";
import CsisLogo from "./CsisLogo";
import "./CsisHero.css";

export default function CsisHero() {
  return (
    <div className="csis-hero">
      <div className="csis-hero-content">
        <div className="csis-hero-logo">
          <CsisLogo size={200} />
        </div>
        <h1 className="csis-hero-title">CSIS</h1>
        <p className="csis-hero-subtitle">Criminal Study Intelligent System</p>
      </div>
    </div>
  );
}
