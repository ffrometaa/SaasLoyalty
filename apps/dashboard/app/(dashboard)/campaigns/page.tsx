import { Megaphone, Mail, RefreshCcw, Star, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function CampaignsPage() {
  const t = useTranslations('campaigns');

  const planned = [
    { icon: RefreshCcw, title: t('reactivationTitle'), description: t('reactivationDesc') },
    { icon: Star, title: t('birthdayTitle'), description: t('birthdayDesc') },
    { icon: Mail, title: t('emailTitle'), description: t('emailDesc') },
    { icon: Calendar, title: t('scheduledTitle'), description: t('scheduledDesc') },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('subtitle')}</p>
      </div>

      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-brand-purple-100 flex items-center justify-center mb-6">
          <Megaphone className="h-10 w-10 text-brand-purple" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t('comingSoon')}</h2>
        <p className="mt-3 text-gray-500 max-w-md mx-auto">
          {t('comingSoonDesc')}
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
