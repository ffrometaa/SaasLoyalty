'use client';

import { useState } from 'react';
import { MessageSquare, Check } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'general';

const TYPES: { value: FeedbackType; label: string; desc: string }[] = [
  { value: 'bug', label: 'Bug Report', desc: 'Something is not working as expected' },
  { value: 'feature', label: 'Feature Request', desc: 'An idea or improvement you would like to see' },
  { value: 'general', label: 'General Feedback', desc: 'Anything else on your mind' },
];

export function FeedbackTab() {
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setMessage('');
    } catch {
      setError('Failed to send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Thank you!</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Your feedback has been received. We review all submissions and use them to improve LoyaltyOS.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-2 text-sm text-brand-purple hover:underline"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-purple-100 rounded-lg">
          <MessageSquare className="h-5 w-5 text-brand-purple" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Send Feedback</h2>
          <p className="text-sm text-gray-500">Help us improve LoyaltyOS — your input goes directly to our team.</p>
        </div>
      </div>

      {/* Type selector */}
      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        {TYPES.map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => setType(value)}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              type === value
                ? 'border-brand-purple bg-brand-purple-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <p className={`text-sm font-semibold mb-0.5 ${type === value ? 'text-brand-purple' : 'text-gray-800'}`}>
              {label}
            </p>
            <p className="text-xs text-gray-500 leading-tight">{desc}</p>
          </button>
        ))}
      </div>

      {/* Message */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Your message <span className="text-red-500">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your feedback in detail…"
          rows={5}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{message.length}/2000 characters</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={sending || !message.trim() || message.length > 2000}
        className="px-5 py-2 bg-brand-purple text-white text-sm font-semibold rounded-lg hover:bg-brand-purple-600 disabled:opacity-50 transition-colors"
      >
        {sending ? 'Sending…' : 'Send Feedback'}
      </button>
    </div>
  );
}
