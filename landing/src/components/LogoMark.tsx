export default function LogoMark({ size = 40 }: { size?: number }) {
  const scale = size / 40
  return (
    <svg
      width={size}
      height={Math.round(46 * scale)}
      viewBox="0 0 100 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <g stroke="#3D1403" strokeLinecap="round" strokeLinejoin="round">
        <path
          strokeWidth="2.8"
          d="M50,3 C62,3 74,8 82,18 C90,27 94,38 93,50 C93,63 88,74 80,82 C72,90 62,95 52,96 L50,97 C38,97 27,92 20,83 C13,74 10,63 10,50 C10,38 14,26 22,17 C30,8 40,3 50,3 Z"
        />
        <line x1="10" y1="50" x2="-12" y2="50" strokeWidth="3" />
        <line x1="-5" y1="50" x2="-5" y2="62" strokeWidth="3" />
        <line x1="-15" y1="50" x2="-15" y2="57" strokeWidth="3" />
        <path
          strokeWidth="2"
          fill="none"
          d="M40,28 C40,28 50,22 56,30 C62,38 55,48 50,52 C45,56 38,62 42,70 C46,78 56,74 58,68"
        />
        <line x1="50" y1="3"  x2="34" y2="22" strokeWidth="1.4" />
        <line x1="50" y1="3"  x2="50" y2="22" strokeWidth="1.4" />
        <line x1="50" y1="3"  x2="66" y2="18" strokeWidth="1.4" />
        <line x1="66" y1="18" x2="82" y2="18" strokeWidth="1.4" />
        <line x1="34" y1="22" x2="50" y2="22" strokeWidth="1.4" />
        <line x1="50" y1="22" x2="66" y2="18" strokeWidth="1.4" />
        <line x1="10" y1="36" x2="34" y2="22" strokeWidth="1.4" />
        <line x1="10" y1="36" x2="28" y2="42" strokeWidth="1.4" />
        <line x1="34" y1="22" x2="28" y2="42" strokeWidth="1.4" />
        <line x1="82" y1="18" x2="93" y2="36" strokeWidth="1.4" />
        <line x1="66" y1="18" x2="75" y2="38" strokeWidth="1.4" />
        <line x1="93" y1="36" x2="75" y2="38" strokeWidth="1.4" />
        <line x1="28" y1="42" x2="40" y2="28" strokeWidth="1.4" />
        <line x1="75" y1="38" x2="58" y2="28" strokeWidth="1.4" />
        <line x1="10" y1="50" x2="28" y2="42" strokeWidth="1.4" />
        <line x1="93" y1="50" x2="75" y2="38" strokeWidth="1.4" />
        <line x1="10" y1="64" x2="28" y2="58" strokeWidth="1.4" />
        <line x1="93" y1="64" x2="75" y2="62" strokeWidth="1.4" />
        <line x1="28" y1="58" x2="42" y2="70" strokeWidth="1.4" />
        <line x1="75" y1="62" x2="62" y2="72" strokeWidth="1.4" />
        <line x1="28" y1="58" x2="75" y2="62" strokeWidth="1.4" />
        <line x1="42" y1="70" x2="34" y2="82" strokeWidth="1.4" />
        <line x1="62" y1="72" x2="68" y2="82" strokeWidth="1.4" />
        <line x1="34" y1="82" x2="50" y2="90" strokeWidth="1.4" />
        <line x1="68" y1="82" x2="50" y2="90" strokeWidth="1.4" />
        <line x1="50" y1="90" x2="50" y2="97" strokeWidth="1.4" />
        <line x1="10" y1="64" x2="34" y2="82" strokeWidth="1.4" />
        <line x1="93" y1="64" x2="68" y2="82" strokeWidth="1.4" />
      </g>
    </svg>
  )
}
