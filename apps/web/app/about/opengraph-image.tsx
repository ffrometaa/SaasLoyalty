import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'About — LoyaltyOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const STATS = [
  { num: '14+', label: 'Businesses using LoyaltyOS' },
  { num: '48h', label: 'Average setup time' },
  { num: '40%', label: 'Avg. customer reactivation rate' },
];

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
        {/* Badge */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(124,58,237,0.2)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: '8px',
            padding: '6px 16px',
            marginBottom: '28px',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Our Mission
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.15,
            maxWidth: '860px',
            marginBottom: '48px',
            letterSpacing: '-0.02em',
          }}
        >
          Built for the businesses that build communities
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {STATS.map((stat) => (
            <div
              key={stat.num}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '24px 32px',
                minWidth: '200px',
              }}
            >
              <div style={{ fontSize: 44, fontWeight: 900, color: '#a78bfa' }}>{stat.num}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: '6px', textAlign: 'center' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: '36px', fontSize: 16, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
          loyalbase.dev/about
        </div>
      </div>
    ),
    { ...size },
  );
}
