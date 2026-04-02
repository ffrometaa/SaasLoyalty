export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          LoyaltyOS
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          SaaS White-Label Loyalty Platform for Local Businesses
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <a
            href="/login"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Sign in
          </a>
          <a
            href="/register"
            className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Get started
          </a>
        </div>
      </div>
    </main>
  );
}
