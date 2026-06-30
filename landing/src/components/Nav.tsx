'use client'

import Image from 'next/image'

export default function Nav() {
  return (
    <nav
      id="nav"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'rgba(247,246,242,.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(24,24,27,.08)',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Image
            src="/assets/minilogo.png"
            alt="SilverKey"
            width={36}
            height={36}
            style={{ objectFit: 'contain', flexShrink: 0 }}
            priority
          />
          <span
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 17,
              fontWeight: 700,
              color: '#3D1403',
              letterSpacing: '-.01em',
            }}
          >
            SilverKey
          </span>
        </div>

        <div
          className="nav-links"
          style={{ display: 'flex', gap: 26, fontSize: 13, color: 'var(--ink2)' }}
        >
          <a href="#info" style={{ transition: 'color .15s', fontSize: 15, fontWeight: 600 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink2)')}>Platform</a>
          <a href="#savings" style={{ transition: 'color .15s', fontSize: 15, fontWeight: 600 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink2)')}>ROI</a>
          <a href="#pricing" style={{ transition: 'color .15s', fontSize: 15, fontWeight: 600 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink2)')}>Pricing</a>
          <a href="#faq" style={{ transition: 'color .15s', fontSize: 15, fontWeight: 600 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink2)')}>FAQ</a>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', padding: '8px 12px', cursor: 'pointer' }}
          >
            Log in
          </span>
          <a
            href="#final-cta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              background: '#5E7A5F',
              color: '#fff',
              border: '1.5px solid #5E7A5F',
              textDecoration: 'none',
            }}
          >
            Book a demo
          </a>
        </div>
      </div>
    </nav>
  )
}
