import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              Super Admin
            </span>
            <nav className="flex items-center gap-6">
              <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Overview
              </Link>
              <Link href="/admin/tenants" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Tenants
              </Link>
            </nav>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
