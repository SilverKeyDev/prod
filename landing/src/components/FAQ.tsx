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

const FAQS = [
  {
    q: 'Where does the data come from?',
    a: 'Your own transactions. SilverKey connects to SkySlope through authorized brokerage credentials and reads deal data you already generate. Nothing external, nothing your agents need to do.',
  },
  {
    q: 'Do my agents have to do anything?',
    a: 'No. No new login, no migration, no new tool. Agents keep working exactly as they do now. The insights come from transactions they\'re already closing in SkySlope.',
  },
  {
    q: 'Is this surveillance?',
    a: "No. SilverKey reads brokerage-level production and pipeline — the same numbers you already own. It's not activity monitoring. It's the roster health read you've always wanted, built to help your agents succeed.",
  },
  {
    q: 'Who can see the insights?',
    a: 'Your brokerage leadership only. Roster insights stay inside your shop. We never share, aggregate, or sell agent data across brokerages.',
  },
  {
    q: "We're not on SkySlope. Can we still use this?",
    a: "SkySlope is our first integration. More transaction systems are coming. Get on the list and you'll hear from us when yours is ready.",
  },
  {
    q: 'How long does setup take?',
    a: "The walkthrough is 15 minutes. If it's a fit, onboarding is one connection — no migration, no IT project. Most brokerages are live within a week.",
  },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const { ref, inView } = useInView(0.1)

  return (
    <section id="faq" style={{ padding: '88px 24px', background: 'var(--bg)' }}>
      <div
        style={{
          textAlign: 'center',
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'translateY(30px)',
          transition: 'opacity .6s ease, transform .6s ease',
        }}
      >
        <div className="center-col">
          <span className="eyebrow">FAQ</span>
          <h2 className="h2">Questions brokers actually ask.</h2>
        </div>
      </div>

      <div
        ref={ref}
        style={{ maxWidth: 680, margin: '36px auto 0' }}
      >
        {FAQS.map((item, i) => {
          const isOpen = openIdx === i
          const delay = Math.min(i, 4) * 0.08

          return (
            <div
              key={i}
              style={{
                borderBottom: '1px solid var(--border)',
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateY(30px)',
                transition: `opacity .6s ease ${delay}s, transform .6s ease ${delay}s`,
              }}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '18px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--ink)',
                  textAlign: 'left',
                  gap: 16,
                }}
              >
                <span>{item.q}</span>
                <span
                  style={{
                    color: '#3D1403',
                    fontSize: 20,
                    transition: 'transform .2s',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: '0 0 18px',
                    fontSize: 13,
                    color: 'var(--ink2)',
                    lineHeight: 1.7,
                  }}
                >
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
