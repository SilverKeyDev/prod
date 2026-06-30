'use client'

import { useEffect, useRef, useState } from 'react'

const TREND_VALS = [34, 41, 38, 52, 47, 58]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const MAX_VAL = Math.max(...TREND_VALS)

export default function DemoPreview() {
  const [shown, setShown] = useState({ dc1: false, dc2: false, dc3: false, dc4: false, dw1: false, dw2: false })

  useEffect(() => {
    const ids: (keyof typeof shown)[] = ['dc1', 'dc2', 'dc3', 'dc4']
    ids.forEach((id, i) =>
      setTimeout(() => setShown(s => ({ ...s, [id]: true })), 300 + i * 120)
    )
    ;(['dw1', 'dw2'] as const).forEach((id, i) =>
      setTimeout(() => setShown(s => ({ ...s, [id]: true })), 800 + i * 100)
    )
  }, [])

  return (
    <div style={{ background: 'var(--bg)', padding: '0 24px 64px' }}>
      <div
        style={{
          margin: '0 auto',
          maxWidth: 880,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            background: 'var(--surface2)',
            padding: '11px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            borderBottom: '1px solid var(--border)',
          }}
        >
          {['#D4C4A8', '#D4C4A8', '#D4C4A8'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 8, fontWeight: 500 }}>
            SilverKey · Brokerage Overview · Q2 2026
          </span>
        </div>

        {/* Stats row */}
        <div
          className="demo-body-grid"
          style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}
        >
          {[
            { id: 'dc1', lbl: 'Closed this quarter', val: '247', sub: 'transactions' },
            { id: 'dc2', lbl: 'Coaching opportunities', val: '12', sub: 'agents with growth signals' },
            { id: 'dc3', lbl: 'Avg. days to close', val: '28.4', sub: 'days / transaction' },
            { id: 'dc4', lbl: 'Agent retention', val: '94%', sub: '12-month rolling' },
          ].map(card => (
            <div
              key={card.id}
              style={{
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14,
                opacity: shown[card.id as keyof typeof shown] ? 1 : 0,
                transform: shown[card.id as keyof typeof shown] ? 'none' : 'translateY(10px)',
                transition: 'opacity .4s ease, transform .4s ease',
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 8 }}>{card.lbl}</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 24, color: 'var(--ink)', lineHeight: 1, marginBottom: 3 }}>{card.val}</div>
              <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div
          className="demo-row2-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px 20px' }}
        >
          {/* Coaching queue */}
          <div
            style={{
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14,
              opacity: shown.dw1 ? 1 : 0,
              transform: shown.dw1 ? 'none' : 'translateY(10px)',
              transition: 'opacity .4s ease .15s, transform .4s ease .15s',
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 10 }}>
              Growth coaching queue
            </div>
            {[
              { name: 'Marcus T.', opp: 'Volume up 34% — team lead candidate' },
              { name: 'Priya M.', opp: '3 stalled contracts — needs guidance' },
              { name: 'Carlos W.', opp: 'Top performer — ready for recognition' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '7px 9px', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 6, marginBottom: 6, fontSize: 11,
                }}
              >
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div style={{ color: 'var(--ink2)', fontSize: 10 }}>{item.opp}</div>
              </div>
            ))}
          </div>

          {/* Trend bars */}
          <div
            style={{
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14,
              opacity: shown.dw2 ? 1 : 0,
              transform: shown.dw2 ? 'none' : 'translateY(10px)',
              transition: 'opacity .4s ease .25s, transform .4s ease .25s',
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 10 }}>
              Transaction trend · 6 months
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 44 }}>
              {TREND_VALS.map((v, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: Math.round((v / MAX_VAL) * 40),
                    borderRadius: '3px 3px 0 0',
                    background: i === TREND_VALS.length - 1 ? 'var(--blue)' : 'var(--blue-lt)',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              {MONTHS.map(m => (
                <span key={m} style={{ fontSize: 9, color: 'var(--ink3)' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
