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

const STARTER_FEATURES = [
  'Full roster overview',
  'Coaching opportunity signals',
  'SkySlope integration',
  'Monthly reporting',
]

const GROWTH_FEATURES = [
  'Everything in Starter',
  'Agent growth & retention signals',
  'Transaction bottleneck analysis',
  'Priority support',
  'Onboarding & coaching playbooks',
]

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const { ref, inView } = useInView()

  const priceNote = billing === 'annual' ? 'Custom (annual · 20% off)' : 'Custom'

  return (
    <section id="pricing" style={{ padding: '88px 24px', background: 'var(--surface)' }}>
      <div
        ref={ref}
        className="center-col"
        style={{
          textAlign: 'center', marginBottom: 0,
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'translateY(30px)',
          transition: 'opacity .6s ease, transform .6s ease',
        }}
      >
        <span className="eyebrow">Pricing</span>
        <h2 className="h2">
          Simple, <em>honest</em> pricing.
        </h2>
        <p className="lead" style={{ margin: '0 auto 28px', maxWidth: 420 }}>
          One monthly price per brokerage, scaled to roster size. The number lives in the walkthrough — because it belongs in a conversation.
        </p>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--bg2)', borderRadius: 10, padding: 4, maxWidth: 280, margin: '0 auto 40px' }}>
        {(['monthly', 'annual'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setBilling(mode)}
            style={{
              flex: 1, padding: 8, borderRadius: 7, fontSize: 13, fontWeight: 500, border: 'none',
              cursor: 'pointer', transition: 'all .15s',
              background: billing === mode ? 'var(--surface)' : 'transparent',
              color: billing === mode ? 'var(--ink)' : 'var(--ink2)',
              boxShadow: billing === mode ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {mode === 'monthly' ? 'Monthly' : 'Annual · save 20%'}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div
        className="pricing-cards wide-col"
        style={{ maxWidth: 880, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
      >
        {/* Starter */}
        <div
          style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px',
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateX(-36px)',
            transition: 'opacity .6s ease .1s, transform .6s ease .1s, box-shadow .2s',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 10 }}>Starter</div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 38, lineHeight: 1, marginBottom: 3 }}>{priceNote}</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 20 }}>per brokerage · up to 25 agents</div>
          <ul style={{ listStyle: 'none', borderTop: '1px solid var(--border)' }}>
            {STARTER_FEATURES.map(f => (
              <li key={f} style={{ fontSize: 13, color: 'var(--ink2)', padding: '9px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 9, alignItems: 'center' }}>
                <span style={{ color: '#3D1403', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => { location.href = '#final-cta' }}
            style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 20, padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: 'var(--ink)', color: '#fff', transition: 'all .18s' }}
          >
            Get started →
          </button>
          <div style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'center', marginTop: 14 }}>Exact pricing in the walkthrough</div>
        </div>

        {/* Growth (featured) */}
        <div
          style={{
            background: 'var(--olive-lt)', border: '2px solid var(--gold)', borderRadius: 14, padding: '28px 24px', position: 'relative',
            opacity: inView ? 1 : 0,
            transform: inView ? 'none' : 'translateX(36px)',
            transition: 'opacity .6s ease .18s, transform .6s ease .18s, box-shadow .2s',
          }}
        >
          <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 12, background: 'var(--gold-lt)', color: 'var(--gold-dk)' }}>Most popular</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 10 }}>Growth</div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 38, lineHeight: 1, marginBottom: 3, color: 'var(--ink)' }}>{priceNote}</div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 20 }}>per brokerage · unlimited agents</div>
          <ul style={{ listStyle: 'none', borderTop: '1px solid var(--border)' }}>
            {GROWTH_FEATURES.map(f => (
              <li key={f} style={{ fontSize: 13, color: 'var(--ink2)', padding: '9px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 9, alignItems: 'center' }}>
                <span style={{ color: '#3D1403', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => { location.href = '#final-cta' }}
            style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 20, padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: 'var(--gold)', color: '#fff', transition: 'all .18s' }}
          >
            Book a demo →
          </button>
          <div style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'center', marginTop: 14 }}>Exact pricing in the walkthrough</div>
        </div>
      </div>
    </section>
  )
}
