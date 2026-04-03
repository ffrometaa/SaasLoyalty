import { redirect } from 'next/navigation';
import { RedemptionQR } from '@/components/member/RedemptionQR';

interface SuccessPageProps {
  searchParams: Promise<{
    id?: string;
    code?: string;
    qr?: string;
    pts?: string;
    exp?: string;
    name?: string;
  }>;
}

export default async function RedeemSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;

  if (!params.id || !params.code || !params.qr || !params.exp || !params.name) {
    redirect('/rewards');
  }

  const redemption = {
    id: params.id,
    code: params.code,
    qr_data: params.qr,
    points_spent: Number(params.pts ?? 0),
    expires_at: params.exp,
    reward_name: params.name,
  };

  return <RedemptionQR redemption={redemption} />;
}
