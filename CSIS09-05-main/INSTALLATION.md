# Guide d'Installation Complet

## 📦 Prérequis

- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)
- ~400 MB d'espace disque (pour les modèles joblib)

---

## 🔧 Étapes d'installation

### Étape 1 : Vérifier Python

Ouvrir PowerShell et taper :

```powershell
python --version
```

Vous devez voir : `Python 3.x.x` (3.8+)

Si la commande n'existe pas, installz Python depuis https://www.python.org

---

### Étape 2 : Naviguer vers le dossier

```powershell
Set-Location c:\Users\Malek\Downloads
```

---

### Étape 3 : Créer un environnement virtuel

```powershell
python -m venv .venv_crime
```

Attendez quelques secondes (crée le dossier `.venv_crime`).

---

### Étape 4 : Activer l'environnement virtuel

**Sur PowerShell :**
```powershell
.\.venv_crime\Scripts\Activate.ps1
```

**Sur Command Prompt (cmd) :**
```cmd
.venv_crime\Scripts\activate.bat
```

Vous verrez un prefixe comme `(.venv_crime)` dans votre terminal.

---

### Étape 5 : Installer les dépendances

```powershell
pip install -r requirements.txt
```

Cela installe :
- pandas (manipulation de données)
- scikit-learn (machine learning)
- joblib (sauvegarde/chargement de modèles)

---

### Étape 6 : Vérifier l'installation

```powershell
python -c "import pandas, sklearn, joblib; print('✅ Tous les modules sont installés!')"
```

---

## 🚀 Première utilisation

### Option A : Lancer la démonstration complète

```powershell
python demo_predict_risk.py
```

Vous verrez 4 exemples d'utilisation avec des résultats réels.

---

### Option B : Utiliser un exemple simple

```powershell
python usage_example.py
```

Montre 3 profils (faible risque, haut risque, intermédiaire).

---

### Option C : Entraîner les modèles (optionnel)

Les modèles sont déjà fournis, mais si vous voulez les réentraîner :

```powershell
python train_models.py
```

⚠️ Cela prendra ~2-3 minutes et va créer 2 fichiers `.joblib` (~357 MB).

---

### Option D : Utiliser dans votre propre code

```python
from train_models import predict_risk

# Créer un profil
mon_profil = {
    "gender": "M",
    "age": 30,
    # ... ajouter les 16 autres features
}

# Obtenir la prédiction
result = predict_risk(mon_profil)
print(result)
```

---

## 📋 Checklist d'installation

- [ ] Python 3.8+ installé
- [ ] Environnement virtuel créé (`.venv_crime`)
- [ ] Environnement virtuel activé (préfixe `.venv_crime` visible)
- [ ] `pip install -r requirements.txt` exécuté
- [ ] Tous les modules disponibles (import réussi)
- [ ] `demo_predict_risk.py` exécuté sans erreur

---

## ⚠️ Dépannage courant

### Erreur : "python is not recognized"
**Solution :** Python n'est pas dans le PATH. Réinstallez Python et cochez "Add Python to PATH".

### Erreur : "The term '.\.venv_crime\Scripts\Activate.ps1' is not recognized"
**Solution :** Vous êtes sur cmd, pas PowerShell. Utilisez :
```cmd
.venv_crime\Scripts\activate.bat
```

Ou changez de terminal dans VS Code (Terminal > New Terminal > Select PowerShell).

### Erreur : "Module not found: pandas"
**Solution :** L'environnement virtuel n'est pas activé. Vérifiez le préfixe et exécutez :
```powershell
pip install -r requirements.txt
```

### Erreur : "FileNotFoundError: criminals_dataset_10000.csv"
**Solution :** Assurez-vous que le CSV est dans le même dossier que les scripts Python.

### Erreur : "joblib.joblib model not found"
**Solution :** Les fichiers `.joblib` doivent être dans le même dossier. Vérifiez avec :
```powershell
Get-ChildItem -Filter "*.joblib"
```

---

## 🎯 Prochaines étapes

1. Lancer `demo_predict_risk.py` pour valider l'installation
2. Lire `README.md` pour comprendre l'architecture
3. Modifier `usage_example.py` avec vos propres profils
4. Intégrer `predict_risk()` dans vos projets

---

## 📞 Besoin d'aide ?

- Vérifiez les fichiers présents : `Get-ChildItem`
- Listez les modules Python : `pip list`
- Relisez le README.md pour plus de détails

Bonne utilisation ! 🚀
