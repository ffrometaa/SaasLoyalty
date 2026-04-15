'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function FeedbackError({ error, reset }: ErrorProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-red-400 text-sm font-medium">Failed to load feedback submissions.</p>
      <p className="text-slate-500 text-xs max-w-sm text-center">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-brand-purple hover:bg-brand-purple-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
