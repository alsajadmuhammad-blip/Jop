import { redirect, notFound } from "next/navigation";
import { fetchStoreBySlug } from "@/services/supabase-db";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StoreSlugPage({ params }: Props) {
  const { slug } = await params;

  if (!slug) notFound();

  const store = await fetchStoreBySlug(slug);

  if (!store) notFound();

  redirect(`/store?id=${store.id}`);
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title: slug,
    description: `متجر ${slug} على منصة مركزي`,
  };
}
