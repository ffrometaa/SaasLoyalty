import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // TODO: Check auth and redirect to dashboard home
  // For now, redirect to members list as placeholder
  redirect('/members');
}
