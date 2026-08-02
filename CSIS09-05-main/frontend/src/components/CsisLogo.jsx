import React from "react";

export default function CsisLogo({ size = 38 }) {
  const viewBoxSize = 120;
  const scale = size / 40;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="55" fill="white" stroke="#1a3a5c" strokeWidth="3" />

      {/* Shield with Tunisia silhouette */}
      <g transform="translate(20, 28)">
        <path
          d="M20 0L10 6V25C10 35 20 42 20 42C20 42 30 35 30 25V6L20 0Z"
          fill="#0066cc"
          stroke="#003d99"
          strokeWidth="1.5"
        />
        <path d="M18 8C18 8 15 15 18 22C20 15 22 8 22 8" fill="#0088ff" opacity="0.7" />
      </g>

      {/* Open Book */}
      <g transform="translate(35, 32)">
        <path
          d="M8 2V20C8 20 8 22 6 22H2V2H8Z"
          fill="#0066cc"
          stroke="#003d99"
          strokeWidth="1.5"
        />
        <path
          d="M8 2V20C8 20 8 22 10 22H14V2H8Z"
          fill="#0088ff"
          stroke="#003d99"
          strokeWidth="1.5"
        />
        <line x1="8" y1="2" x2="8" y2="22" stroke="#003d99" strokeWidth="1" />
        <line x1="2" y1="6" x2="6" y2="6" stroke="#0088ff" strokeWidth="0.8" />
        <line x1="2" y1="10" x2="6" y2="10" stroke="#0088ff" strokeWidth="0.8" />
        <line x1="2" y1="14" x2="6" y2="14" stroke="#0088ff" strokeWidth="0.8" />
        <line x1="10" y1="6" x2="14" y2="6" stroke="#0066cc" strokeWidth="0.8" />
        <line x1="10" y1="10" x2="14" y2="10" stroke="#0066cc" strokeWidth="0.8" />
        <line x1="10" y1="14" x2="14" y2="14" stroke="#0066cc" strokeWidth="0.8" />
      </g>

      {/* AI Brain with circuits */}
      <g transform="translate(50, 20)">
        <circle cx="8" cy="8" r="6" fill="none" stroke="#0088ff" strokeWidth="1.2" />
        <circle cx="8" cy="8" r="3" fill="#0088ff" />
        {/* Circuit lines */}
        <line x1="8" y1="2" x2="8" y2="0" stroke="#0088ff" strokeWidth="0.8" />
        <line x1="14" y1="8" x2="16" y2="8" stroke="#0088ff" strokeWidth="0.8" />
        <line x1="8" y1="14" x2="8" y2="16" stroke="#0088ff" strokeWidth="0.8" />
        <line x1="2" y1="8" x2="0" y2="8" stroke="#0088ff" strokeWidth="0.8" />
        <circle cx="8" cy="2" r="0.6" fill="#0088ff" />
        <circle cx="14" cy="8" r="0.6" fill="#0088ff" />
        <circle cx="8" cy="14" r="0.6" fill="#0088ff" />
        <circle cx="2" cy="8" r="0.6" fill="#0088ff" />
      </g>
    </svg>
  );
}
