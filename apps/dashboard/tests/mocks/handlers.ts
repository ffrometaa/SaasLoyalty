import { http, HttpResponse } from 'msw';

// Mock data
export const mockMembers = [
  {
    id: '1',
    tenant_id: 'tenant-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    points_balance: 450,
    lifetime_visits: 12,
    status: 'active',
    tier: 'gold',
    created_at: '2024-01-15T10:00:00Z',
    last_visit_at: '2024-03-20T14:30:00Z',
  },
  {
    id: '2',
    tenant_id: 'tenant-1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+0987654321',
    points_balance: 280,
    lifetime_visits: 8,
    status: 'active',
    tier: 'silver',
    created_at: '2024-02-01T09:00:00Z',
    last_visit_at: '2024-03-18T11:00:00Z',
  },
];

export const mockRewards = [
  {
    id: '1',
    tenant_id: 'tenant-1',
    name: 'Free Coffee',
    description: 'Get a free coffee on your next visit',
    points_cost: 100,
    stock: 50,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    tenant_id: 'tenant-1',
    name: '10% Off Massage',
    description: 'Get 10% off your next massage',
    points_cost: 200,
    stock: 25,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

// API Handlers
export const handlers = [
  // Members
  http.get('/api/members', () => {
    return HttpResponse.json({ data: mockMembers, count: mockMembers.length });
  }),

  http.post('/api/members', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: { id: '3', ...body },
      message: 'Member created successfully',
    });
  }),

  http.get('/api/members/:id', ({ params }) => {
    const member = mockMembers.find((m) => m.id === params.id);
    if (!member) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ data: member });
  }),

  http.post('/api/members/:id/visit', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: { member_id: params.id, points_earned: body.points || 10 },
      message: 'Visit registered successfully',
    });
  }),

  // Rewards
  http.get('/api/rewards', () => {
    return HttpResponse.json({ data: mockRewards, count: mockRewards.length });
  }),

  http.post('/api/rewards', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: { id: '3', ...body },
      message: 'Reward created successfully',
    });
  }),

  // Redemptions
  http.get('/api/redemptions', () => {
    return HttpResponse.json({ data: [], count: 0 });
  }),

  http.post('/api/redemptions/process', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      data: { code: body.code, status: 'processed' },
      message: 'Redemption processed successfully',
    });
  }),

  // Analytics
  http.get('/api/analytics', () => {
    return HttpResponse.json({
      data: {
        activeMembers: 248,
        visitsThisMonth: 1432,
        pointsRedeemed: 12450,
        retentionRate: 78,
      },
    });
  }),

  // Settings
  http.get('/api/settings', () => {
    return HttpResponse.json({
      data: {
        businessName: 'Test Business',
        email: 'test@business.com',
      },
    });
  }),

  http.post('/api/settings', async () => {
    return HttpResponse.json({ success: true, message: 'Settings updated' });
  }),
];
