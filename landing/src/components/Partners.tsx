import React from 'react'

/* ── Partner logo components — all designed for a 56px-tall logo slot ── */

function GTVenturesLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 44, height: 44, borderRadius: 8, background: '#1A1A2E',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 700, color: '#C4A552', lineHeight: 1 }}>GT</span>
      </div>
      <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>Ventures</div>
        <div style={{ fontSize: 10, color: '#9E9B92', fontWeight: 500 }}>Early Stage Investor</div>
      </div>
    </div>
  )
}

function SkySlopeLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 40, height: 40, borderRadius: 8, background: '#0066CC',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <polyline points="3,18 10,8 17,13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="17" cy="13" r="2.2" fill="#fff" />
        </svg>
      </div>
      <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 20, fontWeight: 700, color: '#0066CC', letterSpacing: '-.02em' }}>
        Sky<span style={{ fontWeight: 400, color: '#18181B' }}>Slope</span>
      </span>
    </div>
  )
}

function BetterLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 40, height: 40, borderRadius: '50%', background: '#00BA66',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12L10 17L19 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
        <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 22, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-.02em' }}>Better</div>
        <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 500 }}>Mortgage Partner</div>
      </div>
    </div>
  )
}

function MoveConciergeLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 40, height: 40, borderRadius: 8, background: '#E8F7F0',
          border: '1.5px solid #2DA771',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 10L12 3L21 10V20H15V14H9V20H3V10Z" stroke="#2DA771" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
        <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>Move</div>
        <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 15, fontWeight: 700, color: '#2DA771' }}>Concierge</div>
      </div>
    </div>
  )
}

function ExpRealtyLogo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 32, lineHeight: 1, color: '#1A1A1A', letterSpacing: '-.02em' }}>
        <span style={{ fontWeight: 300 }}>e</span>
        <span style={{ fontWeight: 900 }}>X</span>
        <span style={{ fontWeight: 300 }}>p</span>
      </div>
      <div
        style={{
          fontFamily: 'Inter,system-ui,sans-serif', fontSize: 9, fontWeight: 700,
          letterSpacing: '.18em', color: '#5C5A52',
          borderTop: '1px solid #C0BDB8', paddingTop: 4,
          width: '100%', textAlign: 'center',
        }}
      >
        REALTY
      </div>
    </div>
  )
}

function GABrokerLogo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid #3D1403',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: '#3D1403' }}>GA</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#3D1403', letterSpacing: '.06em' }}>Licensed Broker</div>
    </div>
  )
}

const partners = [
  { badge: 'Backer',             sub: "Pre-seed investor backing SilverKey's go-to-market",                    Logo: GTVenturesLogo },
  { badge: 'Integration',        sub: 'Transaction management — the data source powering all roster insights', Logo: SkySlopeLogo },
  { badge: 'MSA Signed',         sub: 'Mortgage partner · $3K + $1,500/user · Activates on launch',           Logo: BetterLogo },
  { badge: 'Agreement Signed',   sub: 'Move management partner · Revenue share · Live integration',           Logo: MoveConciergeLogo },
  { badge: 'Pilot Committed',    sub: 'Top-10 national team · 10 agents committed to live pilot',             Logo: ExpRealtyLogo },
  { badge: 'Founder Credential', sub: 'Built by a licensed Georgia broker — real experience behind every feature', Logo: GABrokerLogo },
]

function PartnerCard({ badge, sub, Logo }: typeof partners[0]) {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '28px 24px 22px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        width: 260,
        flexShrink: 0,
        cursor: 'default',
        transition: 'box-shadow .25s, transform .25s, border-color .25s',
      }}
    >
      {/* Fixed-height logo slot — all logos are centered in 60px */}
      <div
        style={{
          height: 60,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Logo />
      </div>

      <div
        style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.09em', textTransform: 'uppercase',
          color: 'var(--gold-dk)', background: 'var(--gold-lt)', padding: '3px 10px', borderRadius: 20,
        }}
      >
        {badge}
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.6 }}>
        {sub}
      </div>
    </div>
  )
}

export default function Partners() {
  const doubled = [...partners, ...partners]

  return (
    <section id="partners" style={{ background: 'var(--surface)', padding: '52px 0 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 44, padding: '0 24px' }}>
        <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>Backed by &amp; integrated with</span>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(22px,2.5vw,30px)', color: 'var(--ink)', marginBottom: 8 }}>
          The ecosystem powering SilverKey
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink2)' }}>Trusted partners and integrations that make the platform work.</p>
      </div>

      <div style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Fade edges */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 120, height: '100%', zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to right, var(--surface), transparent)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: '100%', zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to left, var(--surface), transparent)' }} />

        <div className="carousel-track" style={{ padding: '8px 0 16px' }}>
          {doubled.map((p, i) => (
            <PartnerCard key={i} {...p} />
          ))}
        </div>
      </div>
    </section>
  )
}
