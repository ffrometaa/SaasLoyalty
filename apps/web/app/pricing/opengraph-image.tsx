import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Pricing — LoyaltyOS';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PLANS = [
  { name: 'Starter', price: '$199', color: 'rgba(255,255,255,0.1)' },
  { name: 'Pro', price: '$399', color: 'rgba(124,58,237,0.4)', highlight: true },
  { name: 'Scale', price: '$599', color: 'rgba(255,255,255,0.1)' },
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
            Simple pricing, serious results
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 60, fontWeight: 900, color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          LoyaltyOS Pricing
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.45)', marginBottom: '52px' }}>
          Start free for 14 days. Cancel anytime.
        </div>

        {/* Plans */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: plan.color,
                border: plan.highlight ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '28px 36px',
                minWidth: '220px',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: plan.highlight ? '#a78bfa' : 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, color: 'white' }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>/month</div>
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: '36px', fontSize: 16, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
          loyalbase.dev/pricing
        </div>
      </div>
    ),
    { ...size },
  );
}
