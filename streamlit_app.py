from __future__ import annotations

import streamlit as st
from PIL import Image

from app_core import render_base_theme


def main() -> None:
    st.set_page_config(
        page_title="CSIS",
        page_icon="H",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    render_base_theme()
    image = Image.open("cesi.png").resize((1000, 600))

    left_col, right_col = st.columns([1.65, 1.0], gap="large")
    with left_col:
        st.image(image)

    with right_col:
        st.markdown(
            """
            <div style="
                margin-top: 2rem;
                padding: 1.15rem 1.25rem;
                border-radius: 14px;
                border: 1px solid #c8dcfa;
                background: #ffffff;
                color: #113d70;
                font-size: 1.08rem;
                line-height: 1.65;
                box-shadow: 0 10px 24px rgba(21, 72, 135, 0.08);
            ">
                Our platform uses machine learning to predict potential criminal risk early,
                helping teams make smarter and safer prevention decisions.
            </div>
            """,
            unsafe_allow_html=True,
        )


if __name__ == "__main__":
    main()
