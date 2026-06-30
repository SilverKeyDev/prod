'use client'

import { useEffect, useState } from 'react'

export default function StickyBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      const hero = document.getElementById('hero')
      const threshold = hero ? hero.offsetHeight * 0.5 : 400
      setVisible(window.scrollY > threshold)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      id="sticky-bar"
      className={visible ? 'up' : ''}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 150,
        background: 'rgba(240,237,230,.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(24,24,27,.14)',
        padding: '10px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <span
        className="sticky-txt"
        style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink2)' }}
      >
        Empower every agent with smarter insights.
      </span>
      <div style={{ display: 'flex', gap: 10 }}>
        <a
          href="#final-cta"
          className="btn"
          style={{
            background: 'var(--bg)',
            color: 'var(--gold)',
            border: '1.5px solid var(--gold)',
            padding: '9px 18px',
            fontSize: 13,
            transition: 'all .18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--gold)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--bg)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--gold)' }}
        >
          Book a demo
        </a>
        <a
          href="sms:+14045550000"
          className="btn"
          style={{
            background: 'transparent',
            color: 'var(--ink2)',
            border: '1.5px solid rgba(24,24,27,.14)',
            padding: '9px 18px',
            fontSize: 13,
            transition: 'all .18s',
          }}
        >
          Text us
        </a>
      </div>
    </div>
  )
}
