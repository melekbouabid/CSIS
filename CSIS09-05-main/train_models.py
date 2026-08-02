from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.impute import SimpleImputer
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "criminals_dataset_10000.csv"
RISK_MODEL_PATH = BASE_DIR / "risk_model.joblib"
CRIME_MODEL_PATH = BASE_DIR / "crime_type_model.joblib"
CRIME_LABEL_ENCODER_PATH = BASE_DIR / "crime_label_encoder.joblib"
RISK_THRESHOLD = 0.20

FEATURE_COLUMNS = [
    "gender",
    "age",
    "neighborhood_quality",
    "neighborhood_safety_rating",
    "academic_level",
    "parental_education",
    "family_situation",
    "parental_marital_status",
    "family_criminal_history",
    "family_psychological_issues",
    "friend_in_jail",
    "has_psychological_problem",
    "psychological_condition",
    "mental_health_treatment",
    "financial_situation",
    "debt_level",
    "employment_status",
    "addiction_type",
]


def _normalize_text(series: pd.Series) -> pd.Series:
    return series.astype(str).str.strip().str.lower()


def _build_preprocessor(x: pd.DataFrame) -> ColumnTransformer:
    numeric_cols = x.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_cols = [c for c in x.columns if c not in numeric_cols]

    return ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                    ]
                ),
                numeric_cols,
            ),
            (
                "cat",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_cols,
            ),
        ],
        remainder="drop",
    )


def _build_xgb_pipeline(preprocessor: ColumnTransformer, is_multiclass: bool = False) -> Pipeline:
    if is_multiclass:
        model = XGBClassifier(
            random_state=42,
            n_estimators=250,
            learning_rate=0.08,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="multi:softprob",
            eval_metric="mlogloss",
            tree_method="hist",
            n_jobs=-1,
        )
    else:
        model = XGBClassifier(
            random_state=42,
            n_estimators=250,
            learning_rate=0.08,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="binary:logistic",
            eval_metric="logloss",
            tree_method="hist",
            n_jobs=-1,
        )

    return Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("model", model),
        ]
    )


def _run_grid_search(
    pipeline: Pipeline,
    x_train: pd.DataFrame,
    y_train: pd.Series | np.ndarray,
    scoring: str,
    sample_weight: Optional[np.ndarray] = None,
) -> GridSearchCV:
    param_grid = {
        "model__n_estimators": [150, 250],
        "model__max_depth": [4, 6],
        "model__learning_rate": [0.05, 0.1],
        "model__subsample": [0.8, 1.0],
        "model__colsample_bytree": [0.8, 1.0],
        "model__min_child_weight": [1, 3],
        "model__gamma": [0.0, 0.2],
        "model__reg_alpha": [0.0, 0.1],
        "model__reg_lambda": [1.0, 2.0],
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    search = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        scoring=scoring,
        cv=cv,
        n_jobs=-1,
        verbose=1,
    )

    fit_params: Dict[str, Any] = {}
    if sample_weight is not None:
        fit_params["model__sample_weight"] = sample_weight

    search.fit(x_train, y_train, **fit_params)
    return search


def _print_feature_importance_report(
    trained_pipeline: Pipeline,
    x_reference: pd.DataFrame,
    model_name: str,
    top_n: int = 15,
) -> None:
    preprocessor = trained_pipeline.named_steps["preprocess"]
    model = trained_pipeline.named_steps["model"]

    feature_names = preprocessor.get_feature_names_out(x_reference.columns)
    importances = pd.Series(model.feature_importances_, index=feature_names)
    top_features = importances.sort_values(ascending=False).head(top_n)

    print(f"\n=== Top {top_n} features importantes - {model_name} ===")
    for rank, (feature, score) in enumerate(top_features.items(), start=1):
        print(f"{rank:>2}. {feature:<60} importance={score:.6f}")


def _print_ascii_bar_chart(feature_importance_df: pd.DataFrame, max_width: int = 50) -> None:
    max_importance = float(feature_importance_df["Importance"].max()) if not feature_importance_df.empty else 0.0
    scale = max_importance / max_width if max_importance > 0 else 1.0

    print("\n=== Bar chart (ASCII) - Top 15 Feature Importances ===")
    for _, row in feature_importance_df.iloc[::-1].iterrows():
        bar_len = int(round(float(row["Importance"]) / scale)) if scale > 0 else 0
        bar = "#" * bar_len
        print(f"{row['Feature']:<60} | {bar} {row['Importance']:.6f}")


def _export_powerbi_feature_importance(
    feature_importance_df: pd.DataFrame,
    output_csv_path: Path | None = None,
) -> pd.DataFrame:
    if output_csv_path is None:
        output_csv_path = BASE_DIR / "powerbi_feature_importance.csv"

    df = feature_importance_df.copy()
    df["Importance"] = pd.to_numeric(df["Importance"], errors="coerce")
    df = df.dropna(subset=["Importance"]).sort_values("Importance", ascending=False)

    total = float(df["Importance"].sum())
    if total <= 0:
        raise ValueError("La somme des importances est nulle. Impossible de creer le fichier Power BI.")

    df["Rank"] = range(1, len(df) + 1)
    df["ImportancePct"] = (df["Importance"] / total) * 100.0
    df["CumulativeImportancePct"] = df["ImportancePct"].cumsum()

    powerbi_df = df[["Rank", "Feature", "Importance", "ImportancePct", "CumulativeImportancePct"]]
    powerbi_df.to_csv(output_csv_path, index=False)
    print(f"CSV Power BI exporte: {output_csv_path}")
    return powerbi_df


def train_random_forest_feature_importance(
    data_path: Path = DATA_PATH,
    output_csv_path: Path | None = None,
    top_n: int = 15,
) -> pd.DataFrame:
    df = pd.read_csv(data_path)

    required_columns = set(FEATURE_COLUMNS + ["criminal_record"])
    missing_columns = sorted(required_columns - set(df.columns))
    if missing_columns:
        raise ValueError(f"Colonnes manquantes dans le CSV: {missing_columns}")

    x = df[FEATURE_COLUMNS].copy()
    y_risk = (_normalize_text(df["criminal_record"]) != "aucun").astype(int)

    x_train, _, y_train, _ = train_test_split(
        x,
        y_risk,
        test_size=0.2,
        random_state=42,
        stratify=y_risk,
    )

    rf_pipeline = Pipeline(
        steps=[
            ("preprocess", _build_preprocessor(x_train)),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=300,
                    random_state=42,
                    n_jobs=-1,
                    class_weight="balanced",
                ),
            ),
        ]
    )
    rf_pipeline.fit(x_train, y_train)

    preprocessor = rf_pipeline.named_steps["preprocess"]
    rf_model = rf_pipeline.named_steps["model"]
    feature_names = preprocessor.get_feature_names_out(x_train.columns)
    importances = pd.Series(rf_model.feature_importances_, index=feature_names)

    feature_importance_df = (
        importances.sort_values(ascending=False)
        .head(top_n)
        .rename_axis("Feature")
        .reset_index(name="Importance")
    )

    if output_csv_path is None:
        output_csv_path = BASE_DIR / "feature_importance.csv"
    feature_importance_df.to_csv(output_csv_path, index=False)

    print("\n=== Top 15 features importantes - RandomForest ===")
    print(feature_importance_df.to_string(index=False))
    print(f"\nCSV exporte: {output_csv_path}")

    _print_ascii_bar_chart(feature_importance_df)
    _export_powerbi_feature_importance(feature_importance_df)

    return feature_importance_df


def train_and_save_models(
    data_path: Path = DATA_PATH,
    risk_model_path: Path = RISK_MODEL_PATH,
    crime_model_path: Path = CRIME_MODEL_PATH,
) -> None:
    df = pd.read_csv(data_path)

    required_columns = set(FEATURE_COLUMNS + ["criminal_record", "crime"])
    missing_columns = sorted(required_columns - set(df.columns))
    if missing_columns:
        raise ValueError(f"Colonnes manquantes dans le CSV: {missing_columns}")

    x = df[FEATURE_COLUMNS].copy()

    y_risk = (_normalize_text(df["criminal_record"]) != "aucun").astype(int)
    if y_risk.nunique() < 2:
        raise ValueError("La cible binaire y_risk ne contient pas deux classes.")

    preprocessor_risk = _build_preprocessor(x)
    risk_pipeline = _build_xgb_pipeline(preprocessor_risk, is_multiclass=False)

    x_train_risk, x_test_risk, y_train_risk, y_test_risk = train_test_split(
        x,
        y_risk,
        test_size=0.2,
        random_state=42,
        stratify=y_risk,
    )

    risk_search = _run_grid_search(
        pipeline=risk_pipeline,
        x_train=x_train_risk,
        y_train=y_train_risk,
        scoring="f1",
        sample_weight=compute_sample_weight(class_weight="balanced", y=y_train_risk),
    )
    risk_best_pipeline = risk_search.best_estimator_
    risk_pred = risk_best_pipeline.predict(x_test_risk)

    print("\n=== Meilleurs hyperparametres - Modele Risque (XGBoost) ===")
    print(risk_search.best_params_)
    print(f"Meilleur score CV (f1): {risk_search.best_score_:.4f}")
    print("\n=== Evaluation Modele Risque (binaire) ===")
    print(classification_report(y_test_risk, risk_pred, digits=4))
    _print_feature_importance_report(risk_best_pipeline, x_train_risk, "Risque")

    mask_crime = _normalize_text(df["crime"]) != "aucun"
    df_crime = df.loc[mask_crime].copy()
    if df_crime.empty:
        raise ValueError("Aucune ligne avec crime != 'Aucun' pour entrainer le modele de type.")

    x_crime = df_crime[FEATURE_COLUMNS]
    y_crime_raw = df_crime["crime"].astype(str)
    crime_label_encoder = LabelEncoder()
    y_crime = crime_label_encoder.fit_transform(y_crime_raw)

    preprocessor_crime = _build_preprocessor(x_crime)
    crime_pipeline = _build_xgb_pipeline(preprocessor_crime, is_multiclass=True)

    try:
        x_train_crime, x_test_crime, y_train_crime, y_test_crime = train_test_split(
            x_crime,
            y_crime,
            test_size=0.2,
            random_state=42,
            stratify=y_crime,
        )
    except ValueError:
        x_train_crime, x_test_crime, y_train_crime, y_test_crime = train_test_split(
            x_crime,
            y_crime,
            test_size=0.2,
            random_state=42,
            stratify=None,
        )

    crime_search = _run_grid_search(
        pipeline=crime_pipeline,
        x_train=x_train_crime,
        y_train=y_train_crime,
        scoring="f1_weighted",
        sample_weight=compute_sample_weight(class_weight="balanced", y=y_train_crime),
    )
    crime_best_pipeline = crime_search.best_estimator_
    crime_best_pipeline.fit(
        x_train_crime,
        y_train_crime,
        model__sample_weight=compute_sample_weight(class_weight="balanced", y=y_train_crime),
    )
    crime_pred = crime_best_pipeline.predict(x_test_crime)

    print("\n=== Meilleurs hyperparametres - Modele Type de Crime (XGBoost) ===")
    print(crime_search.best_params_)
    print(f"Meilleur score CV (f1_weighted): {crime_search.best_score_:.4f}")
    print("\n=== Evaluation Modele Type de Crime (multiclasse) ===")
    print(
        classification_report(
            crime_label_encoder.inverse_transform(y_test_crime),
            crime_label_encoder.inverse_transform(crime_pred),
            digits=4,
            zero_division=0,
        )
    )
    _print_feature_importance_report(crime_best_pipeline, x_train_crime, "Type de Crime")

    joblib.dump(risk_best_pipeline, risk_model_path)
    joblib.dump(crime_best_pipeline, crime_model_path)
    joblib.dump(crime_label_encoder, CRIME_LABEL_ENCODER_PATH)

    print("\nModeles sauvegardes:")
    print(f"- {risk_model_path}")
    print(f"- {crime_model_path}")
    print(f"- {CRIME_LABEL_ENCODER_PATH}")


def predict_risk(nouveau_profil: Dict[str, Any]) -> Dict[str, Any]:
    missing_features = [f for f in FEATURE_COLUMNS if f not in nouveau_profil]
    if missing_features:
        raise ValueError(
            "Le profil est incomplet. Features manquantes: " + ", ".join(missing_features)
        )

    risk_model = joblib.load(RISK_MODEL_PATH)
    crime_model = joblib.load(CRIME_MODEL_PATH)
    crime_label_encoder: LabelEncoder = joblib.load(CRIME_LABEL_ENCODER_PATH)

    input_df = pd.DataFrame([{f: nouveau_profil[f] for f in FEATURE_COLUMNS}])

    risk_probability = float(risk_model.predict_proba(input_df)[0][1])
    risk_percent = round(risk_probability * 100, 2)

    if risk_probability > RISK_THRESHOLD:
        predicted_crime_index = int(crime_model.predict(input_df)[0])
        predicted_crime_type = str(
            crime_label_encoder.inverse_transform([predicted_crime_index])[0]
        )
        decision = "Futur criminel"
    else:
        predicted_crime_type = "Pas de futur criminel"
        decision = "Pas de futur criminel"

    return {
        "risk_percent": risk_percent,
        "decision": decision,
        "predicted_crime_type": predicted_crime_type,
    }


if __name__ == "__main__":
    train_and_save_models()

    # Exemple rapide avec la premiere ligne du dataset.
    dataset = pd.read_csv(DATA_PATH)
    exemple_profil = dataset.loc[0, FEATURE_COLUMNS].to_dict()

    resultat = predict_risk(exemple_profil)
    print("\n=== Exemple predict_risk ===")
    print(resultat)

    # Partie ajoutee: entrainement RandomForest + importances (tableau + bar chart + CSV).
    train_random_forest_feature_importance()
