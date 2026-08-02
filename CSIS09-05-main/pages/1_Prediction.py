from __future__ import annotations

import streamlit as st

from app_core import build_input_form, ensure_models_exist, render_base_theme, render_prediction_result, run_prediction


st.set_page_config(page_title="Prediction", page_icon="P", layout="wide")
render_base_theme()

st.title("Prediction")
st.write("Module principal de prediction du risque criminel futur.")

ensure_models_exist()

with st.form("risk_form"):
    input_profile = build_input_form()
    submitted = st.form_submit_button("Predire", use_container_width=True)

if submitted:
    render_prediction_result(run_prediction(input_profile))

elif st.session_state.get("last_prediction"):
    st.caption("Dernier resultat conserve dans la session.")
    render_prediction_result(st.session_state["last_prediction"])
