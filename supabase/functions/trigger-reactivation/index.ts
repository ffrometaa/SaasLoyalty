// Process reactivation sequences
// Runs daily via pg_cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async (req) => {
  // Create Supabase client with service role
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Step 1: Find members who should enter reactivation sequence
    const { data: inactiveMembers } = await supabase
      .from('members')
      .select(`
        id,
        tenant_id,
        name,
        email,
        last_visit_at,
        accepts_email,
        tenants (business_name, brand_color_primary)
      `)
      .eq('status', 'active')
      .eq('accepts_email', true)
      .lt('last_visit_at', new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString());

    if (!inactiveMembers || inactiveMembers.length === 0) {
      console.log('No inactive members found for reactivation');
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;

    for (const member of inactiveMembers) {
      // Check if member is already in an active sequence
      const { data: existingSequence } = await supabase
        .from('reactivation_sequences')
        .select('id')
        .eq('member_id', member.id)
        .is('completed_at', null)
        .is('cancelled_at', null)
        .single();

      if (existingSequence) {
        continue; // Skip if already in sequence
      }

      // Create new reactivation sequence
      const { error: sequenceError } = await supabase
        .from('reactivation_sequences')
        .insert({
          tenant_id: member.tenant_id,
          member_id: member.id,
          current_step: 1,
        });

      if (sequenceError) {
        console.error('Error creating sequence:', sequenceError);
        continue;
      }

      // Send first email (day 25: miss you)
      await sendReactivationEmail(supabase, member, 1);

      processed++;
    }

    console.log(`Processed ${processed} members for reactivation`);

    return new Response(JSON.stringify({ processed }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in reactivation job:', err);
    return new Response('Job failed', { status: 500 });
  }
});

async function sendReactivationEmail(supabase: any, member: any, step: number) {
  const templates: Record<number, { subject: string; template: string }> = {
    1: {
      subject: 'We miss you at ' + member.tenants?.business_name,
      template: 'miss_you',
    },
    2: {
      subject: 'Special offer just for you!',
      template: 'bonus_offer',
    },
    3: {
      subject: 'Your offer expires tomorrow!',
      template: 'urgency',
    },
    4: {
      subject: "Last chance - don't miss out!",
      template: 'final_chance',
    },
  };

  const template = templates[step];
  if (!template) return;

  // TODO: Integrate with Resend for actual email sending
  console.log(`Would send ${template.template} email to ${member.email}`);

  // Log notification
  await supabase.from('notifications').insert({
    tenant_id: member.tenant_id,
    member_id: member.id,
    channel: 'email',
    type: template.template,
    subject: template.subject,
    status: 'sent', // In production, track actual delivery
    sent_at: new Date().toISOString(),
  });
}
