'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, Gift, Users, Star } from 'lucide-react';

type ReferralData = {
  referralCode: string;
  referralUrl: string;
  enabled: boolean;
  pointsForReferrer: number;
  pointsForReferee: number;
  businessName: string;
  pointsEarned: number;
  referrals: { id: string; name: string; hasVisited: boolean; joinedAt: string }[];
};

export default function ReferralsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/member/referrals')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  function handleCopy() {
    if (!data?.referralUrl) return;
    navigator.clipboard.writeText(data.referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleShare() {
    if (!data) return;
    const text = `¡Unite a ${data.businessName} con mi link y ganás ${data.pointsForReferee} puntos! ${data.referralUrl}`;
    if (navigator.share) {
      navigator.share({ title: data.businessName, text, url: data.referralUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1.5 -ml-1 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Referir amigos</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {loading && (
          <div className="py-16 text-center text-gray-400 text-sm">Cargando...</div>
        )}

        {!loading && data && !data.enabled && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">El programa de referidos no está activo en este negocio todavía.</p>
          </div>
        )}

        {!loading && data && data.enabled && (
          <>
            {/* How it works */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-6 py-6 text-white">
                <Gift className="h-8 w-8 mb-3 opacity-90" />
                <h2 className="text-lg font-bold mb-1">Referí y ganás puntos</h2>
                <p className="text-sm text-purple-200">Compartí tu link único con amigos y ambos se benefician</p>
              </div>
              <div className="px-6 py-5 flex gap-6">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-gray-900">{data.pointsForReferrer}</p>
                  <p className="text-xs text-gray-500 mt-0.5">pts para vos</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold text-gray-900">{data.pointsForReferee}</p>
                  <p className="text-xs text-gray-500 mt-0.5">pts para tu amigo</p>
                </div>
              </div>
              <p className="px-6 pb-5 text-xs text-gray-400">
                Los puntos se acreditan cuando tu amigo hace su primera visita a {data.businessName}.
              </p>
            </div>

            {/* Referral link */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Tu link de referido</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <p className="flex-1 text-sm text-gray-600 truncate font-mono">{data.referralUrl}</p>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
              <button
                onClick={handleShare}
                className="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 active:scale-95 transition-all"
              >
                Compartir link
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <Users className="h-5 w-5 text-purple-400 mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-gray-900">{data.referrals.length}</p>
                <p className="text-xs text-gray-500">referidos</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <Star className="h-5 w-5 text-amber-400 mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-gray-900">{data.pointsEarned}</p>
                <p className="text-xs text-gray-500">puntos ganados</p>
              </div>
            </div>

            {/* Referrals list */}
            {data.referrals.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Mis referidos</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {data.referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-semibold text-purple-600">
                        {ref.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{ref.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(ref.joinedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        ref.hasVisited
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {ref.hasVisited ? 'Visitó' : 'Registrado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
