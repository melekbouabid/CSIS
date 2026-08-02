#!/usr/bin/env python
"""
Exemple simple et minimal d'utilisation de predict_risk()
Adapté pour une intégration rapide dans vos projets.
"""

from train_models import predict_risk

# Exemple 1 : Profil à faible risque
print("=" * 60)
print("EXEMPLE 1 : Profil à faible risque")
print("=" * 60)

profil_safe = {
    "gender": "F",
    "age": 28,
    "neighborhood_quality": "Bonne",
    "neighborhood_safety_rating": 8,
    "academic_level": "Université",
    "parental_education": "Lycée",
    "family_situation": "Marié",
    "parental_marital_status": "Marié",
    "family_criminal_history": "Non",
    "family_psychological_issues": "Non",
    "friend_in_jail": "Non",
    "has_psychological_problem": "Non",
    "psychological_condition": "Normal",
    "mental_health_treatment": "Non",
    "financial_situation": "Aisée",
    "debt_level": "Faible",
    "employment_status": "Salarié",
    "addiction_type": "Aucune"
}

resultat_safe = predict_risk(profil_safe)
print(f"Risque: {resultat_safe['risk_percent']}%")
print(f"Décision: {resultat_safe['decision']}")
print(f"Type de crime: {resultat_safe['predicted_crime_type']}")

# Exemple 2 : Profil à haut risque
print("\n" + "=" * 60)
print("EXEMPLE 2 : Profil à haut risque")
print("=" * 60)

profil_risk = {
    "gender": "M",
    "age": 35,
    "neighborhood_quality": "Mauvaise",
    "neighborhood_safety_rating": 2,
    "academic_level": "Primaire",
    "parental_education": "Primaire",
    "family_situation": "Divorcé",
    "parental_marital_status": "Divorcé",
    "family_criminal_history": "Oui",
    "family_psychological_issues": "Oui",
    "friend_in_jail": "Oui",
    "has_psychological_problem": "Oui",
    "psychological_condition": "Dépression",
    "mental_health_treatment": "Non",
    "financial_situation": "Très difficile",
    "debt_level": "Très élevé",
    "employment_status": "Chômeur",
    "addiction_type": "Drogue"
}

resultat_risk = predict_risk(profil_risk)
print(f"Risque: {resultat_risk['risk_percent']}%")
print(f"Décision: {resultat_risk['decision']}")
if resultat_risk['predicted_crime_type'] != "Pas de futur criminel":
    print(f"Type de crime prédit: {resultat_risk['predicted_crime_type']}")
else:
    print(f"Type de crime: {resultat_risk['predicted_crime_type']}")

# Exemple 3 : Cas limite (proche du seuil de 20%)
print("\n" + "=" * 60)
print("EXEMPLE 3 : Profil intermédiaire")
print("=" * 60)

profil_middle = {
    "gender": "M",
    "age": 32,
    "neighborhood_quality": "Moyenne",
    "neighborhood_safety_rating": 5,
    "academic_level": "Lycée",
    "parental_education": "Lycée",
    "family_situation": "Célibataire",
    "parental_marital_status": "Marié",
    "family_criminal_history": "Non",
    "family_psychological_issues": "Non",
    "friend_in_jail": "Non",
    "has_psychological_problem": "Non",
    "psychological_condition": "Normal",
    "mental_health_treatment": "Non",
    "financial_situation": "Difficile",
    "debt_level": "Moyen",
    "employment_status": "Intérimaire",
    "addiction_type": "Alcool"
}

resultat_middle = predict_risk(profil_middle)
print(f"Risque: {resultat_middle['risk_percent']}%")
print(f"Décision: {resultat_middle['decision']}")
print(f"Type de crime: {resultat_middle['predicted_crime_type']}")

print("\n" + "=" * 60)
print("✅ Tous les exemples ont fonctionné correctement!")
print("=" * 60)
