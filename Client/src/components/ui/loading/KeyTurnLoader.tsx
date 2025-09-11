export default function KeyTurnLoader({
  message = "Unlocking...",
}: {
  message?: string;
}) {
  const keyframeStyles = `
    @keyframes turnKey {
      0% { transform: rotate(0deg); }
      2% { transform: rotate(3deg); }
      4% { transform: rotate(6deg); }
      6% { transform: rotate(9deg); }
      8% { transform: rotate(12deg); }
      10% { transform: rotate(15deg); }
      12% { transform: rotate(18deg); }
      14% { transform: rotate(21deg); }
      16% { transform: rotate(24deg); }
      18% { transform: rotate(27deg); }
      20% { transform: rotate(30deg); }
      22% { transform: rotate(27deg); }
      24% { transform: rotate(24deg); }
      26% { transform: rotate(21deg); }
      28% { transform: rotate(18deg); }
      30% { transform: rotate(15deg); }
      32% { transform: rotate(12deg); }
      34% { transform: rotate(9deg); }
      36% { transform: rotate(6deg); }
      38% { transform: rotate(3deg); }
      40% { transform: rotate(0deg); }
      42% { transform: rotate(-3deg); }
      44% { transform: rotate(-6deg); }
      46% { transform: rotate(-9deg); }
      48% { transform: rotate(-12deg); }
      50% { transform: rotate(-15deg); }
      52% { transform: rotate(-18deg); }
      54% { transform: rotate(-21deg); }
      56% { transform: rotate(-24deg); }
      58% { transform: rotate(-27deg); }
      60% { transform: rotate(-30deg); }
      62% { transform: rotate(-27deg); }
      64% { transform: rotate(-24deg); }
      66% { transform: rotate(-21deg); }
      68% { transform: rotate(-18deg); }
      70% { transform: rotate(-15deg); }
      72% { transform: rotate(-12deg); }
      74% { transform: rotate(-9deg); }
      76% { transform: rotate(-6deg); }
      78% { transform: rotate(-3deg); }
      80% { transform: rotate(0deg); }
      82% { transform: rotate(3deg); }
      84% { transform: rotate(6deg); }
      86% { transform: rotate(9deg); }
      88% { transform: rotate(12deg); }
      90% { transform: rotate(15deg); }
      92% { transform: rotate(12deg); }
      94% { transform: rotate(9deg); }
      96% { transform: rotate(6deg); }
      98% { transform: rotate(3deg); }
      100% { transform: rotate(0deg); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes shimmer {
      0% { filter: brightness(1) saturate(1); }
      50% { filter: brightness(1.1) saturate(1.2); }
      100% { filter: brightness(1) saturate(1); }
    }
  `;

  const containerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "15px",
    animation: "fadeIn 0.5s ease-in-out",
  };

  const keyStyle: React.CSSProperties = {
    animation:
      "turnKey 3.6s infinite cubic-bezier(0.25, 0.1, 0.25, 1), shimmer 4s infinite ease-in-out",
    transformOrigin: "20px 32px", // pivot at center of key head
    willChange: "transform, filter",
  };

  const textStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "#F5F5F0", // Match the key color
    fontFamily: "inherit",
    opacity: 0.95,
    whiteSpace: "nowrap",
  };

  return (
    <>
      <style>{keyframeStyles}</style>
      <div style={containerStyle}>
        <svg
          style={keyStyle}
          width="32"
          height="32"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Key head */}
          <circle
            cx="20"
            cy="32"
            r="8"
            stroke="#F5F5F0"
            strokeWidth="4"
            fill="#F8F8F5"
          />
          {/* Shaft */}
          <rect x="28" y="30" width="24" height="4" fill="#F5F5F0" rx="2" />
          {/* Teeth */}
          <rect x="52" y="30" width="4" height="8" fill="#F5F5F0" rx="1" />
          <rect x="56" y="30" width="4" height="6" fill="#F5F5F0" rx="1" />
        </svg>
        <span style={textStyle}>{message}</span>
      </div>
    </>
  );
}
