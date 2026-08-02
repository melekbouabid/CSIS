import { useMemo, useState } from "react";
import { useI18n } from "../context/I18nContext";
import { usePredictions } from "../context/PredictionsContext";

const fieldConfig = {
  gender: ["Homme", "Femme"],
  age: null,
  neighborhood_quality: ["Bon", "Moyen", "Pauvre", "Residentiel", "Tres pauvre"],
  neighborhood_safety_rating: null,
  academic_level: ["Analphabete", "Primaire", "College", "Lycee", "Bac", "Bac+2", "Licence", "Master", "Doctorat"],
  parental_education: ["Analphabete", "Primaire", "Secondaire", "Universitaire"],
  family_situation: ["Celibataire", "Marie(e)", "Divorce(e)", "Veuf/Veuve"],
  parental_marital_status: ["Maries", "Divorces", "Separes", "Veuf/Veuve", "Decedes"],
  family_criminal_history: ["Non", "Oui"],
  family_psychological_issues: ["Non", "Oui"],
  friend_in_jail: ["Non", "Oui"],
  has_psychological_problem: ["Non", "Oui"],
  psychological_condition: ["Aucun", "Trouble impulsif", "Schizophrenie", "Trouble de la personnalite antisociale"],
  mental_health_treatment: ["Aucun", "Therapie", "Medicaments", "Suivi psychiatrique", "Hospitalisation"],
  financial_situation: ["Aisee", "Moyenne", "Modeste", "Precaire", "Tres precaire"],
  debt_level: ["Aucune", "Faible", "Moderee", "Elevee", "Tres elevee"],
  employment_status: ["Employe", "Etudiant", "Retraite", "Chomeur", "Sans emploi", "Travailleur informel"],
  addiction_type: ["Aucune", "Tabac", "Alcool", "Cannabis", "Tramadol", "Cocaine", "Heroine", "Polytoxicomanie"],
};

const stepIcons = ["👤", "🏘️", "🧠", "💼"];

function PredictionPage() {
  const { t } = useI18n();
  const { addPrediction } = usePredictions();

  const steps = [
    { title: t("prediction.step1"), fields: ["gender", "age", "academic_level", "parental_education"] },
    {
      title: t("prediction.step2"),
      fields: ["neighborhood_quality", "neighborhood_safety_rating", "family_situation", "parental_marital_status", "family_criminal_history", "friend_in_jail"],
    },
    {
      title: t("prediction.step3"),
      fields: ["family_psychological_issues", "has_psychological_problem", "psychological_condition", "mental_health_treatment"],
    },
    { title: t("prediction.step4"), fields: ["financial_situation", "debt_level", "employment_status", "addiction_type"] },
  ];

  const initialState = useMemo(() => ({
    gender: "Homme",
    age: 30,
    neighborhood_quality: "Moyen",
    neighborhood_safety_rating: 5,
    academic_level: "Lycee",
    parental_education: "Primaire",
    family_situation: "Celibataire",
    parental_marital_status: "Maries",
    family_criminal_history: "Non",
    family_psychological_issues: "Non",
    friend_in_jail: "Non",
    has_psychological_problem: "Non",
    psychological_condition: "Aucun",
    mental_health_treatment: "Aucun",
    financial_situation: "Moyenne",
    debt_level: "Faible",
    employment_status: "Employe",
    addiction_type: "Aucune",
  }), []);

  const [form, setForm] = useState(initialState);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);


  const toPrettyLabel = (key) =>
    key.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: key === "age" || key === "neighborhood_safety_rating" ? Number(value) : value }));

  const RESULT_STEP = steps.length; // virtual step index shown after submission

  const onSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: form }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || t("prediction.failed"));
      setResult(data);
      addPrediction(form, data);   // persist to history
      setCurrentStep(RESULT_STEP); // navigate away from the form entirely
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setResult(null);
    setError("");
    setForm(initialState);
    setCurrentStep(0);
  };

  // ── Result screen (shown only after successful submission) ──────────────
  if (currentStep === RESULT_STEP && result) {
    const pct = Number(result.risk_percent) || 0;
    const r = 45;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    const color = pct >= 70 ? "#ef2f36" : pct >= 40 ? "#f59e0b" : "#22c55e";

    return (
      <section className="pred-page">
        <div className="pred-header">
          <div className="pred-header-icon">📊</div>
          <div className="pred-header-body">
            <div className="pred-header-kicker">{t("prediction.kicker")}</div>
            <h1 className="pred-header-title">{t("prediction.title")}</h1>
            <p className="pred-header-sub">{t("prediction.subtitle")}</p>
          </div>
          <div className="pred-progress-col">
            <div className="pred-progress-label">100% {t("prediction.complete")}</div>
            <div className="pred-progress-track">
              <div className="pred-progress-fill" style={{ width: "100%" }} />
            </div>
            <div className="pred-step-count">Assessment complete</div>
          </div>
        </div>

        <div className="pred-result">
          <div className="pred-result-gauge">
            <div className="gauge-circle">
              <svg className="gauge-svg" viewBox="0 0 110 110">
                <circle className="gauge-track" cx="55" cy="55" r={r} />
                <circle
                  className="gauge-fill"
                  cx="55" cy="55" r={r}
                  stroke={color}
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="gauge-text">{pct}%</div>
            </div>
            <span className="gauge-label">{t("prediction.risk")}</span>
          </div>
          <div>
            <h3 className="pred-result-title">{t("prediction.risk")}: {pct}%</h3>
            <div className="pred-result-row">
              <span className="pred-result-key">{t("prediction.decision")}</span>
              <span className="pred-result-val">{result.decision}</span>
            </div>
            <div className="pred-result-row">
              <span className="pred-result-key">{t("prediction.crimeType")}</span>
              <span className="pred-result-val">{result.predicted_crime_type}</span>
            </div>
            <div className="pred-actions" style={{ borderTop: "none", paddingTop: "1.4rem" }}>
              <button type="button" className="pred-btn-next" onClick={handleStartOver}>
                ← New Assessment
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Form screen ─────────────────────────────────────────────────────────
  const stepFields = steps[currentStep]?.fields ?? [];
  const isLastStep = currentStep === steps.length - 1;
  const progressPct = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <section className="pred-page">
      {/* Header */}
      <div className="pred-header">
        <div className="pred-header-icon">{stepIcons[currentStep]}</div>
        <div className="pred-header-body">
          <div className="pred-header-kicker">{t("prediction.kicker")}</div>
          <h1 className="pred-header-title">{t("prediction.title")}</h1>
          <p className="pred-header-sub">{t("prediction.subtitle")}</p>
        </div>
        <div className="pred-progress-col">
          <div className="pred-progress-label">{progressPct}% {t("prediction.complete")}</div>
          <div className="pred-progress-track">
            <div className="pred-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="pred-step-count">{t("prediction.step")} {currentStep + 1} / {steps.length}</div>
        </div>
      </div>

      {/* Stepper */}
      <div className="pred-stepper">
        {steps.map((step, i) => {
          const cls = i === currentStep
            ? "pred-step pred-step-active"
            : i < currentStep
            ? "pred-step pred-step-done"
            : "pred-step";
          return (
            <div key={i} className={cls}>
              <div className="pred-step-bubble">{i < currentStep ? "✓" : i + 1}</div>
              <span className="pred-step-label">{step.title}</span>
              {i < steps.length - 1 && <div className="pred-step-connector" />}
            </div>
          );
        })}
      </div>

      {/* Form */}
      <div className="pred-form-card">
        <h3 className="pred-form-title">
          {stepIcons[currentStep]} {t("prediction.step")} {currentStep + 1}: {steps[currentStep].title}
        </h3>
        <div className="pred-fields-grid">
          {stepFields.map((key) => {
            const options = fieldConfig[key];
            return (
              <label key={key} className="pred-field">
                <span className="pred-field-label">{toPrettyLabel(key)}</span>
                {options ? (
                  <select className="pred-field-input" value={form[key]} onChange={(e) => handleChange(key, e.target.value)}>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="pred-field-input"
                    type="number"
                    value={form[key]}
                    min={key === "age" ? 15 : 1}
                    max={key === "age" ? 65 : 10}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                )}
              </label>
            );
          })}

          <div className="pred-actions">
            <button
              type="button"
              className="pred-btn-back"
              onClick={() => setCurrentStep((p) => Math.max(p - 1, 0))}
              disabled={currentStep === 0 || loading}
            >
              ← {t("common.back")}
            </button>
            {isLastStep ? (
              <button type="button" className="pred-btn-submit" disabled={loading} onClick={onSubmit}>
                {loading ? t("prediction.predicting") : `${t("prediction.predict")} →`}
              </button>
            ) : (
              <button
                type="button"
                className="pred-btn-next"
                onClick={() => setCurrentStep((p) => Math.min(p + 1, steps.length - 1))}
                disabled={loading}
              >
                {t("common.next")} →
              </button>
            )}
          </div>
        </div>
        {error && <p className="error" style={{ margin: "0.8rem 0 0" }}>{error}</p>}
      </div>  {/* pred-form-card */}
    </section>
  );
}

export default PredictionPage;
