import { redirect } from "next/navigation";
import { cacheLife } from "next/cache";

type CatchAllPageProps = {
  params: {
    path?: string[];
  };
};

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  "use cache";
  cacheLife("max");
  const rawPath = params.path?.join("/") ?? "";
  if (!rawPath) {
    redirect("/");
  }

  redirect(`/?path=${encodeURIComponent(rawPath)}`);
}
