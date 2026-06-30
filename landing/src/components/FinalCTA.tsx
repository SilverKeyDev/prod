'use client'

import { useEffect, useRef, useState } from 'react'

function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function trackCTA(section: string) {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('cta_clicked', { location: section })
  }
}

export default function FinalCTA() {
  const { ref, inView } = useInView()

  return (
    <section
      id="final-cta"
      style={{
        background: 'var(--bg2)',
        padding: '88px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '2px solid var(--gold)',
      }}
    >
      {/* radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 600px 400px at 50% 0%, rgba(196,165,82,.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        ref={ref}
        className="center-col"
        style={{
          position: 'relative',
          zIndex: 1,
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'scale(.94)',
          transition: 'opacity .55s ease, transform .55s ease',
        }}
      >
        <h2
          style={{
            fontFamily: 'Georgia,serif',
            fontSize: 'clamp(28px,4vw,46px)',
            color: 'var(--ink)',
            lineHeight: 1.1,
            marginBottom: 14,
            letterSpacing: '-.015em',
          }}
        >
          Turn transaction data into <em style={{ fontStyle: 'italic', color: '#3D1403' }}>agent growth.</em>
        </h2>

        <p style={{ fontSize: 15, color: 'var(--ink2)', marginBottom: 30 }}>
          Give your team the coaching and support they need to close more deals.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="https://cal.com/silverkey/demo"
            className="btn btn-lg"
            onClick={() => trackCTA('final-cta')}
            style={{
              background: 'var(--gold)',
              color: '#fff',
              transition: 'all .18s',
            }}
          >
            Book a demo →
          </a>
          <a
            href="sms:+14045550000"
            className="btn btn-lg"
            style={{
              background: 'transparent',
              color: 'var(--ink2)',
              border: '1.5px solid rgba(24,24,27,.14)',
              transition: 'all .18s',
            }}
          >
            Text or call us
          </a>
        </div>

        <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 18 }}>
          Responds in under 5 minutes · Atlanta, GA · No pressure, no pitch deck
        </p>
      </div>
    </section>
  )
}
