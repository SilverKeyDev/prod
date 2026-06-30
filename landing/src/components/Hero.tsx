'use client'

import { useEffect, useState } from 'react'
import ConstellationCanvas from './ConstellationCanvas'

const WORDS = ['Empower', 'every', 'agent', 'with', 'smarter', 'transaction', 'insights.']
const ITALIC_INDEX = 4 // "smarter"

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <section
      id="hero"
      style={{
        padding: '118px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        background: 'var(--bg)',
      }}
    >
      <ConstellationCanvas
        count={60}
        speed={0.22}
        connectDist={140}
        dotColor="180,155,100"
        lineOpacity={0.15}
        style={{ zIndex: 0 }}
      />

      <div className="center-col" style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'rgba(255,255,255,.55)',
            border: '1px solid rgba(24,24,27,.14)',
            borderRadius: 20,
            padding: '4px 14px 4px 10px',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--ink2)',
            marginBottom: 24,
            backdropFilter: 'blur(6px)',
          }}
        >
          <span className="badge-dot" />
          SkySlope integration · Live insights
        </div>

        <h1 className="h1" style={{ color: 'var(--ink)' }}>
          {WORDS.map((word, i) => (
            <span key={i}>
              <span
                style={{
                  display: 'inline-block',
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'none' : 'translateY(14px)',
                  transition: `opacity .5s ease ${180 + i * 60}ms, transform .5s ease ${180 + i * 60}ms`,
                  ...(i === ITALIC_INDEX ? { fontStyle: 'italic', color: '#B5974A' } : {}),
                }}
              >
                {word}
              </span>
              {i < WORDS.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h1>

        <p
          className="lead"
          style={{ color: 'var(--ink2)', maxWidth: 520, margin: '0 auto' }}
        >
          SilverKey helps brokerages transform SkySlope transaction data into coaching,
          support, and growth opportunities — so every agent performs at their best.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: 28,
          }}
        >
          <a href="#final-cta" className="btn btn-hero-demo btn-lg">
            Book a demo →
          </a>
          <a href="#info" className="btn btn-ghost btn-lg">
            See how it works
          </a>
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 12 }}>
          No commitment required · Setup in under a week
        </p>
      </div>
    </section>
  )
}
