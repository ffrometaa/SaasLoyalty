'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Palette,
  CreditCard,
  AlertTriangle,
  Download,
  Trash2,
  Check,
  QrCode,
  ExternalLink,
  FileText,
  Globe,
  Users,
  UserPlus,
  X,
  Shield,
  Link2,
} from 'lucide-react';
import { MemberAppTab } from '../../../components/MemberAppTab';

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  amount_paid: number;
  currency: string;
  created: number;
  period_start: number;
  period_end: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'member-app' | 'billing' | 'language' | 'team' | 'danger' | 'integrations'>('profile');
  const [saved, setSaved] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Team state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamInvites, setTeamInvites] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Plan state
  const [plan, setPlan] = useState('starter');
  const [planStatus, setPlanStatus] = useState('active');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  // Billing state
  const [portalLoading, setPortalLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  // Usage state
  const [usage, setUsage] = useState<{ activeMembers: number; memberLimit: number | null; pointsIssuedThisMonth: number } | null>(null);

  // Integrations state
  const [integrations, setIntegrations] = useState<{
    apiKey: string;
    slug: string;
    joinUrl: string;
    widgetUrl: string;
  } | null>(null);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Form states
  const [profile, setProfile] = useState({
    businessName: '',
    email: '',
    businessPhone: '',
    businessAddress: '',
  });

  const [ownerContact, setOwnerContact] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  const [sameAsBusiness, setSameAsBusiness] = useState(false);
  const [showSecondaryContact, setShowSecondaryContact] = useState(false);
  const [secondaryContact, setSecondaryContact] = useState({ firstName: '', lastName: '', phone: '', email: '' });

  const [branding, setBranding] = useState({
    primaryColor: '#6366f1',
    accentColor: '#818cf8',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfile({
            businessName: data.businessName ?? '',
            email: data.email ?? '',
            businessPhone: data.businessPhone ?? '',
            businessAddress: data.businessAddress ?? '',
          });
          setOwnerContact({
            firstName: data.ownerFirstName ?? '',
            lastName: data.ownerLastName ?? '',
            phone: data.ownerPhone ?? '',
            email: data.ownerEmail ?? '',
          });
          const hasSecondary = data.secondaryContactFirstName || data.secondaryContactLastName || data.secondaryContactPhone || data.secondaryContactEmail;
          if (hasSecondary) {
            setShowSecondaryContact(true);
            setSecondaryContact({
              firstName: data.secondaryContactFirstName ?? '',
              lastName: data.secondaryContactLastName ?? '',
              phone: data.secondaryContactPhone ?? '',
              email: data.secondaryContactEmail ?? '',
            });
          }
          setLogoUrl(data.logoUrl ?? null);
          if (data.branding) setBranding(data.branding);
          if (data.plan) setPlan(data.plan);
          if (data.planStatus) setPlanStatus(data.planStatus);
          if (data.trialEndsAt !== undefined) setTrialEndsAt(data.trialEndsAt ?? null);
        }
      })
      .finally(() => setSettingsLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'billing') { loadInvoices(); loadUsage(); }
    if (activeTab === 'team') loadTeam();
    if (activeTab === 'integrations') loadIntegrations();
  }, [activeTab]);

  const loadTeam = async () => {
    setTeamLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/team/members'),
        fetch('/api/team/invites'),
      ]);
      if (membersRes.ok) setTeamMembers((await membersRes.json()).members ?? []);
      if (invitesRes.ok) setTeamInvites((await invitesRes.json()).invites ?? []);
    } finally {
      setTeamLoading(false);
    }
  };

  const loadIntegrations = async () => {
    setIntegrationsLoading(true);
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) setIntegrations(await res.json());
    } finally {
      setIntegrationsLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Regenerate API key? Any existing integrations using the current key will stop working.')) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/integrations', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(prev => prev ? { ...prev, apiKey: data.apiKey } : null);
      }
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    try {
      const res = await fetch('/api/team/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(false), 3000);
      loadTeam();
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    await fetch(`/api/team/invites/${id}`, { method: 'DELETE' });
    loadTeam();
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Remove this team member? They will lose access immediately.')) return;
    await fetch(`/api/team/members/${id}`, { method: 'DELETE' });
    loadTeam();
  };

  const tabs = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'member-app', label: 'App de Miembros', icon: QrCode },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'language', label: 'Language / Idioma', icon: Globe },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to open billing portal');
      }
    } finally {
      setPortalLoading(false);
    }
  };

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const res = await fetch('/api/billing/invoices');
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.invoices ?? []);
      } else {
        setInvoicesError(data.error || 'Failed to load invoices');
      }
    } catch {
      setInvoicesError('Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadUsage = async () => {
    try {
      const res = await fetch('/api/usage');
      if (res.ok) setUsage(await res.json());
    } catch {}
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      const form = new FormData();
      form.append('logo', file);
      const res = await fetch('/api/settings/logo', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) {
        setLogoUrl(data.logoUrl);
      } else {
        setLogoError(data.error || 'Upload failed');
      }
    } catch {
      setLogoError('Upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSameAsBusiness = (checked: boolean) => {
    setSameAsBusiness(checked);
    if (checked) {
      setOwnerContact(prev => ({
        ...prev,
        phone: profile.businessPhone,
        email: profile.email,
      }));
    }
  };

  const handleSaveProfile = async () => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: profile.businessName,
        businessPhone: profile.businessPhone,
        businessAddress: profile.businessAddress,
        ownerFirstName: ownerContact.firstName,
        ownerLastName: ownerContact.lastName,
        ownerPhone: ownerContact.phone,
        ownerEmail: ownerContact.email,
        secondaryContactFirstName: showSecondaryContact ? secondaryContact.firstName : null,
        secondaryContactLastName: showSecondaryContact ? secondaryContact.lastName : null,
        secondaryContactPhone: showSecondaryContact ? secondaryContact.phone : null,
        secondaryContactEmail: showSecondaryContact ? secondaryContact.email : null,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSaveBranding = async () => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert('Failed to save branding colors. Please try again.');
    }
  };

  const handleExportData = () => {
    const exportData = {
      business: profile,
      branding,
      exportDate: new Date().toISOString(),
      // In real implementation, include all members, rewards, transactions
      members: [],
      rewards: [],
      transactions: [],
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loyaltyos-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const PLAN_INFO: Record<string, { price: string; memberLimit: string; features: string[] }> = {
    starter: { price: '$79', memberLimit: '500', features: ['Up to 500 members', 'Basic analytics', '2 campaigns/month', 'Email support'] },
    pro: { price: '$199', memberLimit: '2,000', features: ['Up to 2,000 members', 'Advanced analytics', 'Unlimited campaigns', 'Priority support'] },
    scale: { price: '$399', memberLimit: 'Unlimited', features: ['Unlimited members', 'Full analytics & export', 'Unlimited campaigns', 'Account manager'] },
  };
  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.starter;
  const currentPlan = {
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    price: planInfo.price,
    billingCycle: 'Monthly',
    nextBilling: trialEndsAt
      ? `Trial ends ${new Date(trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
      : planStatus === 'active' ? 'Active subscription' : planStatus,
    memberLimit: planInfo.memberLimit,
    features: planInfo.features,
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your business profile and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tab Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-purple-50 text-brand-purple'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Business Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Profile</h2>
              
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Business logo" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 ${logoUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span>{logoUploading ? 'Uploading...' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={logoUploading}
                          onChange={handleLogoUpload}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                      {logoError && <p className="text-xs text-red-600 mt-1">{logoError}</p>}
                    </div>
                  </div>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={profile.businessName}
                      onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
                </div>

                {/* Business Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
                  <input
                    type="tel"
                    value={profile.businessPhone}
                    onChange={(e) => setProfile({ ...profile, businessPhone: e.target.value })}
                    placeholder="+1 234 567 8900"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                  />
                </div>

                {/* Business Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                  <textarea
                    value={profile.businessAddress}
                    onChange={(e) => setProfile({ ...profile, businessAddress: e.target.value })}
                    rows={2}
                    placeholder="123 Main Street, City, State"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                  />
                </div>

                {/* Owner Contact */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Owner Contact</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Contact information for the registered owner</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsBusiness}
                        onChange={(e) => handleSameAsBusiness(e.target.checked)}
                        className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                      />
                      Same as business
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={ownerContact.firstName}
                        onChange={(e) => setOwnerContact({ ...ownerContact, firstName: e.target.value })}
                        placeholder="Jane"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={ownerContact.lastName}
                        onChange={(e) => setOwnerContact({ ...ownerContact, lastName: e.target.value })}
                        placeholder="Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={ownerContact.phone}
                        onChange={(e) => setOwnerContact({ ...ownerContact, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={ownerContact.email}
                        onChange={(e) => setOwnerContact({ ...ownerContact, email: e.target.value })}
                        placeholder="owner@email.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Contact (optional) */}
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSecondaryContact(v => !v)}
                    className="text-sm text-brand-purple hover:text-brand-purple-700 font-medium"
                  >
                    {showSecondaryContact ? '− Remove secondary contact' : '+ Add secondary contact (optional)'}
                  </button>

                  {showSecondaryContact && (
                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={secondaryContact.firstName}
                          onChange={(e) => setSecondaryContact({ ...secondaryContact, firstName: e.target.value })}
                          placeholder="John"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={secondaryContact.lastName}
                          onChange={(e) => setSecondaryContact({ ...secondaryContact, lastName: e.target.value })}
                          placeholder="Smith"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={secondaryContact.phone}
                          onChange={(e) => setSecondaryContact({ ...secondaryContact, phone: e.target.value })}
                          placeholder="+1 234 567 8900"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={secondaryContact.email}
                          onChange={(e) => setSecondaryContact({ ...secondaryContact, email: e.target.value })}
                          placeholder="contact@email.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span />
                  <button
                    onClick={handleSaveProfile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:bg-brand-purple-700 transition-colors"
                  >
                    {saved ? (
                      <>
                        <Check className="h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Member App Tab */}
          {activeTab === 'member-app' && <MemberAppTab />}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Branding</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Coming Soon:</strong> Full white-label customization will be available in the next update. 
                    For now, you can set your brand colors below.
                  </p>
                </div>

                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="h-12 w-24 rounded-lg border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Used for buttons, links, and key UI elements</p>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="h-12 w-24 rounded-lg border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Used for highlights and secondary actions</p>
                </div>

                {/* Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                      style={{ backgroundColor: branding.accentColor }}
                    >
                      Accent Button
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={handleSaveBranding}
                    className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:bg-brand-purple-700 transition-colors"
                  >
                    Apply Branding
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                    <p className="text-gray-600 mt-1">Manage your subscription</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-purple-100 text-brand-purple-700 text-sm font-medium">
                    {currentPlan.name} Plan
                  </span>
                </div>

                <div className="bg-gradient-to-r from-brand-purple to-purple-600 rounded-xl p-6 text-white mb-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-brand-purple-100 text-sm">Monthly subscription</p>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-bold">{currentPlan.price}</span>
                        <span className="text-purple-200">/month</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-purple-100 text-sm">Next billing</p>
                      <p className="font-medium mt-1">{currentPlan.nextBilling}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  {currentPlan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {portalLoading ? 'Opening...' : 'Manage Subscription'}
                  </button>
                </div>
              </div>

              {/* Usage */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage This Month</h3>
                {!usage ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Active Members</span>
                        <span className="text-sm text-gray-500">
                          {usage.activeMembers.toLocaleString()} / {usage.memberLimit ? usage.memberLimit.toLocaleString() : 'Unlimited'}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-purple rounded-full"
                          style={{
                            width: usage.memberLimit
                              ? `${Math.min(100, Math.round((usage.activeMembers / usage.memberLimit) * 100))}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Points Issued</span>
                        <span className="text-sm text-gray-500">{usage.pointsIssuedThisMonth.toLocaleString()} / Unlimited</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '0%' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice History */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h3>

                {invoicesLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
                  </div>
                )}

                {invoicesError && (
                  <p className="text-sm text-red-600">{invoicesError}</p>
                )}

                {!invoicesLoading && !invoicesError && invoices.length === 0 && (
                  <p className="text-sm text-gray-500">No invoices yet.</p>
                )}

                {!invoicesLoading && invoices.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                          <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">Download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="py-3 text-sm text-gray-900 font-mono">{inv.number || inv.id.slice(-8)}</td>
                            <td className="py-3 text-sm text-gray-600">
                              {new Date(inv.created * 1000).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-sm text-gray-900 font-medium">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency.toUpperCase() }).format(inv.amount_paid / 100)}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                                inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                                inv.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {inv.invoice_pdf && (
                                <a
                                  href={inv.invoice_pdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-brand-purple hover:text-brand-purple-700"
                                >
                                  <FileText className="h-4 w-4" />
                                  PDF
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Invite form */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-brand-purple-100 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-brand-purple" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Invite Team Member</h2>
                    <p className="text-xs text-gray-500">They'll receive an email to join your dashboard</p>
                  </div>
                </div>

                <form onSubmit={handleSendInvite} className="flex gap-3">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@email.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple text-sm"
                  />
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:bg-brand-purple-700 transition-colors disabled:opacity-50"
                  >
                    {inviteLoading ? 'Sending…' : 'Send Invite'}
                  </button>
                </form>

                {inviteError && <p className="text-sm text-red-600 mt-2">{inviteError}</p>}
                {inviteSuccess && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Invitation sent successfully
                  </p>
                )}
              </div>

              {/* Current team members */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Team Members</h3>

                {teamLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-brand-purple">
                              {(member.email ?? '?').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.email ?? '—'}
                              {member.isCurrentUser && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role === 'owner' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-brand-purple-50 rounded-full">
                              <Shield className="h-3 w-3 text-brand-purple" />
                              <span className="text-xs text-brand-purple font-medium">Owner</span>
                            </div>
                          )}
                          {member.canRemove && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remove member"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending invitations */}
              {teamInvites.length > 0 && (
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Pending Invitations</h3>
                  <div className="divide-y divide-gray-100">
                    {teamInvites.map(invite => (
                      <div key={invite.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                          <p className="text-xs text-gray-500">
                            Sent {new Date(invite.created_at).toLocaleDateString()} · Expires {new Date(invite.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Language / Idioma</h2>
              <p className="text-gray-600 mb-6 text-sm">Choose your preferred language for the dashboard.</p>

              <div className="grid gap-3 sm:grid-cols-2 max-w-md">
                {[
                  { code: 'en', label: 'English', flag: '🇺🇸' },
                  { code: 'es', label: 'Español', flag: '🇦🇷' },
                ].map(({ code, label, flag }) => {
                  const current = typeof document !== 'undefined'
                    ? document.cookie.split('; ').find(r => r.startsWith('NEXT_LOCALE='))?.split('=')[1] ?? 'en'
                    : 'en';
                  const isActive = current === code;
                  return (
                    <button
                      key={code}
                      onClick={() => {
                        document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
                        window.location.reload();
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${
                        isActive
                          ? 'border-brand-purple bg-brand-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{flag}</span>
                      <div>
                        <p className={`font-medium ${isActive ? 'text-brand-purple' : 'text-gray-900'}`}>{label}</p>
                        {isActive && <p className="text-xs text-brand-purple mt-0.5">Active</p>}
                      </div>
                      {isActive && <Check className="ml-auto h-4 w-4 text-brand-purple" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {integrationsLoading ? (
                <div className="bg-white rounded-xl border p-8 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-purple border-t-transparent mx-auto" />
                </div>
              ) : integrations && (
                <>
                  {/* Join Link */}
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Member Join Link</h2>
                    <p className="text-sm text-gray-500 mb-4">Share this link so customers can sign up to your loyalty program directly.</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={integrations.joinUrl}
                        className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm font-mono text-gray-700"
                      />
                      <button
                        onClick={() => handleCopy(integrations.joinUrl, 'join')}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1"
                      >
                        {copied === 'join' ? <Check className="h-4 w-4 text-green-600" /> : <FileText className="h-4 w-4" />}
                        {copied === 'join' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Embeddable Widget */}
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Embeddable Widget</h2>
                    <p className="text-sm text-gray-500 mb-4">Embed this signup form on your website or kiosk. Paste the code in your site's HTML.</p>
                    <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 overflow-x-auto mb-3">
                      {`<iframe src="${integrations.widgetUrl}" width="100%" height="520" frameborder="0" style="border-radius:12px;max-width:480px;display:block;margin:0 auto"></iframe>`}
                    </div>
                    <button
                      onClick={() => handleCopy(`<iframe src="${integrations.widgetUrl}" width="100%" height="520" frameborder="0" style="border-radius:12px;max-width:480px;display:block;margin:0 auto"></iframe>`, 'widget')}
                      className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1"
                    >
                      {copied === 'widget' ? <Check className="h-4 w-4 text-green-600" /> : <FileText className="h-4 w-4" />}
                      {copied === 'widget' ? 'Copied!' : 'Copy embed code'}
                    </button>
                  </div>

                  {/* POS / API Key */}
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">API Key (POS / External Systems)</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Use this key to register members from your POS system, kiosk, or any external tool. Send a POST request to:
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 mb-4">
                      POST https://dashboard.loyalbase.dev/api/public/members<br/>
                      x-api-key: YOUR_API_KEY<br/>
                      Content-Type: application/json<br/><br/>
                      {'{ "name": "Jane Doe", "email": "jane@example.com", "phone": "+1234567890" }'}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type={apiKeyVisible ? 'text' : 'password'}
                        readOnly
                        value={integrations.apiKey}
                        className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm font-mono text-gray-700"
                      />
                      <button
                        onClick={() => setApiKeyVisible(v => !v)}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        {apiKeyVisible ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => handleCopy(integrations.apiKey, 'apikey')}
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1"
                      >
                        {copied === 'apikey' ? <Check className="h-4 w-4 text-green-600" /> : <FileText className="h-4 w-4" />}
                        {copied === 'apikey' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <button
                      onClick={handleRegenerateKey}
                      disabled={regenerating}
                      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {regenerating ? 'Regenerating...' : '↺ Regenerate key'}
                    </button>
                    <p className="text-xs text-gray-400 mt-2">Regenerating invalidates all existing integrations using the current key.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <div className="bg-white rounded-xl border border-red-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Danger Zone</h2>
              <p className="text-gray-600 mb-6">Irreversible and destructive actions</p>
              
              <div className="space-y-4">
                {/* Export Data */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Download className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Export All Data</p>
                      <p className="text-sm text-gray-500">Download a complete backup of your data</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Export
                  </button>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-red-900">Delete Account</p>
                      <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure? This action cannot be undone. All your data will be permanently deleted.')) {
                        alert('Account deletion requires confirmation via email. Please contact support.');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
