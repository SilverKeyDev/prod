import { useEffect, useRef } from "react";
import "./KeyTurnLoader.css";

export default function KeyTurnLoader({ message = "Unlocking..." }: { message?: string }) {
  return (
    <div className="key-loader-container">
      <svg
        className="key"
        width="16"
        height="16"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Key head */}
        <circle cx="20" cy="32" r="8" stroke="#6C584C" strokeWidth="4" fill="#D8CAB8" />
        {/* Shaft */}
        <rect x="28" y="30" width="24" height="4" fill="#6C584C" rx="2" />
        {/* Teeth */}
        <rect x="52" y="30" width="4" height="8" fill="#6C584C" rx="1" />
        <rect x="56" y="30" width="4" height="6" fill="#6C584C" rx="1" />
      </svg>
      <span className="key-loader-text">{message}</span>
    </div>
  );
}
