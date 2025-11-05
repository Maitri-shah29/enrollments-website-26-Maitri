import Image from "next/image";
import Landing from "./components/landing";

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Image
        src="/images/backdrop.jpeg"
        alt="Background"
        fill
        quality={100}
        priority
        className="absolute inset-0 -z-10 object-cover"
      />
      <div className="absolute inset-0 -z-9 bg-white/30" />
      <div className="p-5 h-full w-full flex items-center justify-center">
        <Landing />
      </div>
    </div>
  );
}
