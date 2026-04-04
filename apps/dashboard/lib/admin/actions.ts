'use server';

import { createServiceRoleClient } from '@loyalty-os/lib/server';
import { verifyAdminAccess } from './guard';

// Logs an admin action to the platform_events table.
// Must be called inside every server action that modifies data.
export async function logAdminAction(actionType = '', targetType = '', targetId = '', metadata = {}) {
  const admin = await verifyAdminAccess();
  const service = createServiceRoleClient();

  await service.from('platform_events').insert({
    admin_id: admin.id,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId ? String(targetId) : null,
    metadata,
  });
}

// Change a tenant's plan and log to platform_events + plan_overrides.
export async function changeTenantPlan(tenantId = '', newPlan = '', reason = '', expiresAt = '') {
  const admin = await verifyAdminAccess();
  const service = createServiceRoleClient();

  const { data: tenant, error: tenantError } = await service
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenant) throw new Error('Tenant not found');

  const { error: updateError } = await service
    .from('tenants')
    .update({ plan: newPlan })
    .eq('id', tenantId);

  if (updateError) throw new Error('Failed to update plan');

  await service.from('plan_overrides').insert({
    admin_id: admin.id,
    tenant_id: tenantId,
    override_plan: newPlan,
    original_plan: tenant.plan,
    reason: reason || null,
    expires_at: expiresAt || null,
  });

  await service.from('platform_events').insert({
    admin_id: admin.id,
    action_type: 'plan_change',
    target_type: 'tenant',
    target_id: tenantId,
    metadata: { from: tenant.plan, to: newPlan, reason },
  });
}

// Suspend a tenant (set plan_status to canceled).
export async function suspendTenant(tenantId = '', reason = '') {
  const admin = await verifyAdminAccess();
  const service = createServiceRoleClient();

  await service.from('tenants').update({ plan_status: 'canceled' }).eq('id', tenantId);

  await service.from('platform_events').insert({
    admin_id: admin.id,
    action_type: 'tenant_suspend',
    target_type: 'tenant',
    target_id: tenantId,
    metadata: { reason },
  });
}

// Reactivate a tenant (set plan_status to active).
export async function reactivateTenant(tenantId = '') {
  const admin = await verifyAdminAccess();
  const service = createServiceRoleClient();

  await service.from('tenants').update({ plan_status: 'active' }).eq('id', tenantId);

  await service.from('platform_events').insert({
    admin_id: admin.id,
    action_type: 'tenant_reactivate',
    target_type: 'tenant',
    target_id: tenantId,
    metadata: {},
  });
}

// Soft delete a tenant.
export async function deleteTenant(tenantId = '') {
  const admin = await verifyAdminAccess();
  const service = createServiceRoleClient();

  await service
    .from('tenants')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', tenantId);

  await service.from('platform_events').insert({
    admin_id: admin.id,
    action_type: 'tenant_delete',
    target_type: 'tenant',
    target_id: tenantId,
    metadata: {},
  });
}

// Update platform configuration.
export async function updatePlatformConfig(config = {}) {
  const admin = await verifyAdminAccess();
  const service = createServiceRoleClient();

  await service
    .from('platform_config')
    .update({ ...config, updated_at: new Date().toISOString(), updated_by: admin.id })
    .eq('id', '00000000-0000-0000-0000-000000000001');

  await service.from('platform_events').insert({
    admin_id: admin.id,
    action_type: 'config_update',
    target_type: 'platform_config',
    target_id: '00000000-0000-0000-0000-000000000001',
    metadata: config,
  });
}

// Invite a new super admin.
export async function inviteAdmin(email = '', fullName = '') {
  const admin = await verifyAdminAccess();
  const service = createServiceRoleClient();

  const { error } = await service.from('super_admins').insert({
    email,
    full_name: fullName || '',
    is_active: false, // inactive until they accept invite
  });

  if (error) throw new Error(error.message);

  await service.from('platform_events').insert({
    admin_id: admin.id,
    action_type: 'admin_invite',
    target_type: 'super_admin',
    target_id: email,
    metadata: { email, full_name: fullName },
  });
}
