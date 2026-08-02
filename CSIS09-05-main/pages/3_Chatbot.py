from __future__ import annotations

import streamlit as st

from app_core import build_chatbot_reply, render_base_theme, render_chatbot_theme


st.set_page_config(page_title="Chatbot", page_icon="C", layout="wide")
render_base_theme()
render_chatbot_theme()

if "chat_messages" not in st.session_state:
    st.session_state["chat_messages"] = [
        {
            "role": "assistant",
            "content": "Assistant pret. Posez une question sur la prediction, le dashboard ou la derniere analyse.",
        }
    ]

st.markdown(
    """
    <div class="chat-shell">
        <div class="eyebrow">Application Isolee</div>
        <h1 style="margin:0; color:#0b4ea7;">Chatbot</h1>
        <p style="color:#355a86; margin:.55rem 0 0 0;">
            Cette interface est separee des autres modules. Elle reprend l'idee visuelle du projet chatbot
            et reste dans une page dediee.
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

col1, col2, col3 = st.columns(3)
col1.markdown('<div class="chat-stat"><div class="eyebrow">Mode</div><strong>Assistant interne</strong><p style="color:#355a86;">Guide d usage de la plateforme fusionnee.</p></div>', unsafe_allow_html=True)
col2.markdown('<div class="chat-stat"><div class="eyebrow">Etat</div><strong>En ligne</strong><p style="color:#355a86;">Session conservee cote Streamlit.</p></div>', unsafe_allow_html=True)
col3.markdown('<div class="chat-stat"><div class="eyebrow">Derniere prediction</div><strong>' + ("Disponible" if st.session_state.get("last_prediction") else "Aucune") + '</strong><p style="color:#355a86;">Le bot peut relire le dernier resultat.</p></div>', unsafe_allow_html=True)

st.write("")
for message in st.session_state["chat_messages"]:
    css_class = "chat-user" if message["role"] == "user" else "chat-assistant"
    author = "Vous" if message["role"] == "user" else "Assistant"
    st.markdown(
        f'<div class="chat-message {css_class}"><strong>{author}</strong><br>{message["content"]}</div>',
        unsafe_allow_html=True,
    )

with st.form("chatbot_form", clear_on_submit=True):
    prompt = st.text_area(
        "Votre message",
        placeholder="Exemple: rappelle-moi la derniere prediction ou explique le dashboard.",
        height=140,
    )
    submitted = st.form_submit_button("Envoyer", use_container_width=True)

if submitted and prompt.strip():
    st.session_state["chat_messages"].append({"role": "user", "content": prompt.strip()})
    st.session_state["chat_messages"].append({"role": "assistant", "content": build_chatbot_reply(prompt.strip())})
    st.rerun()
