import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="px-6 py-16"
      style={{
        background: '#080810',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Col 1 */}
          <div>
            <div className="font-display font-black text-2xl gradient-text mb-3">LoyaltyOS</div>
            <p className="text-white/40 text-sm leading-relaxed mb-4">
              Turn every visit into a reason to come back.
            </p>
            <p className="text-white/25 text-xs">© 2026 LoyaltyOS, LLC. West Palm Beach, FL</p>
          </div>

          {/* Col 2 */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mb-5">
              Product
            </div>
            <nav className="flex flex-col gap-3">
              {[
                { href: '/', label: 'Home' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
                { href: '/login', label: 'Sign In' },
                { href: '/register', label: 'Start Free Trial' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/45 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Col 3 */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase mb-5">
              Legal
            </div>
            <nav className="flex flex-col gap-3 mb-6">
              <Link href="/terms" className="text-sm text-white/45 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-white/45 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </nav>
            <div className="space-y-2">
              <a
                href="mailto:legal@loyaltyos.com"
                className="block text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                legal@loyaltyos.com
              </a>
              <a
                href="mailto:support@loyaltyos.com"
                className="block text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                support@loyaltyos.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
