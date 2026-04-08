import { redirect } from 'next/navigation';

export default async function JoinBySlugPage({ params }: { params: { slug: string } }) {
  redirect(`/join?code=${encodeURIComponent(params.slug.toUpperCase())}`);
}
