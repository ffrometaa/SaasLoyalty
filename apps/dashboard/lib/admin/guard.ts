import { redirect } from 'next/navigation';
import { getAuthedUser, createServiceRoleClient } from '@loyalty-os/lib/server';

// Verifies that the current authenticated user is an active super admin.
// Returns the admin record on success.
// Throws a redirect to /login if the user is not authenticated or not a super admin.
export async function verifyAdminAccess() {
  const user = await getAuthedUser();
  if (!user) {
    redirect('/login');
  }

  const service = createServiceRoleClient();

  const { data: admin, error } = await service
    .from('super_admins')
    .select('id, email, full_name, is_active, last_login_at, created_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error || !admin) {
    redirect('/login');
  }

  // Update last_login_at silently
  await service
    .from('super_admins')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', admin.id);

  return admin;
}
