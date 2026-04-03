export function SocialProofBar() {
  const items = [
    'Spas',
    'Restaurants',
    'Gyms',
    'Retail Shops',
    'Wellness Studios',
    'Salons',
    'Hotels',
    'Cafés',
    'Barbershops',
    'Yoga Studios',
  ];

  const content = [...items, ...items]; // duplicate for seamless loop

  return (
    <div
      className="w-full overflow-hidden py-4"
      style={{
        background: '#111118',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: 'marquee 25s linear infinite' }}
      >
        {content.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 mx-4">
            <span className="text-xs font-semibold tracking-widest text-white/40 uppercase">
              {item}
            </span>
            <span className="text-white/20">·</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
