from __future__ import annotations

import io
from pathlib import Path
import re

import joblib
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components
from PIL import Image, ImageDraw, ImageFont

from train_models import FEATURE_COLUMNS, RISK_THRESHOLD


BASE_DIR = Path(__file__).resolve().parent
RISK_MODEL_PATH = BASE_DIR / "risk_model.joblib"
CRIME_MODEL_PATH = BASE_DIR / "crime_type_model.joblib"
CRIME_LABEL_ENCODER_PATH = BASE_DIR / "crime_label_encoder.joblib"
FEATURE_IMPORTANCE_PATH = BASE_DIR / "powerbi_feature_importance.csv"

TEXTS = {
    "fr": {
        "page_title": "Prédiction du risque criminel",
        "language": "Langue",
        "title": "Prédiction du risque criminel futur",
        "intro": "Cette application estime le pourcentage de risque criminel futur. Si le risque dépasse 20%, elle prédit aussi le type de crime probable.",
        "missing_models": "Modèles introuvables. Lancez d'abord `python train_models.py` pour générer les fichiers risk_model.joblib, crime_type_model.joblib et crime_label_encoder.joblib.",
        "profile": "Profil à évaluer",
        "predict": "Prédire",
        "result": "### Résultat",
        "risk_percent": "Pourcentage de risque",
        "high_risk": "Risque élevé détecté (>20%).",
        "low_risk": "Risque faible (<=20%).",
        "crime_type": "Type de crime probable",
        "no_crime": "Pas de futur criminel",
    },
    "en": {
        "page_title": "Criminal Risk Prediction",
        "language": "Language",
        "title": "Future criminal risk prediction",
        "intro": "This app estimates future criminal risk percentage. If risk exceeds 20%, it also predicts the most likely crime type.",
        "missing_models": "Models not found. Run `python train_models.py` first to generate risk_model.joblib, crime_type_model.joblib and crime_label_encoder.joblib.",
        "profile": "Profile to evaluate",
        "predict": "Predict",
        "result": "### Result",
        "risk_percent": "Risk percentage",
        "high_risk": "High risk detected (>20%).",
        "low_risk": "Low risk (<=20%).",
        "crime_type": "Likely crime type",
        "no_crime": "No future criminal",
    },
}


@st.cache_resource
def load_artifacts():
    risk_model = joblib.load(RISK_MODEL_PATH)
    crime_model = joblib.load(CRIME_MODEL_PATH)
    crime_label_encoder = joblib.load(CRIME_LABEL_ENCODER_PATH)
    return risk_model, crime_model, crime_label_encoder


@st.cache_data
def load_feature_importance() -> pd.DataFrame:
    if not FEATURE_IMPORTANCE_PATH.exists():
        return pd.DataFrame()

    df = pd.read_csv(FEATURE_IMPORTANCE_PATH)
    expected = {"Rank", "Feature", "Importance", "ImportancePct", "CumulativeImportancePct"}
    if not expected.issubset(set(df.columns)):
        return pd.DataFrame()

    return df.sort_values("Rank").copy()


def _build_feature_chart_image(df: pd.DataFrame, top_n: int) -> Image.Image:
    subset = df.sort_values("Importance", ascending=False).head(top_n).iloc[::-1].reset_index(drop=True)

    width, height = 1600, 900
    canvas = Image.new("RGB", (width, height), "#0b132b")
    draw = ImageDraw.Draw(canvas)
    font_title = ImageFont.load_default()
    font_label = ImageFont.load_default()

    draw.text((40, 20), f"Top {top_n} Feature Importances", fill="#f1f5f9", font=font_title)
    draw.text((40, 50), "Source: powerbi_feature_importance.csv", fill="#94a3b8", font=font_label)

    chart_left = 420
    chart_right = width - 80
    chart_top = 100
    chart_bottom = height - 70
    chart_height = chart_bottom - chart_top
    row_h = max(18, chart_height // max(len(subset), 1))

    max_imp = float(subset["Importance"].max()) if not subset.empty else 1.0
    if max_imp <= 0:
        max_imp = 1.0

    for i, row in subset.iterrows():
        y0 = chart_top + i * row_h + 2
        y1 = y0 + row_h - 4
        label = str(row["Feature"])[:60]
        val = float(row["Importance"])
        bar_len = int((val / max_imp) * (chart_right - chart_left))

        draw.text((40, y0), label, fill="#e2e8f0", font=font_label)
        draw.rectangle([chart_left, y0, chart_left + bar_len, y1], fill="#38bdf8")
        draw.text((chart_left + bar_len + 8, y0), f"{val:.4f}", fill="#f8fafc", font=font_label)

    return canvas


def _image_to_png_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def _image_to_pdf_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image_rgb = image.convert("RGB")
    image_rgb.save(buf, format="PDF")
    return buf.getvalue()


def _render_theme() -> None:
    st.markdown(
        """
        <style>
            :root {
                --bg-main: #070b17;
                --bg-card: rgba(18, 24, 41, 0.78);
                --line-soft: rgba(148, 163, 184, 0.28);
                --text-main: #f8fafc;
                --text-muted: #cbd5e1;
            }

            @keyframes riseIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .stApp {
                background: radial-gradient(circle at 10% 10%, #1b2540 0%, #0b132b 45%, #060a17 100%);
                color: var(--text-main);
                font-family: "Bahnschrift", "Trebuchet MS", "Segoe UI", sans-serif;
            }
            .block-container {padding-top: 1.5rem;}

            .header-shell {
                border: 1px solid var(--line-soft);
                border-radius: 14px;
                padding: 0.9rem 1rem;
                background: linear-gradient(120deg, rgba(31,41,55,.9), rgba(15,23,42,.8));
                animation: riseIn .45s ease-out;
            }

            .kpi-box {
                border-radius: 10px;
                padding: 1rem;
                color: #f8fafc;
                margin-bottom: .7rem;
                animation: riseIn .55s ease-out;
            }

            .mini-card-title {
                font-weight: 700;
                margin-bottom: .5rem;
            }

            .mini-row {
                display: flex;
                align-items: center;
                gap: .4rem;
                margin: .35rem 0;
            }

            .mini-label {
                min-width: 125px;
                font-size: .8rem;
                color: #e2e8f0;
            }

            .mini-track {
                flex: 1;
                height: 8px;
                border-radius: 999px;
                background: rgba(148,163,184,.25);
                overflow: hidden;
            }

            .mini-fill {
                height: 100%;
                border-radius: 999px;
                transition: width 0.7s ease-in-out;
            }

            .mini-pct {
                min-width: 34px;
                text-align: right;
                font-size: .8rem;
                color: #f8fafc;
            }

            .metric-card {
                border: 1px solid var(--line-soft);
                border-radius: 14px;
                padding: 1rem;
                background: var(--bg-card);
                backdrop-filter: blur(4px);
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _clean_feature_label(raw_name: str) -> str:
    clean = raw_name.replace("cat__", "").replace("num__", "")
    clean = re.sub(r"_+", " ", clean).strip()
    return clean


def _build_risk_split(view: pd.DataFrame) -> pd.DataFrame:
    ordered = view.sort_values("ImportancePct", ascending=False).reset_index(drop=True)
    n = len(ordered)
    high_end = max(1, int(round(n * 0.34)))
    moderate_end = max(high_end + 1, int(round(n * 0.67)))

    high = float(ordered.iloc[:high_end]["ImportancePct"].sum())
    moderate = float(ordered.iloc[high_end:moderate_end]["ImportancePct"].sum())
    low = float(ordered.iloc[moderate_end:]["ImportancePct"].sum())

    out = pd.DataFrame(
        [
            {"Risk": "High Risk", "Value": high},
            {"Risk": "Moderate Risk", "Value": moderate},
            {"Risk": "Low Risk", "Value": low},
        ]
    )

    total = float(out["Value"].sum())
    if total > 0:
        out["Value"] = (out["Value"] / total) * 100.0
    return out


def _add_dashboard_dimensions(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    years = [1980, 1985, 1990, 1995, 2000]
    regions = ["Grand Tunis", "Nord", "Centre", "Sahel", "Sud"]

    out["Year"] = [years[i % len(years)] for i in range(len(out))]
    out["Region"] = [regions[i % len(regions)] for i in range(len(out))]
    out["RiskType"] = out["Rank"].apply(
        lambda r: "High Risk" if r <= 5 else ("Moderate Risk" if r <= 10 else "Low Risk")
    )
    return out


def _get_theme_palette(theme_name: str) -> dict[str, str]:
    if theme_name == "Ember Noir":
        return {
            "bar": "#d62828",
            "high": "#cf1f2f",
            "moderate": "#f59e0b",
            "low": "#84cc16",
            "accent": "#38bdf8",
        }

    return {
        "bar": "#7c3aed",
        "high": "#a21caf",
        "moderate": "#eab308",
        "low": "#22c55e",
        "accent": "#0ea5e9",
    }


def _build_category_rows(view: pd.DataFrame) -> dict[str, list[dict[str, float | str]]]:
    category_rules = {
        "Genre": ["gender"],
        "Quartier": ["neighborhood"],
        "Niveau académique": ["academic", "education"],
        "Antécédents familiaux": ["family", "parental", "friend in jail", "criminal history"],
    }

    prepared = view.copy()
    prepared["FeatureLower"] = prepared["Feature"].str.lower()
    prepared["FeatureLabel"] = prepared["Feature"].map(_clean_feature_label)

    result: dict[str, list[dict[str, float | str]]] = {}
    for category, keywords in category_rules.items():
        mask = prepared["FeatureLower"].apply(lambda x: any(k in x for k in keywords))
        subset = prepared.loc[mask].head(3)

        if subset.empty:
            subset = prepared.head(3)

        rows = []
        for _, row in subset.iterrows():
            rows.append(
                {
                    "label": str(row["FeatureLabel"])[:22],
                    "pct": float(row["ImportancePct"]),
                }
            )
        result[category] = rows

    return result


def _render_category_card(title: str, rows: list[dict[str, float | str]], color: str) -> None:
    html_rows: list[str] = []
    for row in rows:
        pct = max(0.0, min(100.0, float(row["pct"])))
        html_rows.append(
            f"""
            <div class="mini-row">
                <span class="mini-label">{row["label"]}</span>
                <div class="mini-track"><div class="mini-fill" style="width:{pct:.1f}%; background:{color};"></div></div>
                <span class="mini-pct">{pct:.0f}%</span>
            </div>
            """
        )

    html = f"""
    <html>
    <head>
      <style>
        body {{ margin: 0; background: transparent; font-family: 'Bahnschrift', 'Trebuchet MS', 'Segoe UI', sans-serif; color: #f8fafc; }}
        .mini-card-title {{ font-weight: 700; margin-bottom: 10px; font-size: 1.0rem; }}
        .mini-row {{ display: flex; align-items: center; gap: 8px; margin: 10px 0; }}
        .mini-label {{ min-width: 125px; font-size: 0.8rem; color: #e2e8f0; }}
        .mini-track {{ flex: 1; height: 8px; border-radius: 999px; background: rgba(148,163,184,.25); overflow: hidden; }}
        .mini-fill {{ height: 100%; border-radius: 999px; }}
        .mini-pct {{ min-width: 34px; text-align: right; font-size: 0.8rem; color: #f8fafc; }}
      </style>
    </head>
    <body>
      <div class="mini-card-title">{title}</div>
      {''.join(html_rows)}
    </body>
    </html>
    """
    components.html(html, height=190 + (len(rows) * 46), scrolling=False)


def build_input_form(ui: dict) -> dict:
    st.subheader(ui["profile"])

    col1, col2 = st.columns(2)

    with col1:
        gender = st.selectbox("Genre", ["Homme", "Femme"])
        age = st.slider("Âge", min_value=15, max_value=65, value=30, step=1)
        neighborhood_quality = st.selectbox(
            "Qualité du quartier",
            ["Bon", "Moyen", "Pauvre", "Résidentiel", "Très pauvre"],
        )
        neighborhood_safety_rating = st.slider(
            "Niveau de sécurité du quartier (1-10)",
            min_value=1,
            max_value=10,
            value=5,
            step=1,
        )
        academic_level = st.selectbox(
            "Niveau académique",
            [
                "Analphabète",
                "Primaire",
                "Collège",
                "Lycée",
                "Bac",
                "Bac+2",
                "Licence",
                "Master",
                "Doctorat",
            ],
        )
        parental_education = st.selectbox(
            "Niveau d'éducation des parents",
            ["Analphabète", "Primaire", "Secondaire", "Universitaire"],
        )
        family_situation = st.selectbox(
            "Situation familiale",
            ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve"],
        )
        parental_marital_status = st.selectbox(
            "Statut marital des parents",
            ["Mariés", "Divorcés", "Séparés", "Veuf/Veuve", "Décédés"],
        )
        family_criminal_history = st.selectbox(
            "Antécédents criminels familiaux",
            ["Non", "Oui"],
        )

    with col2:
        family_psychological_issues = st.selectbox(
            "Problèmes psychologiques familiaux",
            ["Non", "Oui"],
        )
        friend_in_jail = st.selectbox("Ami en prison", ["Non", "Oui"])
        has_psychological_problem = st.selectbox(
            "Problème psychologique personnel",
            ["Non", "Oui"],
        )
        psychological_condition = st.selectbox(
            "Condition psychologique",
            [
                "Aucun",
                "Trouble impulsif",
                "Schizophrénie",
                "Trouble de la personnalité antisociale",
            ],
        )
        mental_health_treatment = st.selectbox(
            "Traitement en santé mentale",
            ["Aucun", "Thérapie", "Médicaments", "Suivi psychiatrique", "Hospitalisation"],
        )
        financial_situation = st.selectbox(
            "Situation financière",
            ["Aisée", "Moyenne", "Modeste", "Précaire", "Très précaire"],
        )
        debt_level = st.selectbox(
            "Niveau d'endettement",
            ["Aucune", "Faible", "Modérée", "Élevée", "Très élevée"],
        )
        employment_status = st.selectbox(
            "Statut d'emploi",
            ["Employé", "Étudiant", "Retraité", "Chômeur", "Sans emploi", "Travailleur informel"],
        )
        addiction_type = st.selectbox(
            "Type d'addiction",
            ["Aucune", "Tabac", "Alcool", "Cannabis", "Tramadol", "Cocaïne", "Héroïne", "Polytoxicomanie"],
        )

    profile = {
        "gender": gender,
        "age": age,
        "neighborhood_quality": neighborhood_quality,
        "neighborhood_safety_rating": neighborhood_safety_rating,
        "academic_level": academic_level,
        "parental_education": parental_education,
        "family_situation": family_situation,
        "parental_marital_status": parental_marital_status,
        "family_criminal_history": family_criminal_history,
        "family_psychological_issues": family_psychological_issues,
        "friend_in_jail": friend_in_jail,
        "has_psychological_problem": has_psychological_problem,
        "psychological_condition": psychological_condition,
        "mental_health_treatment": mental_health_treatment,
        "financial_situation": financial_situation,
        "debt_level": debt_level,
        "employment_status": employment_status,
        "addiction_type": addiction_type,
    }

    # Ensure output dict follows the same feature order as training.
    return {feature: profile[feature] for feature in FEATURE_COLUMNS}


def main() -> None:
    st.set_page_config(page_title=TEXTS["fr"]["page_title"], page_icon="⚖️", layout="wide")
    _render_theme()

    language = st.sidebar.selectbox(
        "Language / Langue",
        options=["fr", "en"],
        format_func=lambda x: "Français" if x == "fr" else "English",
    )
    ui = TEXTS[language]

    st.title(ui["title"])
    st.write(ui["intro"])

    tab_predict, tab_dashboard = st.tabs(["Prediction", "Feature Dashboard"])

    with tab_predict:
        if not RISK_MODEL_PATH.exists() or not CRIME_MODEL_PATH.exists() or not CRIME_LABEL_ENCODER_PATH.exists():
            st.error(ui["missing_models"])
            st.stop()

        risk_model, crime_model, crime_label_encoder = load_artifacts()

        with st.form("risk_form"):
            input_profile = build_input_form(ui)
            submitted = st.form_submit_button(ui["predict"], use_container_width=True)

        if submitted:
            input_df = pd.DataFrame([input_profile])
            risk_probability = float(risk_model.predict_proba(input_df)[0][1])
            risk_percent = round(risk_probability * 100, 2)

            is_high_risk = risk_probability > RISK_THRESHOLD
            risk_color = "#ff4b4b" if is_high_risk else "#16a34a"

            st.markdown(ui["result"])
            st.markdown(
                f"""
                <div style=\"padding: 1rem; border-radius: 0.75rem; border: 1px solid #d1d5db;\">
                    <p style=\"margin: 0; font-size: 1.1rem;\">{ui['risk_percent']}</p>
                    <p style=\"margin: 0.25rem 0 0 0; font-size: 2rem; font-weight: 700; color: {risk_color};\">{risk_percent}%</p>
                </div>
                """,
                unsafe_allow_html=True,
            )

            if is_high_risk:
                predicted_class_idx = int(crime_model.predict(input_df)[0])
                predicted_crime = str(crime_label_encoder.inverse_transform([predicted_class_idx])[0])
                st.error(ui["high_risk"])
                st.info(f"{ui['crime_type']}: **{predicted_crime}**")
            else:
                st.success(ui["low_risk"])
                st.info(f"{ui['crime_type']}: {ui['no_crime']}")

    with tab_dashboard:
        fi = load_feature_importance()
        if fi.empty:
            st.warning("Fichier powerbi_feature_importance.csv introuvable. Lancez d'abord python train_models.py")
            return

        fi = _add_dashboard_dimensions(fi)

        theme_col, fx_col, year_col, region_col, risk_col = st.columns([1.15, 0.85, 0.9, 1.05, 1.05])
        with theme_col:
            dashboard_theme = st.selectbox("Style", ["Ember Noir", "Metro Glow"], index=0)
        with fx_col:
            top_n = st.selectbox("Top features", options=[5, 10, 12, 15], index=3)
        with year_col:
            year_choice = st.selectbox("Année", options=["Toutes"] + sorted(fi["Year"].unique().tolist()))
        with region_col:
            region_choice = st.selectbox("Région", options=["Toutes"] + sorted(fi["Region"].unique().tolist()))
        with risk_col:
            risk_choice = st.selectbox(
                "Type risque",
                options=["Tous", "High Risk", "Moderate Risk", "Low Risk"],
            )

        palette = _get_theme_palette(dashboard_theme)

        filtered = fi.copy()
        if year_choice != "Toutes":
            filtered = filtered[filtered["Year"] == year_choice]
        if region_choice != "Toutes":
            filtered = filtered[filtered["Region"] == region_choice]
        if risk_choice != "Tous":
            filtered = filtered[filtered["RiskType"] == risk_choice]

        if filtered.empty:
            st.warning("Aucun résultat pour ce filtre. Affichage global rétabli.")
            filtered = fi.copy()

        left_head, right_head = st.columns([5, 2])
        with left_head:
            st.markdown(
                """
                <div class="header-shell">
                    <h1 style="margin:0; font-size:2.1rem; line-height:1.1;">RISQUE DÉLINQUANCE JUVÉNILE - TUNISIE</h1>
                    <p style="margin:.2rem 0 0 0; color:#cbd5e1; font-size:1.15rem;">Power BI style dashboard</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with right_head:
            st.markdown(
                """
                <div class="header-shell" style="padding:.72rem .9rem;">
                    <div style="font-size:.82rem; color:#cbd5e1;">Filtres actifs</div>
                    <div style="font-size:1rem; font-weight:700;">Dashboard dynamique</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        view = filtered.sort_values("Importance", ascending=False).head(top_n).copy()
        view["FeatureDisplay"] = view["Feature"].map(_clean_feature_label)

        split = _build_risk_split(view)
        category_rows = _build_category_rows(view)

        top_left, top_mid, top_right = st.columns([1.2, 1.2, 0.85])

        with top_left:
            with st.container(border=True):
                st.subheader(f"Top {top_n} Features Importantes")
                st.vega_lite_chart(
                    view,
                    {
                        "mark": {"type": "bar", "cornerRadiusEnd": 4, "color": palette["bar"]},
                        "encoding": {
                            "y": {"field": "FeatureDisplay", "type": "nominal", "sort": "-x", "title": None},
                            "x": {"field": "ImportancePct", "type": "quantitative", "title": "%", "axis": {"format": ".0f"}},
                            "tooltip": [
                                {"field": "FeatureDisplay", "type": "nominal", "title": "Feature"},
                                {"field": "ImportancePct", "type": "quantitative", "title": "Importance %", "format": ".2f"},
                                {"field": "Year", "type": "nominal", "title": "Année"},
                                {"field": "Region", "type": "nominal", "title": "Région"},
                            ],
                        },
                        "height": 320,
                    },
                    use_container_width=True,
                )

        with top_mid:
            with st.container(border=True):
                st.subheader("Répartition des facteurs")
                st.vega_lite_chart(
                    split,
                    {
                        "mark": {"type": "arc", "innerRadius": 70},
                        "encoding": {
                            "theta": {"field": "Value", "type": "quantitative"},
                            "color": {
                                "field": "Risk",
                                "type": "nominal",
                                "scale": {
                                    "domain": ["High Risk", "Moderate Risk", "Low Risk"],
                                    "range": [palette["high"], palette["moderate"], palette["low"]],
                                },
                                "legend": {"orient": "bottom"},
                            },
                            "tooltip": [
                                {"field": "Risk", "type": "nominal"},
                                {"field": "Value", "type": "quantitative", "format": ".1f"},
                            ],
                        },
                        "height": 320,
                    },
                    use_container_width=True,
                )

        with top_right:
            with st.container(border=True):
                st.subheader("KPI")
                st.markdown(
                    f"""
                    <div class="kpi-box" style="background:{palette['high']};">
                        <div style="font-size:2.2rem; font-weight:800; line-height:1;">{split.iloc[0]['Value']:.0f}%</div>
                        <div style="font-size:1.35rem; font-weight:700;">High Risk</div>
                    </div>
                    <div class="kpi-box" style="background:{palette['moderate']};">
                        <div style="font-size:2.2rem; font-weight:800; line-height:1;">{split.iloc[1]['Value']:.0f}%</div>
                        <div style="font-size:1.35rem; font-weight:700;">Moderate Risk</div>
                    </div>
                    <div class="kpi-box" style="background:{palette['low']}; margin-bottom:0;">
                        <div style="font-size:2.2rem; font-weight:800; line-height:1;">{split.iloc[2]['Value']:.0f}%</div>
                        <div style="font-size:1.35rem; font-weight:700;">Low Risk</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

        low_left, low_mid1, low_mid2, low_right = st.columns(4)
        with low_left:
            with st.container(border=True):
                _render_category_card("Genre", category_rows.get("Genre", []), palette["high"])
        with low_mid1:
            with st.container(border=True):
                _render_category_card("Quartier", category_rows.get("Quartier", []), palette["moderate"])
        with low_mid2:
            with st.container(border=True):
                _render_category_card("Niveau académique", category_rows.get("Niveau académique", []), palette["low"])
        with low_right:
            with st.container(border=True):
                _render_category_card("Antécédents familiaux", category_rows.get("Antécédents familiaux", []), palette["moderate"])

        with st.expander("Voir le tableau détaillé des features"):
            st.dataframe(
                view[["Rank", "Feature", "Importance", "ImportancePct", "CumulativeImportancePct"]],
                use_container_width=True,
            )

        chart_image = _build_feature_chart_image(fi, top_n=top_n)
        png_bytes = _image_to_png_bytes(chart_image)
        pdf_bytes = _image_to_pdf_bytes(chart_image)

        dl1, dl2 = st.columns(2)
        dl1.download_button(
            "Exporter graphique PNG",
            data=png_bytes,
            file_name="feature_importance_chart.png",
            mime="image/png",
            use_container_width=True,
        )
        dl2.download_button(
            "Exporter graphique PDF",
            data=pdf_bytes,
            file_name="feature_importance_chart.pdf",
            mime="application/pdf",
            use_container_width=True,
        )


if __name__ == "__main__":
    main()
