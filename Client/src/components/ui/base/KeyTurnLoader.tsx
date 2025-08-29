export default function KeyTurnLoader({
  message = "Unlocking...",
}: {
  message?: string;
}) {
  const keyframeStyles = `
    @keyframes turnKey {
      0% { transform: rotate(0deg); }
      25% { transform: rotate(20deg); }
      50% { transform: rotate(0deg); }
      75% { transform: rotate(-20deg); }
      100% { transform: rotate(0deg); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `;

  const containerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "15px",
    animation: "fadeIn 0.5s ease-in-out",
  };

  const keyStyle: React.CSSProperties = {
    animation: 'turnKey 1.6s infinite ease-in-out',
    transformOrigin: '20px 32px', // pivot at center of key head
  };

  const textStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6C584C',
    fontFamily: 'inherit',
    opacity: 0.9,
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <style>{keyframeStyles}</style>
      <div style={containerStyle}>
        <svg
          style={keyStyle}
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
        <span style={textStyle}>{message}</span>
      </div>
    </>
  );
}
