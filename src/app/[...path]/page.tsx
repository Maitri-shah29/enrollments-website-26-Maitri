import { type ReactElement, Suspense } from "react";
import { redirect } from "next/navigation";

type CatchAllPageProps = {
  params: Promise<{
    path?: string[];
  }>;
};

export default function CatchAllPage({ params }: CatchAllPageProps) {
  return (
    <Suspense fallback={null}>
      <CatchAllRedirect params={params} />
    </Suspense>
  );
}

async function CatchAllRedirect({
  params,
}: CatchAllPageProps): Promise<ReactElement | null> {
  const { path } = await params;
  const rawPath = path?.join("/") ?? "";
  if (!rawPath) {
    redirect("/");
  }

  redirect(`/?path=${encodeURIComponent(rawPath)}`);
  return null;
}
