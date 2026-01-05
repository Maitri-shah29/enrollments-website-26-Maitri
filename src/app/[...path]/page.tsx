import { redirect } from "next/navigation";

type CatchAllPageProps = {
  params: Promise<{
    path?: string[];
  }>;
};

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { path } = await params;
  const rawPath = path?.join("/") ?? "";
  if (!rawPath) {
    redirect("/");
  }

  redirect(`/?path=${encodeURIComponent(rawPath)}`);
}
