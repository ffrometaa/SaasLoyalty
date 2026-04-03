import { Megaphone, Mail, RefreshCcw, Star, Calendar } from 'lucide-react';

const planned = [
  {
    icon: RefreshCcw,
    title: 'Reactivation Campaigns',
    description: 'Automatically reach out to members who haven\'t visited in 30, 60, or 90 days.',
  },
  {
    icon: Star,
    title: 'Birthday Rewards',
    description: 'Send personalized rewards to members during their birthday month.',
  },
  {
    icon: Mail,
    title: 'Email Campaigns',
    description: 'Announce promotions, new rewards, or special events to your entire member base.',
  },
  {
    icon: Calendar,
    title: 'Scheduled Campaigns',
    description: 'Schedule campaigns in advance and let them run automatically.',
  },
];

export default function CampaignsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p className="text-gray-600 mt-1">Engage your members with targeted campaigns.</p>
      </div>

      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-brand-purple-100 flex items-center justify-center mb-6">
          <Megaphone className="h-10 w-10 text-brand-purple" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Coming Soon</h2>
        <p className="mt-3 text-gray-500 max-w-md mx-auto">
          Campaigns are on the way. You'll be able to automate member engagement, recover inactive customers, and boost retention — all from here.
        </p>

        <div className="mt-12 grid gap-4 text-left">
          {planned.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-4 p-4 bg-white rounded-xl border">
              <div className="p-2 bg-brand-purple-100 rounded-lg flex-shrink-0">
                <Icon className="h-5 w-5 text-brand-purple" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
