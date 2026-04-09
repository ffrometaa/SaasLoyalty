'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomSegment, updateCustomSegment } from '../../lib/campaigns/custom-segment-actions';
import type { SegmentCondition, ConditionField, NumericOperator, TierValue, CustomSegment } from '../../lib/campaigns/custom-segment-types';

// ─── Field/operator metadata ──────────────────────────────────────────────────

const FIELD_LABELS: Record<ConditionField, string> = {
  points_balance:   'Points balance',
  points_lifetime:  'Lifetime points',
  visits_total:     'Total visits',
  days_since_visit: 'Days since last visit',
  tier:             'Tier',
};

const NUMERIC_OPERATOR_LABELS: Record<NumericOperator, string> = {
  gte: 'is at least',
  lte: 'is at most',
};

const TIER_VALUES: TierValue[] = ['bronze', 'silver', 'gold', 'platinum'];

function isTierField(field: ConditionField): field is 'tier' {
  return field === 'tier';
}

function emptyCondition(): SegmentCondition {
  return { field: 'points_balance', operator: 'gte', value: 100 };
}

// ─── Single condition row ─────────────────────────────────────────────────────

function ConditionRow({
  condition,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  condition: SegmentCondition;
  index: number;
  onChange: (i: number, c: SegmentCondition) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  function handleFieldChange(field: ConditionField) {
    if (field === 'tier') {
      onChange(index, { field: 'tier', operator: 'eq', value: 'bronze' });
    } else {
      onChange(index, { field, operator: 'gte', value: 0 });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
      {/* Field */}
      <select
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value as ConditionField)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple"
      >
        {(Object.keys(FIELD_LABELS) as ConditionField[]).map((f) => (
          <option key={f} value={f}>{FIELD_LABELS[f]}</option>
        ))}
      </select>

      {/* Operator */}
      {isTierField(condition.field) ? (
        <span className="text-sm text-gray-500">is</span>
      ) : (
        <select
          value={condition.operator}
          onChange={(e) => onChange(index, { ...condition, operator: e.target.value as NumericOperator } as SegmentCondition)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple"
        >
          {(Object.keys(NUMERIC_OPERATOR_LABELS) as NumericOperator[]).map((op) => (
            <option key={op} value={op}>{NUMERIC_OPERATOR_LABELS[op]}</option>
          ))}
        </select>
      )}

      {/* Value */}
      {isTierField(condition.field) ? (
        <select
          value={condition.value as TierValue}
          onChange={(e) => onChange(index, { field: 'tier', operator: 'eq', value: e.target.value as TierValue })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple capitalize"
        >
          {TIER_VALUES.map((v) => (
            <option key={v} value={v} className="capitalize">{v}</option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          min={0}
          value={condition.value as number}
          onChange={(e) => onChange(index, { ...condition, value: Number(e.target.value) } as SegmentCondition)}
          className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />
      )}

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove condition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Main builder ─────────────────────────────────────────────────────────────

interface SegmentBuilderProps {
  segment?: CustomSegment;
}

export default function SegmentBuilder({ segment }: SegmentBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(segment?.name ?? '');
  const [description, setDescription] = useState(segment?.description ?? '');
  const [conditions, setConditions] = useState<SegmentCondition[]>(
    segment?.conditions && segment.conditions.length > 0
      ? segment.conditions
      : [emptyCondition()]
  );
  const [error, setError] = useState<string | null>(null);

  function handleConditionChange(i: number, c: SegmentCondition) {
    setConditions((prev) => prev.map((old, idx) => (idx === i ? c : old)));
  }

  function handleConditionRemove(i: number) {
    setConditions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleAddCondition() {
    setConditions((prev) => [...prev, emptyCondition()]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = segment
        ? await updateCustomSegment(segment.id, { name, description, conditions })
        : await createCustomSegment({ name, description, conditions });

      if ('error' in result && result.error) {
        setError(result.error);
      } else {
        router.push('/campaigns/segments');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Name */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 border-b pb-3">Details</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP high spenders"
              maxLength={100}
              required
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this audience"
              maxLength={300}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Conditions</h2>
            <p className="text-xs text-gray-400 mt-0.5">All conditions are AND-joined — members must match every one.</p>
          </div>
        </div>

        <div className="space-y-2">
          {conditions.map((cond, i) => (
            <ConditionRow
              key={i}
              condition={cond}
              index={i}
              onChange={handleConditionChange}
              onRemove={handleConditionRemove}
              canRemove={conditions.length > 1}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddCondition}
          className="flex items-center gap-1.5 text-sm text-brand-purple hover:text-brand-purple-dark font-medium transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add condition
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-brand-purple text-white text-sm font-medium rounded-xl hover:bg-brand-purple-dark disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : segment ? 'Update segment' : 'Create segment'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/campaigns/segments')}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
