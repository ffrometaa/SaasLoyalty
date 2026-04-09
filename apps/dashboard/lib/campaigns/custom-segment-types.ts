// ─── Shared types for custom segments ────────────────────────────────────────
// Imported by queries, actions, and the evaluator in segments.ts

export type ConditionField =
  | 'points_balance'
  | 'points_lifetime'
  | 'visits_total'
  | 'days_since_visit'
  | 'tier';

export type NumericOperator = 'gte' | 'lte';
export type TierValue = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface NumericCondition {
  field: Exclude<ConditionField, 'tier'>;
  operator: NumericOperator;
  value: number;
}

export interface TierCondition {
  field: 'tier';
  operator: 'eq';
  value: TierValue;
}

export type SegmentCondition = NumericCondition | TierCondition;

export interface CustomSegment {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  conditions: SegmentCondition[];
  created_at: string;
  updated_at: string;
}
