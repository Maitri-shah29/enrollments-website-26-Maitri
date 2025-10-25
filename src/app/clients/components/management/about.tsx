import Image from "next/image";
import Header from "./header";

export default function About() {
  return (
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-full shadow-lg overflow-y-auto">
      <Header />
      <div className="p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-black text-center mb-8">
          Welcome to ACM&apos;s Management domain
        </h1>

        {/* Email Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Image src="/profile-icon.svg" alt="User" width={50} height={50} />
            <div>
              <p className="text-black font-medium">Mgmt</p>
              <p className="text-sm text-gray-700">
                &lt;loremipsum@gmail.com&gt;
              </p>
              <p className="text-sm text-gray-700">to me ▾</p>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="text-black leading-relaxed space-y-4 text-base">
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
