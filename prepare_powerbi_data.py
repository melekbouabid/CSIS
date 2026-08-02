from __future__ import annotations

from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
INPUT_CSV = BASE_DIR / "feature_importance.csv"
OUTPUT_CSV = BASE_DIR / "powerbi_feature_importance.csv"


def prepare_powerbi_feature_importance(
    input_csv: Path = INPUT_CSV,
    output_csv: Path = OUTPUT_CSV,
) -> pd.DataFrame:
    if not input_csv.exists():
        raise FileNotFoundError(
            f"Fichier introuvable: {input_csv}. Lance d'abord train_models.py pour le generer."
        )

    df = pd.read_csv(input_csv)
    required_cols = {"Feature", "Importance"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Colonnes manquantes dans {input_csv.name}: {sorted(missing)}")

    df = df.copy()
    df["Importance"] = pd.to_numeric(df["Importance"], errors="coerce")
    df = df.dropna(subset=["Importance"]).sort_values("Importance", ascending=False)

    total = float(df["Importance"].sum())
    if total <= 0:
        raise ValueError("La somme des importances est nulle. Impossible de calculer les pourcentages.")

    df["Rank"] = range(1, len(df) + 1)
    df["ImportancePct"] = (df["Importance"] / total) * 100.0
    df["CumulativeImportancePct"] = df["ImportancePct"].cumsum()

    out = df[["Rank", "Feature", "Importance", "ImportancePct", "CumulativeImportancePct"]]
    out.to_csv(output_csv, index=False)

    print(f"Fichier Power BI genere: {output_csv}")
    print(out.head(15).to_string(index=False))
    return out


if __name__ == "__main__":
    prepare_powerbi_feature_importance()
