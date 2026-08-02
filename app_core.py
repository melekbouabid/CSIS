from __future__ import annotations

import io
import re
from pathlib import Path

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
        "missing_models": "Modeles introuvables. Lancez d'abord `python train_models.py`.",
        "profile": "Profil a evaluer",
        "predict": "Predire",
        "result": "Resultat",
        "risk_percent": "Pourcentage de risque",
        "high_risk": "Risque eleve detecte (>20%).",
        "low_risk": "Risque faible (<=20%).",
        "crime_type": "Type de crime probable",
        "no_crime": "Pas de futur criminel",
    }
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


def render_base_theme() -> None:
    st.markdown(
        """
        <style>
            :root {
                --bg-main: #f4f8ff;
                --bg-card: #ffffff;
                --line-soft: #cddcf4;
                --text-main: #0e2a4f;
                --text-muted: #486b98;
                --accent: #0d6efd;
                --accent-soft: #e8f2ff;
            }

            @keyframes riseIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .stApp {
                background:
                    radial-gradient(circle at 14% 9%, #d8e9ff 0%, rgba(216, 233, 255, 0) 36%),
                    radial-gradient(circle at 88% 82%, #e6f3ff 0%, rgba(230, 243, 255, 0) 28%),
                    linear-gradient(180deg, #f8fbff 0%, #edf5ff 100%);
                color: var(--text-main);
                font-family: "Trebuchet MS", "Verdana", "Tahoma", sans-serif;
            }

            [data-testid="stHeader"] {
                background: rgba(248, 251, 255, 0.85);
                backdrop-filter: blur(6px);
                border-bottom: 1px solid #d8e6fb;
            }

            .block-container {
                padding-top: 1.5rem;
                max-width: 1220px;
            }

            .header-shell, .metric-card {
                border: 1px solid var(--line-soft);
                border-radius: 14px;
                padding: 1rem;
                background: var(--bg-card);
                box-shadow: 0 10px 26px rgba(24, 73, 137, 0.08);
                animation: riseIn .45s ease-out;
                transition: transform .2s ease, box-shadow .2s ease;
            }

            .header-shell:hover, .metric-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 16px 30px rgba(24, 73, 137, 0.12);
            }

            .eyebrow {
                margin: 0 0 0.35rem;
                font-size: 0.72rem;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: #1d66d1;
                font-weight: 700;
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
                color: var(--text-muted);
            }

            .mini-track {
                flex: 1;
                height: 8px;
                border-radius: 999px;
                background: #dbe9fb;
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
                color: var(--text-main);
            }

            h1, h2, h3, h4, h5, h6,
            label, p, li, span,
            .stMarkdown, .stCaption {
                color: var(--text-main);
            }

            .stMetric {
                background: var(--bg-card);
                border: 1px solid var(--line-soft);
                border-radius: 12px;
                padding: .55rem .75rem;
                box-shadow: 0 8px 20px rgba(24, 73, 137, 0.06);
            }

            [data-testid="stMetricValue"],
            [data-testid="stMetricLabel"] {
                color: var(--text-main);
            }

            .stAlert {
                border-radius: 12px;
                border: 1px solid var(--line-soft);
            }

            .stButton button,
            .stFormSubmitButton button {
                background: linear-gradient(135deg, #0d6efd 0%, #2d8cff 100%);
                color: #ffffff;
                border: 0;
                border-radius: 10px;
                font-weight: 700;
                box-shadow: 0 8px 18px rgba(13, 110, 253, 0.28);
            }

            .stButton button:hover,
            .stFormSubmitButton button:hover {
                background: linear-gradient(135deg, #0b62e2 0%, #2681ee 100%);
            }

            .stButton button:focus,
            .stFormSubmitButton button:focus {
                outline: 2px solid #a3c8ff;
                outline-offset: 2px;
            }

            .stSelectbox > div > div,
            .stTextArea textarea,
            .stSlider,
            .stNumberInput input {
                border-color: #bfd2ef !important;
                background: #ffffff !important;
                color: var(--text-main) !important;
                border-radius: 10px !important;
            }

            .stTextArea textarea:focus,
            .stNumberInput input:focus {
                border-color: #70a8f2 !important;
                box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.14) !important;
            }

            .stTabs [data-baseweb="tab-list"] {
                gap: .5rem;
                background: #e9f2ff;
                border: 1px solid #cbddf8;
                border-radius: 12px;
                padding: .25rem;
            }

            .stTabs [data-baseweb="tab"] {
                border-radius: 9px;
                color: #2f5683;
                font-weight: 700;
            }

            .stTabs [aria-selected="true"] {
                background: #ffffff !important;
                color: #0b4ea7 !important;
                border: 1px solid #b8d0f2 !important;
            }

            [data-testid="stForm"] {
                background: #ffffff;
                border: 1px solid #cfdef4;
                border-radius: 14px;
                padding: .9rem;
                box-shadow: 0 9px 22px rgba(24, 73, 137, 0.06);
            }

            section[data-testid="stSidebar"] {
                background: linear-gradient(180deg, #e7f1ff 0%, #dcecff 100%);
                border-right: 1px solid #bdd3f3;
            }

            section[data-testid="stSidebar"] * {
                color: #163d6d !important;
            }

            section[data-testid="stSidebar"] [data-testid="stSidebarNavLink"] {
                border-radius: 10px;
            }

            section[data-testid="stSidebar"] [data-testid="stSidebarNavLink"]:hover {
                background: rgba(255, 255, 255, 0.65);
            }

            section[data-testid="stSidebar"] [aria-current="page"] {
                background: rgba(255, 255, 255, 0.8);
            }

            @media (max-width: 768px) {
                .block-container {
                    padding-top: 1rem;
                }

                .header-shell, .metric-card {
                    padding: .85rem;
                    border-radius: 12px;
                }
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_chatbot_theme() -> None:
    st.markdown(
        """
        <style>
            .chat-shell {
                border: 1px solid #c9dcf7;
                border-radius: 22px;
                padding: 1.25rem;
                background:
                    radial-gradient(circle at top left, rgba(39, 127, 255, 0.15), transparent 25%),
                    radial-gradient(circle at right 15%, rgba(14, 89, 206, 0.12), transparent 24%),
                    linear-gradient(180deg, #fdfefe 0%, #eff6ff 100%);
                box-shadow: 0 14px 28px rgba(24, 73, 137, 0.1);
            }

            .chat-stat {
                border: 1px solid #d0e0f7;
                border-radius: 16px;
                padding: 1rem;
                background: #ffffff;
                min-height: 110px;
                box-shadow: 0 8px 20px rgba(24, 73, 137, 0.06);
            }

            .chat-message {
                border-radius: 16px;
                padding: .9rem 1rem;
                margin-bottom: .8rem;
                line-height: 1.55;
                border: 1px solid #ccdef8;
            }

            .chat-user {
                background: linear-gradient(135deg, #deecff, #eff6ff);
            }

            .chat-assistant {
                background: linear-gradient(135deg, #ffffff, #f1f7ff);
            }

            .chat-message strong {
                color: #0b4ea7;
            }

            .chat-shell p,
            .chat-stat p,
            .chat-stat strong,
            .chat-message {
                color: #10345f;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def build_input_form() -> dict:
    st.subheader(TEXTS["fr"]["profile"])
    col1, col2 = st.columns(2)

    with col1:
        gender = st.selectbox("Genre", ["Homme", "Femme"])
        age = st.slider("Age", min_value=15, max_value=65, value=30, step=1)
        neighborhood_quality = st.selectbox(
            "Qualite du quartier",
            ["Bon", "Moyen", "Pauvre", "Residentiel", "Tres pauvre"],
        )
        neighborhood_safety_rating = st.slider("Niveau de securite du quartier (1-10)", 1, 10, 5, 1)
        academic_level = st.selectbox(
            "Niveau academique",
            ["Analphabete", "Primaire", "College", "Lycee", "Bac", "Bac+2", "Licence", "Master", "Doctorat"],
        )
        parental_education = st.selectbox(
            "Niveau d'education des parents",
            ["Analphabete", "Primaire", "Secondaire", "Universitaire"],
        )
        family_situation = st.selectbox(
            "Situation familiale",
            ["Celibataire", "Marie(e)", "Divorce(e)", "Veuf/Veuve"],
        )
        parental_marital_status = st.selectbox(
            "Statut marital des parents",
            ["Maries", "Divorces", "Separes", "Veuf/Veuve", "Decedes"],
        )
        family_criminal_history = st.selectbox("Antecedents criminels familiaux", ["Non", "Oui"])

    with col2:
        family_psychological_issues = st.selectbox("Problemes psychologiques familiaux", ["Non", "Oui"])
        friend_in_jail = st.selectbox("Ami en prison", ["Non", "Oui"])
        has_psychological_problem = st.selectbox("Probleme psychologique personnel", ["Non", "Oui"])
        psychological_condition = st.selectbox(
            "Condition psychologique",
            ["Aucun", "Trouble impulsif", "Schizophrenie", "Trouble de la personnalite antisociale"],
        )
        mental_health_treatment = st.selectbox(
            "Traitement en sante mentale",
            ["Aucun", "Therapie", "Medicaments", "Suivi psychiatrique", "Hospitalisation"],
        )
        financial_situation = st.selectbox(
            "Situation financiere",
            ["Aisee", "Moyenne", "Modeste", "Precaire", "Tres precaire"],
        )
        debt_level = st.selectbox(
            "Niveau d'endettement",
            ["Aucune", "Faible", "Moderee", "Elevee", "Tres elevee"],
        )
        employment_status = st.selectbox(
            "Statut d'emploi",
            ["Employe", "Etudiant", "Retraite", "Chomeur", "Sans emploi", "Travailleur informel"],
        )
        addiction_type = st.selectbox(
            "Type d'addiction",
            ["Aucune", "Tabac", "Alcool", "Cannabis", "Tramadol", "Cocaine", "Heroine", "Polytoxicomanie"],
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
    return {feature: profile[feature] for feature in FEATURE_COLUMNS}


def ensure_models_exist() -> None:
    if not RISK_MODEL_PATH.exists() or not CRIME_MODEL_PATH.exists() or not CRIME_LABEL_ENCODER_PATH.exists():
        st.error(TEXTS["fr"]["missing_models"])
        st.stop()


def run_prediction(input_profile: dict) -> dict:
    risk_model, crime_model, crime_label_encoder = load_artifacts()
    input_df = pd.DataFrame([input_profile])
    risk_probability = float(risk_model.predict_proba(input_df)[0][1])
    risk_percent = round(risk_probability * 100, 2)
    is_high_risk = risk_probability > RISK_THRESHOLD

    if is_high_risk:
        predicted_class_idx = int(crime_model.predict(input_df)[0])
        predicted_crime = str(crime_label_encoder.inverse_transform([predicted_class_idx])[0])
    else:
        predicted_crime = TEXTS["fr"]["no_crime"]

    result = {
        "risk_percent": risk_percent,
        "is_high_risk": is_high_risk,
        "predicted_crime_type": predicted_crime,
        "profile": input_profile,
    }
    st.session_state["last_prediction"] = result
    return result


def render_prediction_result(result: dict) -> None:
    risk_color = "#ef4444" if result["is_high_risk"] else "#22c55e"
    st.markdown(f"### {TEXTS['fr']['result']}")
    st.markdown(
        f"""
        <div class="metric-card">
            <p style="margin:0; font-size:1.1rem;">{TEXTS['fr']['risk_percent']}</p>
            <p style="margin:0.25rem 0 0 0; font-size:2rem; font-weight:700; color:{risk_color};">
                {result['risk_percent']}%
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if result["is_high_risk"]:
        st.error(TEXTS["fr"]["high_risk"])
    else:
        st.success(TEXTS["fr"]["low_risk"])
    st.info(f"{TEXTS['fr']['crime_type']}: {result['predicted_crime_type']}")


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
        "bar": "#0ea5e9",
        "high": "#ef4444",
        "moderate": "#eab308",
        "low": "#22c55e",
        "accent": "#38bdf8",
    }


def _build_category_rows(view: pd.DataFrame) -> dict[str, list[dict[str, float | str]]]:
    category_rules = {
        "Genre": ["gender"],
        "Quartier": ["neighborhood"],
        "Niveau academique": ["academic", "education"],
        "Antecedents familiaux": ["family", "parental", "friend in jail", "criminal history"],
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
            rows.append({"label": str(row["FeatureLabel"])[:22], "pct": float(row["ImportancePct"])})
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
    <body style="margin:0; background:transparent; color:#f8fafc; font-family:Bahnschrift, Segoe UI, sans-serif;">
      <div class="mini-card-title">{title}</div>
      {''.join(html_rows)}
    </body>
    </html>
    """
    components.html(html, height=190 + (len(rows) * 46), scrolling=False)


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
    row_h = max(18, (chart_bottom - chart_top) // max(len(subset), 1))
    max_imp = float(subset["Importance"].max()) if not subset.empty else 1.0
    max_imp = max(max_imp, 1.0)

    for i, row in subset.iterrows():
        y0 = chart_top + i * row_h + 2
        y1 = y0 + row_h - 4
        val = float(row["Importance"])
        bar_len = int((val / max_imp) * (chart_right - chart_left))
        draw.text((40, y0), str(row["Feature"])[:60], fill="#e2e8f0", font=font_label)
        draw.rectangle([chart_left, y0, chart_left + bar_len, y1], fill="#38bdf8")
        draw.text((chart_left + bar_len + 8, y0), f"{val:.4f}", fill="#f8fafc", font=font_label)

    return canvas


def _image_to_png_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def _image_to_pdf_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="PDF")
    return buf.getvalue()


def render_dashboard_page() -> None:
    fi = load_feature_importance()
    if fi.empty:
        st.warning("Fichier powerbi_feature_importance.csv introuvable. Lancez d'abord python train_models.py")
        return

    fi = _add_dashboard_dimensions(fi)

    theme_col, fx_col, year_col, region_col, risk_col = st.columns([1.1, 0.9, 0.9, 1.0, 1.0])
    with theme_col:
        dashboard_theme = st.selectbox("Style", ["Ember Noir", "Metro Glow"], index=0)
    with fx_col:
        top_n = st.selectbox("Top features", options=[5, 10, 12, 15], index=3)
    with year_col:
        year_choice = st.selectbox("Annee", options=["Toutes"] + sorted(fi["Year"].unique().tolist()))
    with region_col:
        region_choice = st.selectbox("Region", options=["Toutes"] + sorted(fi["Region"].unique().tolist()))
    with risk_col:
        risk_choice = st.selectbox("Type risque", options=["Tous", "High Risk", "Moderate Risk", "Low Risk"])

    palette = _get_theme_palette(dashboard_theme)

    filtered = fi.copy()
    if year_choice != "Toutes":
        filtered = filtered[filtered["Year"] == year_choice]
    if region_choice != "Toutes":
        filtered = filtered[filtered["Region"] == region_choice]
    if risk_choice != "Tous":
        filtered = filtered[filtered["RiskType"] == risk_choice]
    if filtered.empty:
        st.warning("Aucun resultat pour ce filtre. Affichage global retabli.")
        filtered = fi.copy()

    view = filtered.sort_values("Importance", ascending=False).head(top_n).copy()
    view["FeatureDisplay"] = view["Feature"].map(_clean_feature_label)
    split = _build_risk_split(view)
    category_rows = _build_category_rows(view)

    top_left, top_mid, top_right = st.columns([1.2, 1.1, 0.85])
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
                    },
                    "height": 320,
                },
                use_container_width=True,
            )
    with top_mid:
        with st.container(border=True):
            st.subheader("Repartition des facteurs")
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
                        },
                    },
                    "height": 320,
                },
                use_container_width=True,
            )
    with top_right:
        st.metric("High Risk", f"{split.iloc[0]['Value']:.0f}%")
        st.metric("Moderate Risk", f"{split.iloc[1]['Value']:.0f}%")
        st.metric("Low Risk", f"{split.iloc[2]['Value']:.0f}%")

    low_left, low_mid1, low_mid2, low_right = st.columns(4)
    with low_left:
        with st.container(border=True):
            _render_category_card("Genre", category_rows.get("Genre", []), palette["high"])
    with low_mid1:
        with st.container(border=True):
            _render_category_card("Quartier", category_rows.get("Quartier", []), palette["moderate"])
    with low_mid2:
        with st.container(border=True):
            _render_category_card("Niveau academique", category_rows.get("Niveau academique", []), palette["low"])
    with low_right:
        with st.container(border=True):
            _render_category_card("Antecedents familiaux", category_rows.get("Antecedents familiaux", []), palette["accent"])

    with st.expander("Voir le tableau detaille des features"):
        st.dataframe(
            view[["Rank", "Feature", "Importance", "ImportancePct", "CumulativeImportancePct"]],
            use_container_width=True,
        )

    chart_image = _build_feature_chart_image(fi, top_n=top_n)
    png_bytes = _image_to_png_bytes(chart_image)
    pdf_bytes = _image_to_pdf_bytes(chart_image)
    dl1, dl2 = st.columns(2)
    dl1.download_button("Exporter graphique PNG", data=png_bytes, file_name="feature_importance_chart.png", mime="image/png", use_container_width=True)
    dl2.download_button("Exporter graphique PDF", data=pdf_bytes, file_name="feature_importance_chart.pdf", mime="application/pdf", use_container_width=True)


def build_chatbot_reply(prompt: str) -> str:
    prompt_lower = prompt.lower()
    last_prediction = st.session_state.get("last_prediction")

    if any(word in prompt_lower for word in ["prediction", "risque", "crime"]) and last_prediction:
        return (
            f"Derniere prediction analysee: {last_prediction['risk_percent']}% de risque. "
            f"Type probable: {last_prediction['predicted_crime_type']}. "
            "Pour un nouveau calcul, retournez sur la page Prediction."
        )

    if any(word in prompt_lower for word in ["dashboard", "feature", "graphique"]):
        return (
            "Le dashboard montre les variables les plus importantes, leur repartition par niveau de risque "
            "et permet l'export PNG/PDF du graphique principal."
        )

    return (
        "Je suis l'interface chatbot isolee de la plateforme. "
        "Je peux vous guider sur l'usage de la prediction, du dashboard et rappeler la derniere prediction stockee."
    )
