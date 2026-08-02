from __future__ import annotations

import streamlit as st

from app_core import render_base_theme, render_dashboard_page


st.set_page_config(page_title="Feature Dashboard", page_icon="D", layout="wide")
render_base_theme()

st.title("Feature Dashboard")
st.write("Analyse des variables importantes du modele et export des graphiques.")

render_dashboard_page()
