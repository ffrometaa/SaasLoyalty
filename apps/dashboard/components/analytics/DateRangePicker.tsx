'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const fmt = (d: Date) => d.toISOString().slice(0, 10);

function getPresets() {
  const today = new Date();
  return [
    {
      label: 'This month',
      from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: fmt(today),
    },
    {
      label: 'Last 30 days',
      from: fmt(new Date(today.getTime() - 29 * 86400000)),
      to: fmt(today),
    },
    {
      label: 'Last 90 days',
      from: fmt(new Date(today.getTime() - 89 * 86400000)),
      to: fmt(today),
    },
  ];
}

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFrom = searchParams.get('from') ?? '';
  const currentTo = searchParams.get('to') ?? '';
  const presets = getPresets();

  return (
    <div className="flex items-center gap-2">
      {presets.map((preset) => {
        const isActive = currentFrom === preset.from && currentTo === preset.to;
        return (
          <button
            key={preset.label}
            onClick={() => router.push(`${pathname}?from=${preset.from}&to=${preset.to}`)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
              isActive
                ? 'border-brand-purple text-brand-purple bg-brand-purple/5'
                : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
