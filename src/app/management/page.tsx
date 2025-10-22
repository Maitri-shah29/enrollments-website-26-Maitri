"use client";
import Image from "next/image";

export default function Management() {
  return (
    <div
      className="min-h-screen flex flex-row bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/red-pattern.jpg')" }}
    >
      {/* Sidebar */}
      <aside className="flex flex-col min-h-screen w-[20vw] p-8 text-white">
        <Image
          src="/acmviticon.svg"
          alt="ACM VIT icon"
          width={150}
          height={150}
          className="mb-8"
        />

        <nav className="flex flex-col space-y-4 text-lg">
          <button
            type="button"
            className="active:bg-white/50 active:shadow-md active:text-black font-medium hover:text-gray-200 rounded-xl px-6 py-2 text-left "
          >
            About
          </button>
          <button
            type="button"
            className="active:bg-white/50 active:shadow-md active:text-black font-medium hover:text-gray-200 rounded-xl px-6 py-2 text-left"
          >
            What we do
          </button>
          <button
            type="button"
            className="active:bg-white/50 active:shadow-md active:text-black font-medium hover:text-gray-200 rounded-xl px-6 py-2 text-left"
          >
            Instructions
          </button>
          <button
            type="button"
            className="active:bg-white/50 active:shadow-md active:text-black font-medium hover:text-gray-200 rounded-xl px-6 py-2 text-left"
          >
            Round 1
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-10">
        <div className="relative bg-white/50 backdrop-blur-md rounded-2xl p-10 w-[90%] h-[90%] shadow-lg">
          {/* Back Arrow */}

          {/* Header */}
          <h1 className="text-2xl sm:text-3xl font-bold text-left text-black text-center mb-8">
            Welcome to ACM&apos;s Management domain
          </h1>

          {/* Email Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Image
                src="/profile-icon.svg"
                alt="User"
                width={50}
                height={50}
              />

              <div>
                <p className="text-black font-medium">Mgmt</p>
                <p className="text-sm text-gray-700">
                  &lt;loremipsum@gmail.com&gt;
                </p>
                <p className="text-sm text-gray-700">to me ▾</p>
              </div>
            </div>
          </div>

          {/* Email Body */}
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
              We ensure every aspect of an event is handled with finesse,
              whether it&apos;s securing sponsorships, coordinating logistics or
              crafting engaging content. We handle the behind-the-scenes madness
              so that ACM events aren&apos;t just good but unforgettable. If an
              event feels smooth, well-organized and just right, you can bet we
              had something to do with it.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
