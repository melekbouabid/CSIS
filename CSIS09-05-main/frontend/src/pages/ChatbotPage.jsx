import { useState, useEffect, useRef } from "react";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";

const CHAT_ENDPOINTS = [
  "/api/chat",
  `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api/chat`,
];

/* ─── Particle canvas background ───────────────────────────────────── */
function ParticleBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let rafId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.8 + 0.8,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(180,140,30,${0.14 * (1 - d / 130)})`; ctx.lineWidth = 0.7; ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212,168,54,0.45)"; ctx.fill();
      });
      rafId = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(rafId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="chat-bg-canvas" aria-hidden="true" />;
}

/* ─── Themis — Goddess of Justice ──────────────────────────────────── */
function Themis() {
  return (
    <div className="chat-robot chat-themis" aria-hidden="true">
      <img src="/themis.png" alt="" aria-hidden="true" className="chat-themis-image" />
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
function ChatbotPage() {
  const { t }    = useI18n();
  const { user } = useAuth();
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const [messages, setMessages] = useState([
    { role: "assistant", content: t("chat.assistantReady"), sources: [] },
  ]);
  const [input,     setInput]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mouse,     setMouse]     = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const postChatMessage = async (content) => {
    let lastError = new Error("Server connection failed.");
    for (const endpoint of CHAT_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content }),
        });
        const raw = await response.text();
        let data = {};
        try { data = raw ? JSON.parse(raw) : {}; } catch { data = { reply: raw }; }
        if (!response.ok) { lastError = new Error(data?.detail || data?.reply || `HTTP ${response.status}`); continue; }
        return data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Server connection failed.");
      }
    }
    throw lastError;
  };

  const send = async () => {
    const content = input.trim();
    if (!content || isLoading) return;
    setMessages(prev => [...prev, { role: "user", content }]);
    setInput("");
    setIsLoading(true);
    try {
      const data = await postChatMessage(content);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply || t("chat.noResponse"),
        sources: Array.isArray(data.sources) ? data.sources : [],
      }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Server connection failed.";
      setMessages(prev => [...prev, { role: "assistant", content: `${t("chat.requestFailed")} ${msg}`, sources: [] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-page-layout">

      {/* ── Chat column ── */}
      <section className="chat-shell">
        <ParticleBg />

        <div className="chat-topbar">
          <div>
            <h1>{t("chat.title")}</h1>
            <p>{t("chat.subtitle")}</p>
          </div>
          <div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
            <span className="chat-online">
              <span className="chat-online-dot" aria-hidden="true" />
              Online
            </span>
            <button className="chat-clear" onClick={() => { setMessages([messages[0]]); setInput(""); }}>
              {t("common.clear")}
            </button>
          </div>
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {messages.map((message, index) => (
            <div key={index} className={`chat-msg-group ${message.role}`}>
              <div className="chat-msg-who">
                {message.role === "user" ? t("chat.you") : t("chat.assistant")}
              </div>
              <div className="chat-msg-row">
                {message.role === "assistant" && (
                  <div className="chat-avatar chat-avatar-bot">
                    <img src="/go.webp" alt="" aria-hidden="true" className="chat-avatar-bot-image" />
                  </div>
                )}
                <div className="chat-bubble">
                  <div>{message.content}</div>
                  {message.role === "assistant" && message.sources?.length > 0 && (
                    <div className="chat-src">{t("chat.sources")}: {message.sources.join(", ")}</div>
                  )}
                </div>
                {message.role === "user" && <div className="chat-avatar chat-avatar-user">{userInitial}</div>}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-msg-group assistant">
              <div className="chat-msg-who">{t("chat.assistant")}</div>
              <div className="chat-msg-row">
                <div className="chat-avatar chat-avatar-bot">
                  <img src="/go.webp" alt="" aria-hidden="true" className="chat-avatar-bot-image" />
                </div>
                <div className="chat-typing">
                  <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
                </div>
              </div>
            </div>
          )}
        </div>

        <form className="chat-inputbar" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea
            className="chat-input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder")}
            disabled={isLoading}
            rows={2}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button className="chat-send" type="submit" disabled={isLoading}>
            {isLoading ? t("common.sending") : t("common.send")} ↑
          </button>
        </form>
      </section>

      {/* ── Themis column ── */}
      <div className="chat-robot-col">
        <Themis mouse={mouse} />
      </div>

    </div>
  );
}

export default ChatbotPage;
