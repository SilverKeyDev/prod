'use client'

import { useEffect, useRef, useState } from 'react'
import ConstellationCanvas from './ConstellationCanvas'

function fmt(n: number): string {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K'
  return '$' + Math.round(n)
}

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

export default function SavingsCalculator() {
  const [agents, setAgents] = useState(35)
  const [gci, setGci] = useState(85000)
  const [growth, setGrowth] = useState(30)

  const { ref: sectionRef, inView } = useInView()

  const growthAgents = Math.round(agents * growth / 100)
  const uplift = Math.round(gci * 0.15 / 500) * 500
  const total = growthAgents * uplift

  function trackSlider(id: string, value: number) {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('roi_slider_used', { slider: id, value })
    }
  }

  return (
    <section id="savings" style={{ padding: '88px 24px', background: 'var(--bg2)', position: 'relative', overflow: 'hidden' }}>
      <ConstellationCanvas
        count={30}
        speed={0.10}
        connectDist={110}
        dotColor="140,135,90"
        lineOpacity={0.10}
        style={{ zIndex: 0, opacity: 0.3 }}
      />

      <div
        style={{
          position: 'relative', zIndex: 1,
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'translateY(30px)',
          transition: 'opacity .6s ease, transform .6s ease',
        }}
      >
        <div className="center-col" style={{ textAlign: 'center' }}>
          <span className="eyebrow">Growth calculator</span>
          <h2 className="h2">See what better coaching unlocks for your brokerage.</h2>
        </div>
      </div>

      <div
        ref={sectionRef}
        className="savings-wrap"
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 880, margin: '40px auto 0',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 2, borderRadius: 14, overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid rgba(61,20,3,.18)',
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'scale(.94)',
          transition: 'opacity .55s ease .16s, transform .55s ease .16s',
        }}
      >
        {/* Left: sliders */}
        <div style={{ background: 'var(--surface)', padding: '36px 32px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 24 }}>Tell us about your brokerage</div>

          {[
            { label: 'Agents on roster', display: String(agents), id: 'sl-agents', min: 5, max: 200, step: 1, value: agents, onChange: (v: number) => { setAgents(v); trackSlider('sl-agents', v) } },
            { label: 'Avg. GCI per agent / yr', display: '$' + gci.toLocaleString(), id: 'sl-gci', min: 30000, max: 300000, step: 5000, value: gci, onChange: (v: number) => { setGci(v); trackSlider('sl-gci', v) } },
            { label: 'Agents with untapped growth potential', display: growth + '%', id: 'sl-growth', min: 5, max: 60, step: 1, value: growth, onChange: (v: number) => { setGrowth(v); trackSlider('sl-growth', v) } },
          ].map(s => (
            <div key={s.id} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink2)', marginBottom: 8 }}>
                <span>{s.label}</span>
                <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{s.display}</strong>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={s.value}
                onChange={e => s.onChange(Number(e.target.value))}
              />
            </div>
          ))}
        </div>

        {/* Right: results */}
        <div style={{ background: 'var(--olive-lt)', borderLeft: '2px solid var(--gold)', padding: '36px 32px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>
            Additional GCI opportunity
          </div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 52, color: 'var(--gold-dk)', lineHeight: 1, marginBottom: 4 }}>
            {fmt(total)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 24 }}>unlockable with better coaching this year</div>

          <div style={{ borderTop: '1px solid var(--border2)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { k: 'Agents ready to grow', v: `${growthAgents} ${growthAgents === 1 ? 'agent' : 'agents'}` },
              { k: 'Est. GCI uplift per agent', v: `+${fmt(uplift)}` },
              { k: 'Total brokerage upside', v: `${fmt(total)} / yr` },
            ].map(line => (
              <div key={line.k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--ink2)' }}>{line.k}</span>
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{line.v}</span>
              </div>
            ))}
          </div>

          <a
            href="#final-cta"
            style={{
              display: 'block', width: '100%', textAlign: 'center', marginTop: 20,
              background: 'var(--gold)', color: '#fff', fontSize: 13, fontWeight: 500,
              padding: 12, borderRadius: 7, border: 'none', cursor: 'pointer',
              transition: 'background .18s', textDecoration: 'none',
            }}
          >
            See how to get there →
          </a>
        </div>
      </div>
    </section>
  )
}
