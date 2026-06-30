'use client'

import React, { useEffect, useRef, useState } from 'react'
import { BarChart2, FileSignature, Heart } from 'lucide-react'
import ConstellationCanvas from './ConstellationCanvas'

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

function useCounter(target: number, suffix: string, active: boolean, delay = 0) {
  const [val, setVal] = useState(`0${suffix}`)

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => {
      const dur = 1200
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setVal(`${Math.round(eased * target)}${suffix}`)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timer)
  }, [active, target, suffix, delay])

  return val
}

interface CardProps {
  icon: React.ReactNode
  iconBg: string
  statTarget: number
  statSuffix: string
  statDelay: number
  title: string
  body: string
  animClass: string
  inView: boolean
}

function InfoCard({ icon, iconBg, statTarget, statSuffix, statDelay, title, body, animClass, inView }: CardProps) {
  const stat = useCounter(statTarget, statSuffix, inView, statDelay)

  return (
    <div
      style={{
        background: 'rgba(234,230,222,.85)',
        border: `1px solid ${inView ? 'rgba(24,24,27,.08)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '24px 20px',
        backdropFilter: 'blur(4px)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : animClass === 'left' ? 'translateX(-36px)' : animClass === 'right' ? 'translateX(36px)' : 'translateY(28px)',
        transition: 'opacity .55s ease, transform .55s ease, border-color .2s, box-shadow .2s',
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, background: iconBg }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: 32, color: '#3D1403', lineHeight: 1, marginBottom: 6 }}>
        {stat}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.65 }}>{body}</div>
    </div>
  )
}

export default function InfoSection() {
  const { ref: gridRef, inView } = useInView(0.2)
  const { ref: headerRef, inView: headerIn } = useInView(0.15)

  const cards = [
    {
      icon: <BarChart2 size={20} color="#3B6FE0" strokeWidth={1.8} />,
      iconBg: 'var(--blue-lt)',
      statTarget: 12,
      statSuffix: '',
      statDelay: 200,
      title: 'Coaching opportunities surfaced',
      body: 'SilverKey reads deal velocity, pipeline depth, and closing trends to show you exactly which agents would benefit from a conversation this week.',
      animClass: 'left',
    },
    {
      icon: <Heart size={20} color="#2DA771" strokeWidth={1.8} />,
      iconBg: 'var(--green-lt)',
      statTarget: 23,
      statSuffix: '%',
      statDelay: 300,
      title: 'Average retention improvement',
      body: 'Brokerages using SilverKey identify growth signals early — and act on them before agents start looking elsewhere. Retention follows naturally.',
      animClass: 'up',
    },
    {
      icon: <FileSignature size={20} color="#D4893A" strokeWidth={1.8} />,
      iconBg: 'var(--amber-lt)',
      statTarget: 3,
      statSuffix: 'd',
      statDelay: 400,
      title: 'Faster average time to close',
      body: 'Spotting bottlenecks across your transaction portfolio helps leadership address recurring sticking points — improving pace for the whole brokerage.',
      animClass: 'right',
    },
  ]

  return (
    <section id="info" style={{ padding: '88px 24px', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <ConstellationCanvas
        count={35}
        speed={0.12}
        connectDist={120}
        dotColor="160,155,100"
        lineOpacity={0.12}
        style={{ zIndex: 0, opacity: 0.45 }}
      />

      <div
        ref={headerRef}
        className="center-col"
        style={{
          position: 'relative',
          zIndex: 1,
          opacity: headerIn ? 1 : 0,
          transform: headerIn ? 'none' : 'translateY(30px)',
          transition: 'opacity .6s ease, transform .6s ease',
        }}
      >
        <span className="eyebrow">The platform</span>
        <h2 className="h2" style={{ textAlign: 'center' }}>
          Data that <em>coaches.</em> Insights that stick.
        </h2>
        <p className="lead" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          SilverKey analyzes your SkySlope transaction data continuously — surfacing what matters before it becomes a problem.
        </p>
      </div>

      <div
        ref={gridRef}
        className="info-grid"
        style={{
          maxWidth: 880,
          margin: '40px auto 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 14,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {cards.map((c, i) => (
          <InfoCard key={i} {...c} inView={inView} />
        ))}
      </div>
    </section>
  )
}
