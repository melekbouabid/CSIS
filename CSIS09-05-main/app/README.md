# Système de Prédiction du Risque Criminel Futur

Projet complet d'apprentissage automatique pour prédire le risque futur criminel et le type de crime associé, basé sur un ensemble de 18 features socio-démographiques.

## 📋 Contenu du projet

### Fichiers principaux
- **train_models.py** — Script d'entraînement des modèles XGBoost + GridSearchCV
- **risk_model.joblib** — Modèle binaire entraîné (82 MB)
- **crime_type_model.joblib** — Modèle multiclasses entraîné (275 MB)
- **crime_label_encoder.joblib** — Encodeur des labels de type de crime
- **criminals_dataset_10000.csv** — Dataset d'entraînement

### Fichiers de démonstration
- **demo_predict_risk.py** — Démonstration complète avec 4 exemples
- **usage_example.py** — Exemple simple d'utilisation
- **requirements.txt** — Dépendances Python

---

## 🚀 Installation et utilisation

### 1. Créer et activer un environnement virtuel

```powershell
# Créer l'environnement
python -m venv .venv_crime

# Activer l'environnement (Windows PowerShell)
.\.venv_crime\Scripts\Activate.ps1

# Ou sur cmd
.venv_crime\Scripts\activate.bat
```

### 2. Installer les dépendances

```powershell
pip install -r requirements.txt
```

### 3. Entraîner les modèles (optionnel — ils sont déjà fournis)

```powershell
python train_models.py
```

Ce script va :
- Charger le CSV
- Gérer les valeurs manquantes (imputation numérique et catégorielle)
- Optimiser les hyperparamètres avec GridSearchCV
- Construire les 2 modèles XGBoost
- Évaluer les performances
- Afficher les features les plus importantes
- Sauvegarder les modèles avec joblib

### 4. Utiliser la fonction `predict_risk()`

```python
from train_models import predict_risk

# Créer un dictionnaire avec les 18 features
nouveau_profil = {
    "gender": "M",
    "age": 30,
    "neighborhood_quality": "Moyenne",
    "neighborhood_safety_rating": 5,
    "academic_level": "Lycée",
    "parental_education": "Primaire",
    "family_situation": "Marié",
    "parental_marital_status": "Divorcé",
    "family_criminal_history": "Oui",
    "family_psychological_issues": "Non",
    "friend_in_jail": "Non",
    "has_psychological_problem": "Non",
    "psychological_condition": "Normal",
    "mental_health_treatment": "Non",
    "financial_situation": "Difficile",
    "debt_level": "Élevé",
    "employment_status": "Chômeur",
    "addiction_type": "Alcool"
}

# Obtenir la prédiction
resultat = predict_risk(nouveau_profil)

print(f"Risque: {resultat['risk_percent']}%")
print(f"Décision: {resultat['decision']}")
print(f"Type de crime: {resultat['predicted_crime_type']}")
```

---

## 📊 Structure des données

### Les 18 features requises

| Catégorie | Features |
|-----------|----------|
| **Démographie** | gender, age |
| **Quartier** | neighborhood_quality, neighborhood_safety_rating |
| **Éducation** | academic_level, parental_education |
| **Famille** | family_situation, parental_marital_status, family_criminal_history, family_psychological_issues, friend_in_jail |
| **Psychologique** | has_psychological_problem, psychological_condition, mental_health_treatment |
| **Économique** | financial_situation, debt_level, employment_status |
| **Addiction** | addiction_type |

### Format de sortie

La fonction `predict_risk()` retourne un dictionnaire :

```python
{
    "risk_percent": float,           # Pourcentage de risque (0-100)
    "decision": str,                 # "Futur criminel" ou "Pas de futur criminel"
    "predicted_crime_type": str      # Type spécifique de crime ou "Pas de futur criminel"
}
```

---

## 🎯 Règles de décision

### Modèle 1 : Risque futur criminel (binaire)
- **Cible** : `criminal_record` du dataset
- **Classes** : "Aucun" (0) vs autres (1)
- **Algorithme** : XGBoost (XGBClassifier)
- **Optimisation** : GridSearchCV (scoring F1)
- **Seuil** : Si probabilité > 20% → "Futur criminel"

### Modèle 2 : Type de crime (multiclasses)
- **Cible** : `crime` du dataset
- **Classes** : Homicide, Meurtre en série, Viol, Vol simple, Cambriolage, etc.
- **Algorithme** : XGBoost (XGBClassifier multiclasses)
- **Optimisation** : GridSearchCV (scoring F1 pondéré)
- **Condition** : N'est utilisé que si risque > 20%

---

## 📈 Performances

### Modèle de risque (test set)
- Accuracy : ~85%
- Équilibrage des classes : OUI (class_weight="balanced")

### Modèle de type de crime (test set)
- Accuracy : ~26.6%
- Note : La distribution des types de crime est très inégale (21 classes)

---

## 🔍 Exemples de sortie

### Cas 1 : Faible risque
```
{
    "risk_percent": 7.33,
    "decision": "Pas de futur criminel",
    "predicted_crime_type": "Pas de futur criminel"
}
```

### Cas 2 : Risque élevé
```
{
    "risk_percent": 99.33,
    "decision": "Futur criminel",
    "predicted_crime_type": "Homicide"
}
```

### Cas 3 : Profil incomplet (erreur)
```
ValueError: Le profil est incomplet. Features manquantes: neighborhood_quality, ...
```

---

## 📝 Fichiers de démonstration

### demo_predict_risk.py
Lance 4 exemples complets :
1. Prédiction sur la première ligne du dataset
2. Prédiction sur un profil à haut risque
3. Prédiction sur un profil modifié
4. Gestion des erreurs (profil incomplet)

Exécution :
```powershell
python demo_predict_risk.py
```

### usage_example.py
Exemple simple et minimal pour intégrer dans vos projets.

### streamlit_app.py
Interface web Streamlit avec :
- onglet **Prediction** (formulaire complet des 18 features),
- onglet **Feature Dashboard** (Top N, KPI, tableau),
- export du graphique des features en **PNG** et **PDF**.

Exécution :
```powershell
streamlit run streamlit_app.py
```

Dans l'onglet **Feature Dashboard**, le fichier `powerbi_feature_importance.csv` est chargé automatiquement s'il existe.

---

## ⚙️ Configuration

Les chemins de fichiers et constantes sont définis au début de `train_models.py` :

```python
DATA_PATH = BASE_DIR / "criminals_dataset_10000.csv"
RISK_MODEL_PATH = BASE_DIR / "risk_model.joblib"
CRIME_MODEL_PATH = BASE_DIR / "crime_type_model.joblib"
CRIME_LABEL_ENCODER_PATH = BASE_DIR / "crime_label_encoder.joblib"
RISK_THRESHOLD = 0.20  # 20%
```

Modifiez-les si vous déplacez les fichiers.

Optimisation entraînement (version actuelle) :
- Validation croisée stratifiée (`StratifiedKFold`, 5 folds)
- Pondération des classes sur la cible risque
- Régularisation XGBoost (`reg_alpha`, `reg_lambda`) ajoutée au tuning
- Score multiclasses réglé sur `f1_weighted`

---

## 🛠️ Dépannage

### Erreur : "Colonnes manquantes dans le CSV"
Vérifiez que `criminals_dataset_10000.csv` est dans le même répertoire que le script.

### Erreur : "Le profil est incomplet"
Assurez-vous que le dictionnaire contient TOUTES les 18 features.

### Erreur : "Module not found"
Réinstallez les dépendances :
```powershell
pip install -r requirements.txt --force-reinstall
```

---

## 📄 Licence et utilisation

Projet d'apprentissage automatique à usage éducatif.

---

## 📞 Support

Tous les fichiers sont dans le dossier `Downloads`. Exécutez `demo_predict_risk.py` pour valider l'installation.
