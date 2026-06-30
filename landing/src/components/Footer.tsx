import Image from 'next/image'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--surface2)', borderTop: '1px solid rgba(24,24,27,.14)', padding: '40px 40px 28px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Image
              src="/assets/minilogo.png"
              alt="SilverKey"
              width={28}
              height={28}
              style={{ objectFit: 'contain', flexShrink: 0 }}
            />
            <span style={{ fontFamily: 'Georgia,serif', color: '#3D1403', fontWeight: 700, fontSize: 15 }}>SilverKey</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Atlanta, Georgia</div>
        </div>

        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--ink3)' }}>
          <a href="/contact">Contact</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { href: 'https://linkedin.com/company/silverkey', label: 'LinkedIn', text: 'in' },
            { href: 'https://twitter.com/usesilverkey', label: 'X / Twitter', text: '𝕏' },
            { href: 'https://instagram.com/usesilverkey', label: 'Instagram', text: '◎' },
          ].map(s => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              style={{
                width: 32, height: 32, borderRadius: 7, border: '1px solid rgba(24,24,27,.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: 'var(--ink3)', transition: 'all .15s',
              }}
            >
              {s.text}
            </a>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '20px auto 0', paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink3)' }}>
        © 2026 SilverKey. All rights reserved. Platform fees are charged for marketplace placement and data services, not for referrals.
      </div>
    </footer>
  )
}
