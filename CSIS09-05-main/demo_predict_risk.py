#!/usr/bin/env python
"""Démonstration de la fonction predict_risk() avec différents profils."""

from pathlib import Path
from train_models import predict_risk, FEATURE_COLUMNS
import pandas as pd

# Charge le dataset pour avoir des exemples réels
dataset = pd.read_csv(Path(__file__).parent / "criminals_dataset_10000.csv")

print("=" * 80)
print("DÉMONSTRATION DE predict_risk() - Prédiction du risque futur criminel")
print("=" * 80)

# Exemple 1 : Profil de la première ligne (à très faible risque)
print("\n--- Exemple 1: Première ligne du dataset ---")
profil_1 = dataset.loc[0, FEATURE_COLUMNS].to_dict()
resultat_1 = predict_risk(profil_1)
print(f"Risque: {resultat_1['risk_percent']}%")
print(f"Décision: {resultat_1['decision']}")
print(f"Type de crime: {resultat_1['predicted_crime_type']}")

# Exemple 2 : Profil d'une personne à risque élevé
print("\n--- Exemple 2: Profil d'une personne à haut risque (ligne avec antécédent criminel) ---")
# Chercher une personne avec criminel_record != "Aucun"
mask_at_risk = dataset["criminal_record"] != "Aucun"
if mask_at_risk.any():
    idx_at_risk = dataset[mask_at_risk].index[0]
    profil_2 = dataset.loc[idx_at_risk, FEATURE_COLUMNS].to_dict()
    resultat_2 = predict_risk(profil_2)
    print(f"Risque: {resultat_2['risk_percent']}%")
    print(f"Décision: {resultat_2['decision']}")
    if resultat_2['predicted_crime_type'] != "Pas de futur criminel":
        print(f"Type de crime prédit: {resultat_2['predicted_crime_type']}")
else:
    print("Aucun profil à risque trouvé dans le dataset.")

# Exemple 3 : Profil modifié avec risque potentiellement différent
print("\n--- Exemple 3: Profil modifié pour tester la sensibilité ---")
profil_3 = dataset.loc[10, FEATURE_COLUMNS].to_dict()
resultat_3 = predict_risk(profil_3)
print(f"Risque: {resultat_3['risk_percent']}%")
print(f"Décision: {resultat_3['decision']}")
print(f"Type de crime: {resultat_3['predicted_crime_type']}")

# Exemple 4 : Montrer un appel avec un profil incomplet (doit lever une erreur)
print("\n--- Exemple 4: Tentative avec profil incomplet (génère une erreur attendue) ---")
profil_incomplet = {
    "gender": "M",
    "age": 25,
    # ... autres features manquantes
}
try:
    resultat_4 = predict_risk(profil_incomplet)
except ValueError as e:
    print(f"Erreur attendue: {str(e)[:100]}...")

print("\n" + "=" * 80)
print(f"Récapitulatif des 18 features requises:")
print(", ".join(FEATURE_COLUMNS))
print("=" * 80)
