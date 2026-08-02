from __future__ import annotations

import json
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import jwt
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from train_models import FEATURE_COLUMNS, predict_risk
from api_server import _chat_response, _feature_importance_rows, warmup_rag_index

# ── Paths & constants ──────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
USERS_FILE = DATA_DIR / "users.json"
PREDICTIONS_FILE = DATA_DIR / "predictions.json"

JWT_SECRET = "csis-local-dev-secret"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30

DEMO_USER = {
    "email": "user@gmail.com",
    "password": "user",
    "name": "Demo User",
    "age": None,
    "phone": None,
    "location": None,
    "avatar": None,
}


# ── JSON helpers ──────────────────────────────────────────────────────────────
def _load(path: Path, default: Any) -> Any:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return default


def _save(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _init_data() -> None:
    users = _load(USERS_FILE, {})
    if DEMO_USER["email"] not in users:
        users[DEMO_USER["email"]] = DEMO_USER.copy()
        _save(USERS_FILE, users)

    preds = _load(PREDICTIONS_FILE, {})
    if not isinstance(preds, dict):
        _save(PREDICTIONS_FILE, {})


_init_data()


# ── JWT ────────────────────────────────────────────────────────────────────────
def _make_token(email: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode({"sub": email, "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _read_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── Auth dependency ────────────────────────────────────────────────────────────
_bearer = HTTPBearer(auto_error=False)


def current_user(creds: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    email = _read_token(creds.credentials)
    users = _load(USERS_FILE, {})
    if email not in users:
        raise HTTPException(status_code=401, detail="User not found")
    return users[email]


def _public(u: dict) -> dict:
    return {k: u.get(k) for k in ("email", "name", "avatar", "age", "phone", "location")}


# ── Lifespan (warm-up RAG index) ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    warmup_rag_index()
    yield


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="CSIS API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / response models ──────────────────────────────────────────────────
class LoginBody(BaseModel):
    email: str
    password: str


class SignupBody(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    avatar: Optional[str] = None


class UpdateProfileBody(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None


class ChangePasswordBody(BaseModel):
    oldPassword: str
    newPassword: str


class PredictionBody(BaseModel):
    profile: Dict[str, Any]
    result: Dict[str, Any]
    timestamp: Optional[str] = None


class UpdatePredictionBody(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    control: Optional[str] = None


class PredictBody(BaseModel):
    profile: Dict[str, Any]


class ChatBody(BaseModel):
    message: str


# ── Auth ───────────────────────────────────────────────────────────────────────
@app.post("/api/auth/login")
def login(body: LoginBody):
    users = _load(USERS_FILE, {})
    email = body.email.strip().lower()
    user = users.get(email)
    if not user or user.get("password") != body.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": _make_token(email), "user": _public(user)}


@app.post("/api/auth/signup")
def signup(body: SignupBody):
    users = _load(USERS_FILE, {})
    email = body.email.strip().lower()
    if email in users:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = {
        "email": email,
        "password": body.password,
        "name": body.name,
        "age": body.age,
        "phone": body.phone,
        "location": body.location,
        "avatar": body.avatar,
    }
    users[email] = user
    _save(USERS_FILE, users)
    return {"token": _make_token(email), "user": _public(user)}


@app.get("/api/auth/me")
def me(user: dict = Depends(current_user)):
    return _public(user)


@app.put("/api/auth/profile")
def update_profile(body: UpdateProfileBody, user: dict = Depends(current_user)):
    users = _load(USERS_FILE, {})
    stored = users.get(user["email"], {})
    if body.name is not None:
        stored["name"] = body.name
    if body.email is not None:
        stored["email"] = body.email
    if body.avatar is not None:
        stored["avatar"] = body.avatar
    users[user["email"]] = stored
    _save(USERS_FILE, users)
    return {"user": _public(stored)}


@app.put("/api/auth/password")
def change_password(body: ChangePasswordBody, user: dict = Depends(current_user)):
    users = _load(USERS_FILE, {})
    stored = users.get(user["email"], {})
    if stored.get("password") != body.oldPassword:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    stored["password"] = body.newPassword
    users[user["email"]] = stored
    _save(USERS_FILE, users)
    return {"ok": True}


# ── Predictions history ────────────────────────────────────────────────────────
@app.get("/api/predictions")
def get_predictions(user: dict = Depends(current_user)):
    preds = _load(PREDICTIONS_FILE, {})
    return preds.get(user["email"], [])


@app.post("/api/predictions")
def add_prediction(body: PredictionBody, user: dict = Depends(current_user)):
    preds = _load(PREDICTIONS_FILE, {})
    email = user["email"]
    entry = {
        "id": str(uuid.uuid4()),
        "timestamp": body.timestamp or datetime.now(timezone.utc).isoformat(),
        "profile": body.profile,
        "result": body.result,
    }
    user_preds = preds.get(email, [])
    user_preds.insert(0, entry)
    preds[email] = user_preds
    _save(PREDICTIONS_FILE, preds)
    return entry


@app.delete("/api/predictions/all")
def clear_predictions(user: dict = Depends(current_user)):
    preds = _load(PREDICTIONS_FILE, {})
    preds[user["email"]] = []
    _save(PREDICTIONS_FILE, preds)
    return {"ok": True}


@app.patch("/api/predictions/{pred_id}")
def update_prediction_meta(pred_id: str, body: UpdatePredictionBody, user: dict = Depends(current_user)):
    preds = _load(PREDICTIONS_FILE, {})
    email = user["email"]
    user_preds = preds.get(email, [])
    for p in user_preds:
        if p.get("id") == pred_id:
            if body.name is not None:
                p["name"] = body.name
            if body.notes is not None:
                p["notes"] = body.notes
            if body.control is not None:
                p["control"] = body.control
            break
    else:
        raise HTTPException(status_code=404, detail="Prediction not found")
    preds[email] = user_preds
    _save(PREDICTIONS_FILE, preds)
    return {"ok": True}


@app.delete("/api/predictions/{pred_id}")
def delete_prediction(pred_id: str, user: dict = Depends(current_user)):
    preds = _load(PREDICTIONS_FILE, {})
    email = user["email"]
    preds[email] = [p for p in preds.get(email, []) if p.get("id") != pred_id]
    _save(PREDICTIONS_FILE, preds)
    return {"ok": True}


# ── ML prediction ──────────────────────────────────────────────────────────────
@app.post("/api/predict")
def predict(body: PredictBody):
    missing = [f for f in FEATURE_COLUMNS if f not in body.profile]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing features: {', '.join(missing)}")
    try:
        return predict_risk(body.profile)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Chat / RAG ─────────────────────────────────────────────────────────────────
@app.post("/api/chat")
def chat(body: ChatBody):
    return _chat_response(body.message)


# ── Utility ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/features")
def features():
    return {"features": FEATURE_COLUMNS}


@app.get("/api/feature-importance")
def feature_importance():
    return _feature_importance_rows()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
