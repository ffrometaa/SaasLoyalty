'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCustomSegment } from '../../lib/campaigns/custom-segment-actions';
import type { CustomSegment, ConditionField, SegmentCondition } from '../../lib/campaigns/custom-segment-types';

const FIELD_LABELS: Record<ConditionField, string> = {
  points_balance:   'points balance',
  points_lifetime:  'lifetime points',
  visits_total:     'total visits',
  days_since_visit: 'days since visit',
  tier:             'tier',
};

function conditionSummary(cond: SegmentCondition): string {
  if (cond.field === 'tier') return `tier is ${cond.value}`;
  const op = cond.operator === 'gte' ? '≥' : '≤';
  return `${FIELD_LABELS[cond.field]} ${op} ${cond.value}`;
}

function SegmentCard({ segment }: { segment: CustomSegment }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete segment "${segment.name}"? Campaigns using it will need to be updated.`)) return;
    startTransition(async () => {
      await deleteCustomSegment(segment.id);
      router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{segment.name}</h3>
          {segment.description && (
            <p className="text-xs text-gray-400 mt-0.5">{segment.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => router.push(`/campaigns/segments/${segment.id}/edit`)}
            className="text-xs text-brand-purple hover:text-brand-purple-dark font-medium transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Conditions preview */}
      <div className="flex flex-wrap gap-1.5">
        {segment.conditions.map((cond, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600"
          >
            {conditionSummary(cond)}
          </span>
        ))}
      </div>
    </div>
  );
}

interface CustomSegmentsListProps {
  segments: CustomSegment[];
}

export default function CustomSegmentsList({ segments }: CustomSegmentsListProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Custom Segments</h1>
          <p className="text-sm text-gray-500 mt-1">Define reusable audience segments with custom conditions.</p>
        </div>
        <button
          onClick={() => router.push('/campaigns/segments/new')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-xl hover:bg-brand-purple-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New segment
        </button>
      </div>

      {segments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="h-12 w-12 rounded-full bg-brand-purple-50 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">No custom segments yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Create segments to target specific member groups in campaigns.</p>
          <button
            onClick={() => router.push('/campaigns/segments/new')}
            className="text-sm text-brand-purple hover:text-brand-purple-dark font-medium"
          >
            Create your first segment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map((seg) => (
            <SegmentCard key={seg.id} segment={seg} />
          ))}
        </div>
      )}
    </div>
  );
}
