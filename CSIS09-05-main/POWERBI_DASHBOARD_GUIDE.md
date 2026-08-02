# Guide Dashboard Power BI - Feature Importance

Ce guide couvre exactement les 4 besoins:
1. Creation pas-a-pas du dashboard.
2. Mesures DAX avancees.
3. Ajout d'une 2eme page executive.
4. Mise a jour automatique des donnees apres entrainement.

## Prerequis

- Fichier source genere automatiquement par le script: powerbi_feature_importance.csv
- Generation automatique:
  - Lancer train_models.py
  - Le script cree ensuite:
    - feature_importance.csv
    - powerbi_feature_importance.csv

## 1) Page 1 - Top Features (pas-a-pas)

1. Ouvrir Power BI Desktop.
2. Home > Get Data > Text/CSV.
3. Selectionner powerbi_feature_importance.csv.
4. Cliquer Load.
5. Renommer la table en FeatureImportance (Model view).
6. Verifier les types:
   - Rank: Whole number
   - Feature: Text
   - Importance: Decimal number
   - ImportancePct: Decimal number
   - CumulativeImportancePct: Decimal number

### Visuel A - Bar chart horizontal (Top 15)

1. Inserer un Clustered bar chart.
2. Fields:
   - Y-axis: Feature
   - X-axis: Importance
3. Trier par Importance descendant.
4. Visual level filters:
   - Rank <= 15
5. Format:
   - Data labels: On
   - X-axis display units: None

### Visuel B - Tableau detaille

1. Inserer un Table visual.
2. Colonnes:
   - Rank
   - Feature
   - Importance
   - ImportancePct
3. Format:
   - ImportancePct en pourcentage avec 2 decimales.

### Visuel C - Pareto (courbe cumul)

1. Inserer un Line chart.
2. X-axis: Rank
3. Y-axis: CumulativeImportancePct
4. Ajouter une ligne de reference a 80 (Analytics pane).

### Visuel D - Cartes KPI

Ajouter 3 Card visuals:
- Carte 1: Top Feature (measure)
- Carte 2: Importance max % (measure)
- Carte 3: Nb Features Top 80% (measure)

## 2) Mesures DAX avancees

Creer les mesures suivantes dans la table FeatureImportance.

Total Importance =
SUM(FeatureImportance[Importance])

Importance % =
DIVIDE(SUM(FeatureImportance[Importance]), [Total Importance], 0)

Top Feature =
VAR _top = TOPN(1, ALLSELECTED(FeatureImportance), FeatureImportance[Importance], DESC)
RETURN CONCATENATEX(_top, FeatureImportance[Feature], ", ")

Top Importance % =
VAR _maxImp = MAXX(ALLSELECTED(FeatureImportance), FeatureImportance[Importance])
RETURN DIVIDE(_maxImp, [Total Importance], 0)

Cum Importance % =
VAR _rank = MAX(FeatureImportance[Rank])
VAR _cum =
    CALCULATE(
        SUM(FeatureImportance[Importance]),
        FILTER(
            ALLSELECTED(FeatureImportance),
            FeatureImportance[Rank] <= _rank
        )
    )
RETURN DIVIDE(_cum, [Total Importance], 0)

Features Top 80 Count =
COUNTROWS(
    FILTER(
        ALLSELECTED(FeatureImportance),
        [Cum Importance %] <= 0.8
    )
)

Dynamic TopN Value =
SELECTEDVALUE(TopNParameter[TopN], 10)

Show In Dynamic TopN =
IF(MAX(FeatureImportance[Rank]) <= [Dynamic TopN Value], 1, 0)

## 3) Page 2 - Executive Summary

Creer une nouvelle page nommee Executive Summary.

### Sections recommandees

1. Header KPI (3 cartes)
- Top Feature
- Top Importance %
- Features Top 80 Count

2. Insights bloc texte (Smart narrative ou text box)
- Exemple:
  - "Les 3 premieres variables expliquent X% de l'importance totale."

3. Pareto simplifie
- Line chart Rank vs Cum Importance %
- Ligne de seuil 80%

4. Tableau mini "Top 5"
- Rank <= 5
- Feature + ImportancePct

### Interaction utilisateur

- Ajouter un slicer Rank (Between) ou utiliser un parametre What-if TopN.
- Synchroniser les slicers entre la page 1 et la page 2 (View > Sync slicers).

## 4) Mise a jour automatique des donnees

La mise a jour du CSV est deja automatisee cote Python:
- A chaque execution de train_models.py, le script regenere powerbi_feature_importance.csv.

Dans Power BI:
1. Sauvegarder le .pbix dans le meme dossier que les CSV.
2. Data source settings > verifier le chemin local.
3. Home > Refresh pour prendre la derniere version du CSV.

Optionnel (Power BI Service):
- Publier le rapport.
- Configurer un gateway + Scheduled refresh.

## Bonus - Parametre TopN dynamique

1. Modeling > New parameter > Numeric range:
   - Name: TopNParameter
   - Min: 3, Max: 15, Increment: 1, Default: 10
2. Utiliser le slicer genere par Power BI.
3. Appliquer le measure Show In Dynamic TopN en filtre visuel:
   - Show In Dynamic TopN = 1

Vous obtenez ainsi un dashboard interactif TopN sans modifier la source CSV.
