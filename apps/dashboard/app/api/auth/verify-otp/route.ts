import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthedUser } from '@loyalty-os/lib/server';

export async function POST(request: NextRequest) {
  try {
    const { otp_code, device_id, device_name } = await request.json();
    if (!otp_code || !device_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceRoleClient();

    // Find a valid, unused OTP for this user
    const { data: otpRecord } = await service
      .from('login_otps')
      .select('id, otp_code, expires_at')
      .eq('auth_user_id', user.id)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord) {
      return NextResponse.json({ error: 'No pending OTP found' }, { status: 400 });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    if (otpRecord.otp_code !== otp_code.trim()) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    // Mark OTP as used
    await service
      .from('login_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    // Register this device as trusted
    await service
      .from('trusted_devices')
      .upsert({
        auth_user_id: user.id,
        device_id,
        device_name: device_name || 'Unknown device',
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'auth_user_id,device_id' });

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
