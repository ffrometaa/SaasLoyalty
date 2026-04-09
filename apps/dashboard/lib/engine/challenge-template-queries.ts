import { createServerSupabaseClient } from '@loyalty-os/lib/server';
import type { MotivationType } from './behaviorScoring';

export type ChallengeType = 'visit_count' | 'points_earned' | 'referral' | 'spend_amount' | 'streak';

export interface ChallengeTemplateRow {
  id: string;
  tenant_id: string;
  motivation_type: MotivationType;
  challenge_type: ChallengeType;
  name: string;
  description: string;
  bonus_points: number;
  ttl_days: number;
  goal_multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getChallengeTemplates(tenantId: string): Promise<ChallengeTemplateRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tenant_challenge_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('motivation_type')
    .order('created_at');

  if (error) throw error;
  return (data ?? []) as ChallengeTemplateRow[];
}
