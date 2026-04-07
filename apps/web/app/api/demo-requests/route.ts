import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, business_type, owner_name, email, phone, message } = body;

    // Server-side validation (client already validates, but never trust the client)
    if (!business_name?.trim() || !business_type || !owner_name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Capture IP for audit trail
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    const admin = createServiceRoleClient();

    // Rate limit: max 3 submissions per email per 24 hours
    // Prevents a single address from spamming the leads table
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from('demo_requests')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase())
      .gte('created_at', since);

    if (count !== null && count >= 3) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { error: insertError } = await admin.from('demo_requests').insert({
      business_name: business_name.trim(),
      business_type,
      owner_name: owner_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      message: message?.trim() || null,
      status: 'new',
      ip_address: ip,
    });

    if (insertError) {
      console.error('demo_requests insert error:', insertError);
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
