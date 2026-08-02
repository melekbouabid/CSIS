import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "2-digit", month: "short" }) + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(msgs) {
  const groups = {};
  msgs.forEach(m => {
    const key = new Date(m.timestamp).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return Object.entries(groups);
}

function dateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}

function MessagesWidget({ unreadCount, onOpen }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const otherRole = user?.role === "admin" ? "Therapist" : "Admin";
  const otherRoleDesc = user?.role === "admin" ? "Clinical Therapist" : "System Administrator";
  const otherInitial = otherRole[0];

  const fetchMessages = async (markRead = true) => {
    try {
      const data = await apiFetch("/api/messages");
      setMessages(Array.isArray(data) ? data : []);
      if (markRead) {
        await apiFetch("/api/messages/read", { method: "PATCH" });
        if (onOpen) onOpen();
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    fetchMessages(true);
    const id = setInterval(() => fetchMessages(true), 8000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (open && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, [input]);

  const clearChat = async () => {
    if (!window.confirm("Effacer toute la conversation ? Cette action est irréversible.")) return;
    setClearing(true);
    try {
      await apiFetch("/api/messages", { method: "DELETE" });
      setMessages([]);
    } catch (_) {}
    setClearing(false);
  };

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    try {
      await apiFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      await fetchMessages(false);
    } catch (_) {}
    setSending(false);
  };

  const grouped = groupByDate(messages);

  return (
    <div className="mw-root">

      {/* Expanded panel */}
      {open && (
        <div className="mw-panel">

          {/* Header */}
          <div className="mw-header">
            <div className="mw-header-id">
              <div className="mw-header-av">{otherInitial}</div>
              <div>
                <div className="mw-header-name">{otherRole}</div>
                <div className="mw-header-role">{otherRoleDesc}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "auto" }}>
              <button
                className="mw-close"
                onClick={clearChat}
                disabled={clearing || messages.length === 0}
                title="Effacer la conversation"
                style={{ opacity: messages.length === 0 ? 0.35 : 1, fontSize: "0.75rem", padding: "0.3rem 0.55rem" }}
              >
                🗑
              </button>
              <button className="mw-close" onClick={() => setOpen(false)} title="Fermer">✕</button>
            </div>
          </div>

          {/* Body */}
          <div className="mw-body" ref={scrollRef}>
            {loading ? (
              <div className="mw-empty">⏳ Loading…</div>
            ) : messages.length === 0 ? (
              <div className="mw-empty">💬 No messages yet — start the conversation.</div>
            ) : (
              grouped.map(([dateStr, dayMsgs]) => (
                <div key={dateStr}>
                  <div className="mw-date-divider">{dateLabel(dateStr)}</div>
                  {dayMsgs.map(msg => {
                    const isMe = msg.from_email === user?.email;
                    return (
                      <div key={msg.id} className={`mw-row ${isMe ? "mw-row--me" : "mw-row--them"}`}>
                        {!isMe && (
                          <div className="mw-av mw-av--them">{msg.from_name?.[0]?.toUpperCase() || "?"}</div>
                        )}
                        <div className={`mw-bubble ${isMe ? "mw-bubble--me" : "mw-bubble--them"}`}>
                          <div className="mw-content">{msg.content}</div>
                          <div className="mw-time">{formatTime(msg.timestamp)}</div>
                        </div>
                        {isMe && (
                          <div className="mw-av mw-av--me">{user?.name?.[0]?.toUpperCase() || "?"}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="mw-input-area">
            <div className="mw-input-box">
              <textarea
                ref={textareaRef}
                className="mw-textarea"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Message ${otherRole}…`}
                rows={1}
                disabled={sending}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <button
                className="mw-send"
                onClick={send}
                disabled={sending || !input.trim()}
                type="button"
              >
                {sending ? "…" : "↑"}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Floating circle trigger */}
      <button
        className={`mw-btn${open ? " mw-btn--open" : ""}`}
        onClick={() => setOpen(o => !o)}
        title={`Message ${otherRole}`}
      >
        {open ? (
          <span className="mw-btn-x">✕</span>
        ) : (
          <>
            <span className="mw-btn-icon">💬</span>
            {unreadCount > 0 && (
              <span className="mw-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </>
        )}
      </button>

    </div>
  );
}

export default MessagesWidget;
