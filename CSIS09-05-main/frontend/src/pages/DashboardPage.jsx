import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "../context/I18nContext";

const ALL = "__ALL__";
const years = ["1980", "1985", "1990", "1995", "2000"];
const regions = ["Grand Tunis", "Nord", "Centre", "Sahel", "Sud"];
const riskTypes = ["High Risk", "Moderate Risk", "Low Risk"];
const themes = {
  "Ember Noir": {
    bar: "#ef2f36",
    high: "#d81f31",
    moderate: "#f59e0b",
    low: "#84cc16",
    chartBg: "#050b19",
  },
  "Metro Glow": {
    bar: "#0d6efd",
    high: "#2563eb",
    moderate: "#14b8a6",
    low: "#22c55e",
    chartBg: "#041323",
  },
};

function cleanFeatureName(name) {
  return String(name || "")
    .replace("cat__", "")
    .replace("num__", "")
    .replace(/_/g, " ")
    .trim();
}

function decorateRows(inputRows) {
  return inputRows.map((row, index) => {
    const rank = Number(row.Rank ?? index + 1);
    const year = years[1 + (index % (years.length - 1))];
    const region = regions[1 + (index % (regions.length - 1))];
    const riskType = rank <= 5 ? "High Risk" : rank <= 10 ? "Moderate Risk" : "Low Risk";

    return {
      ...row,
      Rank: rank,
      Year: year,
      Region: region,
      RiskType: riskType,
      FeatureLabel: cleanFeatureName(row.Feature),
      ImportancePct: Number(row.ImportancePct || 0),
    };
  });
}

function buildCategoryRows(rows) {
  const rules = {
    Genre: ["gender"],
    Quartier: ["neighborhood"],
    "Niveau academique": ["academic", "education"],
    "Antecedents familiaux": ["family", "parental", "friend"],
  };

  return Object.entries(rules).map(([title, keywords]) => {
    const subset = rows
      .filter((row) => keywords.some((keyword) => String(row.Feature || "").toLowerCase().includes(keyword)))
      .slice(0, 2);

    const fallback = rows.slice(0, 2);
    const selected = subset.length > 0 ? subset : fallback;

    return {
      title,
      lines: selected.map((row) => `${row.FeatureLabel}: ${row.ImportancePct.toFixed(0)}%`),
    };
  });
}

function DashboardPage() {
  const { t } = useI18n();

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [themeName, setThemeName] = useState("Ember Noir");
  const [topN, setTopN] = useState(15);
  const [selectedYear, setSelectedYear] = useState(ALL);
  const [selectedRegion, setSelectedRegion] = useState(ALL);
  const [selectedRiskType, setSelectedRiskType] = useState(ALL);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/feature-importance");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(t("dashboard.failed"));
        }
        setRows(Array.isArray(data) ? decorateRows(data) : []);
      } catch (err) {
        setError(err.message);
      }
    };

    loadData();
  }, []);

  const theme = themes[themeName];

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const yearOk = selectedYear === ALL || String(row.Year) === selectedYear;
      const regionOk = selectedRegion === ALL || row.Region === selectedRegion;
      const riskOk = selectedRiskType === ALL || row.RiskType === selectedRiskType;
      return yearOk && regionOk && riskOk;
    });
  }, [rows, selectedYear, selectedRegion, selectedRiskType]);

  const topFeatures = useMemo(
    () => filteredRows.slice().sort((a, b) => b.ImportancePct - a.ImportancePct).slice(0, topN),
    [filteredRows, topN]
  );

  const riskSplit = useMemo(() => {
    const high = filteredRows.filter((row) => row.RiskType === "High Risk").reduce((sum, row) => sum + row.ImportancePct, 0);
    const moderate = filteredRows
      .filter((row) => row.RiskType === "Moderate Risk")
      .reduce((sum, row) => sum + row.ImportancePct, 0);
    const low = filteredRows.filter((row) => row.RiskType === "Low Risk").reduce((sum, row) => sum + row.ImportancePct, 0);
    const total = high + moderate + low || 1;

    return [
      { name: t("dashboard.high"), value: (high / total) * 100, color: theme.high },
      { name: t("dashboard.moderate"), value: (moderate / total) * 100, color: theme.moderate },
      { name: t("dashboard.low"), value: (low / total) * 100, color: theme.low },
    ];
  }, [filteredRows, t, theme.high, theme.low, theme.moderate]);

  const categoryRows = useMemo(() => {
    const rowsWithTitles = buildCategoryRows(topFeatures);
    const translatedTitles = [t("dashboard.cat1"), t("dashboard.cat2"), t("dashboard.cat3"), t("dashboard.cat4")];
    return rowsWithTitles.map((entry, idx) => ({ ...entry, title: translatedTitles[idx] || entry.title }));
  }, [topFeatures, t]);

  const kpiClass = (name) => {
    if (name === t("dashboard.high")) return "kpi-v2 kpi-high";
    if (name === t("dashboard.moderate")) return "kpi-v2 kpi-moderate";
    return "kpi-v2 kpi-low";
  };

  return (
    <section className="dashboard-page">
      <div className="page-header-card">
        <div>
          <div className="ph-badge">📊 Analytics</div>
          <h1 className="ph-title">{t("dashboard.title")}</h1>
          <p className="ph-sub">{t("dashboard.subtitle")}</p>
        </div>
      </div>

      <div className="dashboard-filter-card">
        <label>
          {t("dashboard.style")}
          <select value={themeName} onChange={(event) => setThemeName(event.target.value)}>
            {Object.keys(themes).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("dashboard.topFeatures")}
          <select value={topN} onChange={(event) => setTopN(Number(event.target.value))}>
            {[5, 10, 15].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("dashboard.year")}
          <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
            <option value={ALL}>{t("dashboard.allYear")}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("dashboard.region")}
          <select value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
            <option value={ALL}>{t("dashboard.allRegion")}</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("dashboard.riskType")}
          <select value={selectedRiskType} onChange={(event) => setSelectedRiskType(event.target.value)}>
            <option value={ALL}>{t("dashboard.allRisk")}</option>
            {riskTypes.map((risk) => (
              <option key={risk} value={risk}>
                {risk === "High Risk" ? t("dashboard.high") : risk === "Moderate Risk" ? t("dashboard.moderate") : t("dashboard.low")}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="dashboard-main-grid">
        <div className="dashboard-chart-card panel" style={{ background: theme.chartBg }}>
          <h2>{t("dashboard.topTitle", { count: topN })}</h2>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={topFeatures} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#19304f" />
              <XAxis type="number" stroke="#cfe4ff" />
              <YAxis dataKey="FeatureLabel" type="category" stroke="#cfe4ff" width={170} />
              <Tooltip />
              <Bar dataKey="ImportancePct" fill={theme.bar} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-chart-card panel" style={{ background: theme.chartBg }}>
          <h2>{t("dashboard.splitTitle")}</h2>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie data={riskSplit} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                {riskSplit.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-kpi-column">
          {riskSplit.map((item) => (
            <div className={kpiClass(item.name)} key={item.name}>
              <div className="kpi-v2-label">{item.name}</div>
              <p className="kpi-v2-value">{item.value.toFixed(0)}%</p>
              <div className="kpi-v2-sub">of total risk weight</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-insight-grid">
        {categoryRows.map((category) => (
          <div className="panel insight-card" key={category.title}>
            <h4>{category.title}</h4>
            {category.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default DashboardPage;
