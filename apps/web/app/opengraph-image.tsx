import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LoyaltyOS — Loyalty Platform for Local Businesses';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(124,58,237,0.2)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: '8px',
            padding: '6px 16px',
            marginBottom: '32px',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Loyalty Platform for Local Businesses
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '24px',
            letterSpacing: '-0.02em',
          }}
        >
          LoyaltyOS
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            maxWidth: '760px',
            lineHeight: 1.4,
            marginBottom: '48px',
          }}
        >
          Turn Every Visit Into a Reason to Come Back
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: '#7c3aed',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: 20,
              fontWeight: 700,
              color: 'white',
            }}
          >
            Start Free Trial
          </div>
          <div
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            14-day free trial · No credit card required
          </div>
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            fontSize: 16,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.05em',
          }}
        >
          loyalbase.dev
        </div>
      </div>
    ),
    { ...size },
  );
}
