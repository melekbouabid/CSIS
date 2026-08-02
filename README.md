# CSIS — Criminal Study Intelligent System

<p align="center">
  <img src="cesi.png" alt="CSIS Logo" width="180"/>
</p>

<p align="center">
  <strong>AI-powered criminal behavior risk assessment & Tunisian legal intelligence platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react"/>
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi"/>
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python"/>
  <img src="https://img.shields.io/badge/XGBoost-2.0+-FF6600?style=flat"/>
  <img src="https://img.shields.io/badge/Groq-LLaMA_3.3-F55036?style=flat"/>
</p>

---

## What is CSIS?

CSIS (Criminal Study Intelligent System) is a full-stack web platform that combines two AI engines to assist law enforcement professionals and legal researchers in Tunisia. It turns raw socio-behavioral data into actionable criminal risk intelligence and enables natural-language querying of Tunisian law.

| Engine | Description |
|--------|-------------|
| **Risk Predictor** | XGBoost model trained on 10,000 records — predicts criminal behavior risk (%) and likely crime type from 18 socio-behavioral features |
| **Legal Chatbot** | RAG pipeline over 1,485+ Tunisian law articles — answers legal questions with cited sources, powered by Groq LLaMA 3.3 / Gemini Flash |

---

## Platform Description

### Risk Assessment Engine

The risk assessment module accepts a 18-field profile describing an individual's socio-demographic and behavioral background. It outputs:

- **Risk percentage** (0–100%) — how likely this profile leads to criminal behavior
- **Binary decision** — "Futur criminel" or "Non criminel" (threshold: 20% probability)
- **Predicted crime type** — one of 21 crime categories (e.g. "Vol avec violence", "Trafic de drogue")

The prediction runs in real time via a REST API, with results displayed on an interactive dashboard with visual indicators, risk gauges, and history tracking per user session.

### Legal Intelligence Chatbot

The chatbot provides natural-language access to Tunisian law. Users type questions in French (or Arabic) and receive direct answers with source citations drawn from actual legal texts. The pipeline works as follows:

1. The user's query is vectorized using a TF-IDF model (bigrams, 1,485+ chunks)
2. Top-k most relevant article chunks are retrieved via cosine similarity
3. The retrieved context + question are sent to the LLM (Groq LLaMA 3.3 70B)
4. The LLM generates a grounded answer citing specific articles

Fallback chain: **Groq LLaMA 3.3** → **Gemini Flash** → **Claude Haiku** (if previous API fails or hits rate limits).

### User Dashboard

Authenticated users access a personal dashboard that tracks all past predictions, shows risk score distributions, and lets them revisit or export results. Charts are built with Recharts and update in real time after each prediction.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          BROWSER                                 │
│  React 18 SPA (Vite)                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  LoginPage   │  │ PredictionPg │  │     ChatbotPage      │   │
│  │  SignupPage  │  │  Dashboard   │  │  (RAG chat UI)       │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│         └─────────────────┴──────────────────────┘               │
│                     Vite proxy /api → :8000                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │  HTTP / JSON
┌────────────────────────────▼─────────────────────────────────────┐
│                     FastAPI Backend (:8000)                       │
│                                                                   │
│  /api/auth/*  ──► JWT auth (python-jose, bcrypt)                  │
│                                                                   │
│  /api/predict ──► Profile validator                               │
│                   │                                               │
│                   ├─► risk_model.joblib     (XGBoost binary)      │
│                   └─► crime_type_model.joblib (XGBoost 21-class)  │
│                                                                   │
│  /api/chat    ──► TF-IDF retriever (rag/ index)                   │
│                   │                                               │
│                   └─► LLM chain:                                  │
│                         1. Groq  llama-3.3-70b-versatile          │
│                         2. Gemini Flash (fallback)                │
│                         3. Claude Haiku  (fallback)               │
└───────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

- **Framework**: React 18 + Vite (dev server + prod bundler)
- **Routing**: React Router v6 (`/`, `/home`, `/prediction`, `/chatbot`, `/dashboard`, `/login`, `/signup`)
- **State**: React context — `AuthContext` (JWT token + user info), `I18nContext` (FR/EN/AR translations), `PredictionsContext` (session prediction history)
- **HTTP**: `apiFetch` helper wraps `fetch`, auto-attaches `Authorization: Bearer <token>`, proxies to backend via Vite config
- **Charts**: Recharts — `RadialBarChart` for risk gauge, `LineChart` for history trends
- **Styles**: Single `styles.css` with CSS custom properties and component-scoped class prefixes (`lp-*`, `chat-*`, `ft-*`, etc.)

### Backend Architecture

- **Framework**: FastAPI + Uvicorn (ASGI)
- **Entry point**: `app_fastapi.py` → mounts `api_server.py` router
- **Auth**: JWT tokens signed with HS256 (`python-jose`), passwords hashed with `bcrypt`, in-memory user store (no database dependency)
- **ML serving**: `joblib.load()` at startup loads two XGBoost models; prediction endpoint validates input with Pydantic, runs `model.predict_proba()`, returns JSON
- **RAG pipeline**:
  - PDFs in `rag/` are pre-parsed and chunked into 1,485+ text segments
  - `TfidfVectorizer(ngram_range=(1,2))` indexes all chunks at startup
  - At query time: vectorize query → cosine similarity → top-5 chunks → prompt → LLM
- **LLM fallback chain**: tries Groq first (fastest), then Gemini Flash, then Claude Haiku; each wrapped in `try/except` with timeout
- **CORS**: configured to allow `http://localhost:5173` (Vite dev) and any origin in production

### ML Model Details

| Model | Algorithm | Classes | Accuracy |
|-------|-----------|---------|----------|
| Risk classifier | XGBoost (binary) | 2 | ~85% |
| Crime type classifier | XGBoost (multiclass) | 21 | ~26.6% |

Training pipeline (`train_models.py`):
1. Load `criminals_dataset_10000.csv`
2. Impute missing values (most frequent strategy)
3. One-hot encode categorical features (18 total)
4. `GridSearchCV` with 5-fold stratified CV
5. Fit final models, serialize with `joblib`
6. Export `feature_importance.csv`

---

## Tech Stack

```
Frontend  →  React 18 + Vite + React Router + Recharts
Backend   →  FastAPI + Uvicorn (Python 3.10+)
ML        →  XGBoost + scikit-learn + joblib
RAG       →  TF-IDF vectorizer over Tunisian law PDFs
LLM       →  Groq (llama-3.3-70b) → Gemini Flash → Claude Haiku (fallback chain)
Auth      →  JWT (python-jose) + bcrypt
```

---

## Project Structure

```
CSIS09-05-main/
├── api_server.py            # FastAPI application (main backend)
├── app_fastapi.py           # FastAPI entry point (uvicorn target)
├── train_models.py          # XGBoost training script
├── risk_model.joblib        # Trained binary risk model
├── crime_type_model.joblib  # Trained multi-class crime type model
├── crime_label_encoder.joblib
├── criminals_dataset_10000.csv
├── requirements.txt
├── .env                     # API keys (Groq, Gemini, Anthropic)
├── start_servers.bat        # One-click Windows launcher
├── rag/                     # Tunisian law PDFs + TF-IDF index
├── frontend/
│   ├── src/
│   │   ├── pages/           # HomePage, PredictionPage, ChatbotPage, InfosPage, LoginPage…
│   │   ├── components/      # Navbar, Footer, …
│   │   ├── context/         # AuthContext, I18nContext, PredictionsContext
│   │   └── styles.css
│   ├── public/              # Static assets (logos, images)
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Quick Start

### Option A — One-click (Windows)

```bat
start_servers.bat
```

Opens two terminal windows: backend on `http://127.0.0.1:8000` and frontend on `http://localhost:5173`.

---

### Option B — Manual setup

#### 1. Clone & set up Python environment

```bash
git clone <repo-url>
cd CSIS09-05-main

# Create virtual environment
python -m venv .venv
# Activate — Windows PowerShell
.\.venv\Scripts\Activate.ps1
# Activate — Windows CMD
.venv\Scripts\activate.bat
# Activate — macOS / Linux
source .venv/bin/activate
```

#### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

#### 3. Configure environment variables

Create a `.env` file in the project root (or edit the existing one):

```env
# Groq — free tier: https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Gemini Flash — free tier: https://aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key_here

# Claude Haiku fallback (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

#### 4. Start the FastAPI backend

```bash
uvicorn app_fastapi:app --host 127.0.0.1 --port 8000 --reload
```

Backend runs at → `http://127.0.0.1:8000`
Interactive API docs → `http://127.0.0.1:8000/docs`

#### 5. Start the React frontend

```bash
cd frontend
npm install       # first time only
npm run dev
```

Frontend runs at → `http://localhost:5173`

> The Vite dev server proxies all `/api/*` requests to `http://127.0.0.1:8000` automatically.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/predict` | Run risk prediction on a 18-feature profile |
| `POST` | `/api/chat` | Send a message to the legal chatbot |
| `POST` | `/api/auth/signin` | Sign in — returns JWT token |
| `POST` | `/api/auth/signup` | Create a new account |
| `GET`  | `/api/auth/me` | Get current user (requires Bearer token) |
| `GET`  | `/docs` | Swagger UI |

### Prediction request example

```bash
curl -X POST http://127.0.0.1:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "gender": "Homme", "age": 25,
      "neighborhood_quality": "Pauvre", "neighborhood_safety_rating": 3,
      "academic_level": "Lycee", "parental_education": "Primaire",
      "family_situation": "Celibataire", "parental_marital_status": "Divorces",
      "family_criminal_history": "Oui", "family_psychological_issues": "Non",
      "friend_in_jail": "Oui", "has_psychological_problem": "Non",
      "psychological_condition": "Aucun", "mental_health_treatment": "Aucun",
      "financial_situation": "Precaire", "debt_level": "Elevee",
      "employment_status": "Chomeur", "addiction_type": "Alcool"
    }
  }'
```

Response:

```json
{
  "risk_percent": 87.4,
  "decision": "Futur criminel",
  "predicted_crime_type": "Vol avec violence"
}
```

### Chat request example

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quelles sont les peines pour vol simple selon le code pénal tunisien?"}'
```

---

## ML Models

### Training (optional — pre-trained models are included)

```bash
python train_models.py
```

This script:
- Loads `criminals_dataset_10000.csv`
- Imputes missing values
- Runs `GridSearchCV` hyperparameter tuning (5-fold stratified CV)
- Trains two XGBoost models (binary risk + 21-class crime type)
- Saves `.joblib` model files
- Exports `feature_importance.csv` and `powerbi_feature_importance.csv`

### Model performance

| Model | Accuracy | Notes |
|-------|----------|-------|
| Risk classifier | ~85% | Binary — threshold: 20% probability |
| Crime type classifier | ~26.6% | 21 imbalanced classes |

### The 18 input features

| Category | Features |
|----------|----------|
| Demographics | `gender`, `age` |
| Neighborhood | `neighborhood_quality`, `neighborhood_safety_rating` |
| Education | `academic_level`, `parental_education` |
| Family | `family_situation`, `parental_marital_status`, `family_criminal_history`, `family_psychological_issues`, `friend_in_jail` |
| Psychological | `has_psychological_problem`, `psychological_condition`, `mental_health_treatment` |
| Economic | `financial_situation`, `debt_level`, `employment_status` |
| Addiction | `addiction_type` |

---

## Build for Production

```bash
# Build the React frontend
cd frontend
npm run build
# Output goes to frontend/dist/

# Serve everything via FastAPI (static files + API)
cd ..
uvicorn app_fastapi:app --host 0.0.0.0 --port 8000
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| `uvicorn: command not found` | Run `pip install uvicorn` |
| Frontend shows blank page | Make sure backend is running on port 8000 |
| `GROQ_API_KEY not set` | Add key to `.env` and restart the backend |
| Gemini `limit: 0` error | Use a personal Google account key (not Workspace) |
| `npm: command not found` | Install Node.js from https://nodejs.org (LTS) |
| Port 8000 already in use | `uvicorn app_fastapi:app --port 8001` then update `.env` |
| Chatbot returns empty response | Check `.env` keys; Groq free tier has rate limits |
| Prediction always returns 0% | Ensure `risk_model.joblib` is present in project root |

---

## Team & Contributors

### Core Team

<table>
  <tr>
    <th>Photo</th>
    <th>Name</th>
    <th>Role</th>
    <th>Contact</th>
    <th>Links</th>
  </tr>
  <tr>
    <td><img src="melek.jpg" width="80" alt="Melek Bouabid"/></td>
    <td><b>Melek Bouabid</b></td>
    <td>Project Owner & Lead</td>
    <td>melekbouabid62@gmail.com</td>
    <td>
      <a href="https://github.com/melekbouabid"><img src="https://img.shields.io/badge/GitHub-100000?style=flat&logo=github"/></a>
    </td>
  </tr>
  <tr>
    <td><img src="raed.jpg" width="80" alt="Mohamed Raed Bouhali"/></td>
    <td><b>Mohamed Raed Bouhali</b></td>
    <td>Backend Development</td>
    <td>raedbouhali@gmail.com</td>
    <td>
      <a href="https://github.com/mohamedraedbouhali"><img src="https://img.shields.io/badge/GitHub-100000?style=flat&logo=github"/></a>
      <a href="https://www.linkedin.com/in/bouhali-mohamed-raed/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin"/></a>
    </td>
  </tr>
  <tr>
    <td><img src="ilef.jpg" width="80" alt="Ilef Ben Hassen"/></td>
    <td><b>Ilef Ben Hassen</b></td>
    <td>Frontend Development</td>
    <td>benhassenilef20@gmail.com</td>
    <td>
      <a href="https://github.com/BenHassenIlef"><img src="https://img.shields.io/badge/GitHub-100000?style=flat&logo=github"/></a>
      <a href="https://linkedin.com/in/ben-hassen-ilef-924859304/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin"/></a>
    </td>
  </tr>
  <tr>
    <td><img src="abir.jpg" width="80" alt="Abir Chmaingui"/></td>
    <td><b>Abir Chmaingui</b></td>
    <td>Frontend Development</td>
    <td>abirchmengui13@gmail.com</td>
    <td>
      <a href="https://github.com/abirChmaingui"><img src="https://img.shields.io/badge/GitHub-100000?style=flat&logo=github"/></a>
    </td>
  </tr>
</table>

### Contributions
All team members contributed to:
- **ML Model Development**: XGBoost model training and optimization
- **RAG System**: Tunisian law document processing and chatbot integration
- **Full Stack Development**: React frontend and FastAPI backend
- **System Architecture**: Design and implementation of the platform

### How to Contribute
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

---

## License

Developed for educational purposes as part of the *Artificial Intelligence & Business Intelligence* academic module — ISAMM / ISSIG, Tunisia.
