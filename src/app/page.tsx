import HomeShell from "./components/home-shell";

type HomePageProps = {
  searchParams?: { path?: string } | Promise<{ path?: string } | undefined>;
};

const decodePath = (value: string) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function Home({ searchParams }: HomePageProps) {
  const isPromise = !!(
    searchParams && typeof (searchParams as any)?.then === "function"
  );

  const params = isPromise
    ? undefined
    : (searchParams as { path?: string } | undefined);

  const initialUrl = decodePath(params?.path ?? "");
  return <HomeShell initialUrl={initialUrl} />;
}
