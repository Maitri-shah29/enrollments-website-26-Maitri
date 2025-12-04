import Image from "next/image";
import Header from "./header";

interface AboutProps {
  onBack?: () => void;
}

export default function About({ onBack }: AboutProps) {
  return (
    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col overflow-auto">
      <Header onClick={onBack} />
      <div className="px-10 py-5 overflow-y-auto h-full">
        <h1 className="text-2xl text-black mb-1">About</h1>

        {/* Email Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Image src="/profile-icon.svg" alt="User" width={40} height={40} />
            <div>
              <p className="text-black font-medium text-sm">Management</p>
              <p className="text-xs text-gray-700">
                &lt;management@acmvit.in&gt;
              </p>
              <p className="text-xs text-gray-700">to me ▾</p>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="text-black leading-relaxed space-y-4 text-base mt-5">
          <p>
            Welcome to ACM&apos;s (and everyone&apos;s favourite) Management
            domain, the extroverts of the club.
          </p>
          <p>
            We&apos;re the ones who take up big ideas and turn them into
            well-executed events. From brainstorming and ideating to the final
            wrap-up, we make sure everything goes smoothly.
          </p>
          <p>
            The Management team oversees the planning, coordination, and
            execution of all major events and initiatives. From ideation to
            implementation, management ensures every event runs smoothly while
            maintaining high quality and engaging content. Learn how to
            collaborate on sponsorships, logistics, content creation, and event
            promotion to bring ACM's vision to life.
          </p>
          <p>
            We ensure every aspect of an event is handled with finesse, whether
            it&apos;s securing sponsorships, coordinating logistics or crafting
            engaging content. We handle the behind-the-scenes madness so that
            ACM events aren&apos;t just good but unforgettable. If an event
            feels smooth, well-organized and just right, you can bet we had
            something to do with it.
          </p>
        </div>
      </div>
    </div>
  );
}
