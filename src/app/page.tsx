import Landing from "./components/landing";
import { SessionProvider } from "./components/session-provider";

export default function Home() {
  return (
    <div className="w-screen h-screen">
      <SessionProvider>
        <Landing />
      </SessionProvider>
    </div>
  );
}
