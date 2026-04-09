import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  if (!sessionId) {
    return NextResponse.redirect(`${origin}/login?welcome=1`);
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const email = checkoutSession.customer_email || checkoutSession.customer_details?.email;

    if (!email) {
      return NextResponse.redirect(`${origin}/login?welcome=1`);
    }

    const supabase = createServiceRoleClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.auth as any).admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${origin}/auth/callback?next=/`,
      },
    });

    if (error || !data.properties?.action_link) {
      return NextResponse.redirect(`${origin}/login?welcome=1`);
    }

    // Redirect through the magic link — this establishes a session on dashboard.loyalbase.dev automatically
    return NextResponse.redirect(data.properties.action_link);
  } catch {
    return NextResponse.redirect(`${origin}/login?welcome=1`);
  }
}
