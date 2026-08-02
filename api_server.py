from __future__ import annotations

import argparse
import json
import os
import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _strip_accents(text: str) -> str:
    """Normalize accented characters so TF-IDF matches across accent variants."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover
    PdfReader = None

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except Exception:
    pass

try:
    import anthropic as _anthropic_module
    _ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    _anthropic_client = _anthropic_module.Anthropic(api_key=_ANTHROPIC_KEY) if _ANTHROPIC_KEY else None
except Exception:
    _anthropic_client = None

try:
    from google import genai as _genai_sdk
    _GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
    _gemini_client = _genai_sdk.Client(api_key=_GEMINI_KEY) if _GEMINI_KEY else None
except Exception:
    _gemini_client = None

try:
    import groq as _groq_module
    _GROQ_KEY = os.getenv("GROQ_API_KEY", "")
    _groq_client = _groq_module.Groq(api_key=_GROQ_KEY) if _GROQ_KEY else None
except Exception:
    _groq_client = None

from train_models import FEATURE_COLUMNS, predict_risk

BASE_DIR = Path(__file__).resolve().parent
FEATURE_IMPORTANCE_PATH = BASE_DIR / "powerbi_feature_importance.csv"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000


@dataclass(frozen=True)
class RAGChunk:
    source: str
    text: str


class LocalRAGRetriever:
    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir
        self.chunks: list[RAGChunk] = []
        self.vectorizer: TfidfVectorizer | None = None
        self.matrix = None

    def _knowledge_files(self) -> list[Path]:
        rag_dir = self.base_dir / "rag"
        if rag_dir.exists() and rag_dir.is_dir():
            allowed = {".pdf", ".txt", ".md", ".csv"}
            rag_files = [
                path
                for path in sorted(rag_dir.rglob("*"))
                if path.is_file() and (path.suffix.lower() in allowed or path.suffix == "")
            ]
            if rag_files:
                return rag_files

        # Fallback retrieval scoped to user-facing project documentation.
        candidates = [
            self.base_dir / "README.md",
            self.base_dir / "INSTALLATION.md",
            self.base_dir / "POWERBI_DASHBOARD_GUIDE.md",
            self.base_dir / "FICHIERS_INCLUS.txt",
            self.base_dir / "app" / "README.md",
            self.base_dir / "app" / "INSTALLATION.md",
            self.base_dir / "app" / "FICHIERS_INCLUS.txt",
        ]
        return [path for path in candidates if path.exists()]

    @staticmethod
    def _read_file_text(file_path: Path) -> str:
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            if PdfReader is None:
                return ""

            pages_text: list[str] = []
            reader = PdfReader(str(file_path))
            for page in reader.pages:
                page_text = page.extract_text() or ""
                page_text = re.sub(r"\s+", " ", page_text).strip()
                if page_text:
                    pages_text.append(page_text)
            return "\n\n".join(pages_text)

        return file_path.read_text(encoding="utf-8", errors="ignore")

    @staticmethod
    def _split_text(text: str, max_chars: int = 900) -> list[str]:
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        chunks: list[str] = []
        current = ""

        for paragraph in paragraphs:
            paragraph = re.sub(r"\s+", " ", paragraph)
            if len(paragraph) > max_chars:
                paragraph = paragraph[:max_chars]

            candidate = f"{current} {paragraph}".strip() if current else paragraph
            if len(candidate) <= max_chars:
                current = candidate
                continue

            if current:
                chunks.append(current)
            current = paragraph

        if current:
            chunks.append(current)

        return chunks

    def build_index(self) -> None:
        chunks: list[RAGChunk] = []
        for file_path in self._knowledge_files():
            text = self._read_file_text(file_path)
            if not text.strip():
                continue

            for chunk in self._split_text(text):
                source = file_path.relative_to(self.base_dir).as_posix()
                chunks.append(RAGChunk(source=source, text=chunk))

        if not chunks:
            self.chunks = []
            self.vectorizer = None
            self.matrix = None
            return

        self.chunks = chunks
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        # Index with accent-stripped text for robust matching
        self.matrix = self.vectorizer.fit_transform(
            [_strip_accents(chunk.text) for chunk in self.chunks]
        )

    def search(self, query: str, top_k: int = 3, min_score: float = 0.08) -> list[dict[str, str | float]]:
        if not self.chunks or self.vectorizer is None or self.matrix is None:
            return []

        query_vector = self.vectorizer.transform([_strip_accents(query)])
        scores = cosine_similarity(query_vector, self.matrix).ravel()
        ranked = scores.argsort()[::-1]

        results: list[dict[str, str | float]] = []
        for index in ranked:
            score = float(scores[index])
            if score < min_score:
                continue

            chunk = self.chunks[index]
            results.append({"source": chunk.source, "text": chunk.text, "score": score})
            if len(results) >= top_k:
                break

        return results


def _preview_text(text: str, max_chars: int = 320) -> str:
    compact = re.sub(r"\s+", " ", text).strip()
    if len(compact) <= max_chars:
        return compact
    return compact[: max_chars - 1].rstrip() + "..."


def _source_display_name(source: str) -> str:
    """Return a clean human-readable document name from a RAG source path."""
    stem = Path(source).stem
    # Remove common suffixes like " (1)", " - Tunisie", fix encoding artefacts
    stem = re.sub(r"\s*\(\d+\)$", "", stem).strip()
    stem = re.sub(r"\s*-\s*Tunisie.*$", "", stem, flags=re.IGNORECASE).strip()
    stem = stem.replace("_", " ")
    return stem or source


def _extract_best_sentences(text: str, query_tokens: set[str], max_sents: int = 2) -> list[str]:
    """Score and extract the most relevant sentences from a chunk."""
    # Split on sentence-endings followed by uppercase or article markers
    parts = re.split(r"(?<=[.;])\s+(?=[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ]|Article\s|Art\.\s)", text)
    scored: list[tuple[int, str]] = []
    for part in parts:
        part = re.sub(r"\s+", " ", part).strip()
        if len(part) < 35:
            continue
        tokens = set(re.sub(r"[^\w\s]", "", part.lower()).split())
        score = len(tokens & query_tokens)
        scored.append((score, part))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [s[1] for s in scored[:max_sents]]


def _build_local_rag_reply(query: str, hits: list[dict[str, Any]]) -> str:
    """Synthesize a readable answer from RAG chunks without an LLM."""
    query_tokens = set(re.sub(r"[^\w\s]", "", query.lower()).split())

    collected: list[str] = []
    seen: set[str] = set()

    for hit in hits[:4]:
        for sent in _extract_best_sentences(str(hit["text"]), query_tokens, max_sents=2):
            key = sent[:55]
            if key not in seen:
                seen.add(key)
                collected.append(sent)
        if len(collected) >= 3:
            break

    if not collected:
        collected = [_preview_text(str(hits[0]["text"]))]

    sources_clean = sorted({_source_display_name(str(h["source"])) for h in hits[:3]})
    body = "\n\n".join(collected[:3])
    src_line = "   ".join(f"📄 {s}" for s in sources_clean[:2])
    return f"{body}\n\n{src_line}"


def _build_llm_rag_reply(query: str, hits: list[dict[str, Any]]) -> str | None:
    """Use Claude to synthesize a grounded answer from RAG chunks. Returns None on failure."""
    if _anthropic_client is None:
        return None

    context_parts = []
    for hit in hits[:4]:
        src = _source_display_name(str(hit["source"]))
        context_parts.append(f"[{src}]\n{re.sub(r'[\\s]+', ' ', str(hit['text'])).strip()}")
    context = "\n\n---\n\n".join(context_parts)

    system_prompt = _SYSTEM_RAG

    try:
        response = _anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=700,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Context from legal documents:\n\n{context}\n\nQuestion: {query}",
                }
            ],
        )
        return response.content[0].text  # type: ignore[union-attr]
    except Exception:
        return None


_SYSTEM_RAG = (
    "You are a helpful AI assistant built into the CSIS criminal-risk analysis platform. "
    "When legal document excerpts are provided, use them to ground your answer and cite relevant article numbers. "
    "You can also answer general knowledge questions, maths, science, history, and any other topic. "
    "Reply in the same language the user writes in (French, Arabic, or English). "
    "Be concise and clear."
)

_SYSTEM_GENERAL = (
    "You are a helpful AI assistant built into the CSIS criminal-risk analysis platform. "
    "Answer any question the user asks — general knowledge, maths, science, history, coding, etc. "
    "If the question is about Tunisian law or criminal risk assessment, mention the relevant platform features. "
    "Reply in the same language the user writes in (French, Arabic, or English). "
    "Be concise and clear."
)


def _build_gemini_rag_reply(query: str, hits: list[dict[str, Any]]) -> str | None:
    """Use Gemini to answer with RAG context. Returns None on failure."""
    if _gemini_client is None:
        return None

    context_parts = []
    for hit in hits[:5]:
        src = _source_display_name(str(hit["source"]))
        context_parts.append(f"[{src}]\n{re.sub(r'[\\s]+', ' ', str(hit['text'])).strip()}")
    context = "\n\n---\n\n".join(context_parts)

    prompt = (
        f"{_SYSTEM_RAG}\n\n"
        f"Relevant legal document excerpts:\n\n{context}\n\n"
        f"User question: {query}"
    )

    try:
        from google.genai import types as _genai_types
        response = _gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=_genai_types.GenerateContentConfig(max_output_tokens=800, temperature=0.3),
        )
        return response.text
    except Exception:
        return None


def _build_gemini_general_reply(query: str) -> str | None:
    """Use Gemini to answer any question without RAG context. Returns None on failure."""
    if _gemini_client is None:
        return None

    prompt = f"{_SYSTEM_GENERAL}\n\nUser: {query}"

    try:
        from google.genai import types as _genai_types
        response = _gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=_genai_types.GenerateContentConfig(max_output_tokens=800, temperature=0.7),
        )
        return response.text
    except Exception:
        return None


def _build_groq_rag_reply(query: str, hits: list[dict[str, Any]]) -> str | None:
    """Use Groq (llama) to answer with RAG context. Returns None on failure."""
    if _groq_client is None:
        return None

    context_parts = []
    for hit in hits[:5]:
        src = _source_display_name(str(hit["source"]))
        context_parts.append(f"[{src}]\n{re.sub(r'[\\s]+', ' ', str(hit['text'])).strip()}")
    context = "\n\n---\n\n".join(context_parts)

    try:
        response = _groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=800,
            temperature=0.3,
            messages=[
                {"role": "system", "content": _SYSTEM_RAG},
                {"role": "user", "content": f"Relevant legal document excerpts:\n\n{context}\n\nUser question: {query}"},
            ],
        )
        return response.choices[0].message.content
    except Exception:
        return None


def _build_groq_general_reply(query: str) -> str | None:
    """Use Groq (llama) to answer any general question. Returns None on failure."""
    if _groq_client is None:
        return None

    try:
        response = _groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=800,
            temperature=0.7,
            messages=[
                {"role": "system", "content": _SYSTEM_GENERAL},
                {"role": "user", "content": query},
            ],
        )
        return response.choices[0].message.content
    except Exception:
        return None


def _build_claude_general_reply(query: str) -> str | None:
    """Use Claude to answer any question without RAG context. Returns None on failure."""
    if _anthropic_client is None:
        return None

    try:
        response = _anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            system=_SYSTEM_GENERAL,
            messages=[{"role": "user", "content": query}],
        )
        return response.content[0].text  # type: ignore[union-attr]
    except Exception:
        return None


@lru_cache(maxsize=1)
def get_rag_retriever() -> LocalRAGRetriever:
    retriever = LocalRAGRetriever(BASE_DIR)
    retriever.build_index()
    return retriever


def warmup_rag_index() -> None:
    try:
        get_rag_retriever()
    except Exception:
        pass


def _json_response(data: Any, status: int = HTTPStatus.OK) -> tuple[int, bytes]:
    return status, json.dumps(data, ensure_ascii=False).encode("utf-8")


def _read_json_body(request: BaseHTTPRequestHandler) -> dict[str, Any]:
    content_length = int(request.headers.get("Content-Length", "0") or 0)
    if content_length <= 0:
        return {}

    raw_body = request.rfile.read(content_length)
    if not raw_body.strip():
        return {}

    decoded = raw_body.decode("utf-8")
    payload = json.loads(decoded)
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")
    return payload


def _feature_importance_rows() -> list[dict[str, Any]]:
    if not FEATURE_IMPORTANCE_PATH.exists():
        return []

    df = pd.read_csv(FEATURE_IMPORTANCE_PATH)
    expected = {"Rank", "Feature", "Importance", "ImportancePct", "CumulativeImportancePct"}
    if not expected.issubset(set(df.columns)):
        return []

    return df.sort_values("Rank").to_dict(orient="records")


def _chat_response(message: str) -> dict[str, Any]:
    user_message = message.strip()
    if not user_message:
        return {"reply": "Please send a message.", "sources": [], "used_rag": False}

    # --- RAG retrieval ---
    rag_hits: list[dict[str, Any]] = []
    try:
        retriever = get_rag_retriever()
        rag_hits = retriever.search(user_message, top_k=5, min_score=0.05)
    except Exception:
        pass

    if rag_hits:
        # Legal question: Groq → Gemini → Claude → local extraction
        reply = _build_groq_rag_reply(user_message, rag_hits)
        if not reply:
            reply = _build_gemini_rag_reply(user_message, rag_hits)
        if not reply:
            reply = _build_llm_rag_reply(user_message, rag_hits)
        if not reply:
            reply = _build_local_rag_reply(user_message, rag_hits)
        sources = sorted({str(hit["source"]) for hit in rag_hits})
        return {"reply": reply, "sources": sources, "used_rag": True}

    # --- General question: Groq → Gemini → Claude → fallback ---
    reply = _build_groq_general_reply(user_message)
    if not reply:
        reply = _build_gemini_general_reply(user_message)
    if not reply:
        reply = _build_claude_general_reply(user_message)
    if reply:
        return {"reply": reply, "sources": [], "used_rag": False}

    # --- Last resort: no LLM available ---
    return {
        "reply": (
            "I can answer any question, but no AI key is configured right now. "
            "Add a **GEMINI_API_KEY** or **ANTHROPIC_API_KEY** in the `.env` file to enable full responses. "
            "For Tunisian law questions the local document search is always available."
        ),
        "sources": [],
        "used_rag": False,
    }


class ApiRequestHandler(BaseHTTPRequestHandler):
    server_version = "CSISAPI/1.0"

    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, data: Any, status: int = HTTPStatus.OK) -> None:
        payload_status, payload = _json_response(data, status)
        self.send_response(payload_status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_error_json(self, status: int, detail: str) -> None:
        self._send_json({"detail": detail}, status=status)

    def do_OPTIONS(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        self.send_response(HTTPStatus.NO_CONTENT)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        path = urlparse(self.path).path

        if path == "/api/health":
            self._send_json({"status": "ok"})
            return

        if path == "/api/features":
            self._send_json({"features": FEATURE_COLUMNS})
            return

        if path == "/api/feature-importance":
            self._send_json(_feature_importance_rows())
            return

        self._send_error_json(HTTPStatus.NOT_FOUND, "Not found")

    def do_POST(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        path = urlparse(self.path).path

        try:
            payload = _read_json_body(self)
        except json.JSONDecodeError:
            self._send_error_json(HTTPStatus.BAD_REQUEST, "Invalid JSON payload")
            return
        except ValueError as exc:
            self._send_error_json(HTTPStatus.BAD_REQUEST, str(exc))
            return

        if path == "/api/predict":
            profile = payload.get("profile")
            if not isinstance(profile, dict):
                self._send_error_json(HTTPStatus.BAD_REQUEST, "Missing features: profile")
                return

            missing_features = [feature for feature in FEATURE_COLUMNS if feature not in profile]
            if missing_features:
                self._send_error_json(HTTPStatus.BAD_REQUEST, f"Missing features: {', '.join(missing_features)}")
                return

            try:
                self._send_json(predict_risk(profile))
            except Exception as exc:
                self._send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(exc))
            return

        if path == "/api/chat":
            message = payload.get("message")
            if not isinstance(message, str):
                self._send_error_json(HTTPStatus.BAD_REQUEST, "Missing message")
                return

            self._send_json(_chat_response(message))
            return

        self._send_error_json(HTTPStatus.NOT_FOUND, "Not found")

    def log_message(self, format: str, *args: Any) -> None:
        # Keep the console output compact during local development.
        return


def create_server(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> ThreadingHTTPServer:
    warmup_rag_index()
    return ThreadingHTTPServer((host, port), ApiRequestHandler)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the CSIS local API server.")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host to bind to.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to bind to.")
    args = parser.parse_args()

    server = create_server(args.host, args.port)
    print(f"Serving CSIS API on http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
