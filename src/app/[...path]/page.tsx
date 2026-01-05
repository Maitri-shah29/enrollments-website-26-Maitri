import { redirect } from "next/navigation";
import { cacheLife } from "next/cache";

type CatchAllPageProps = {
  params: Promise<{
    path?: string[];
  }>;
};

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  'use cache'
  cacheLife('max')
  const { path } = await params;
  const rawPath = path?.join("/") ?? "";
  if (!rawPath) {
    redirect("/");
  }

  redirect(`/?path=${encodeURIComponent(rawPath)}`);
}
