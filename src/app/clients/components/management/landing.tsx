"use client";
import Image from "next/image";
import Header from "./header";

type ManagementLandingProps = {
  onGetStarted: () => void;
  wallpaper: string;
  loading?: boolean;
};

const ManagementLanding = ({
  onGetStarted,
  wallpaper,
  loading = false,
}: ManagementLandingProps) => {
  const buttonColors: Record<string, string> = {
    "big sur": "bg-[#AD3232] hover:bg-[#AD3232]/70",
    sequoia: "bg-[#2E4A7A] hover:bg-[#2E4A7A]/70",
    sonoma: "bg-[#005B23] hover:bg-[#005B23]/70",
  };

  return (
    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col overflow-auto">
      <Header />
      <div className="flex flex-col flex-1 px-10 pt-5 pb-3 space-y-6">
        <div>
          <h1 className="text-2xl text-black mb-1">
            Welcome to ACM's Management Domain
          </h1>

          {/* Email Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Image
                src="/profile-icon.svg"
                alt="User"
                width={40}
                height={40}
              />
              <div>
                <p className="text-black font-medium text-sm">Management</p>
                <p className="text-xs text-gray-700">
                  &lt;management@acmvit.in&gt;
                </p>
                <p className="text-xs text-gray-700">to me ▾</p>
              </div>
            </div>
          </div>

          <div className="text-black leading-relaxed space-y-4 text-base mb-3">
            <p>You've received a mail from Management.</p>
          </div>

          <div className="w-full flex justify-center">
            <div className="w-full max-w-4xl">
              <Image
                src="/images/management/banner.svg"
                alt="Management Banner"
                width={1200}
                height={400}
                className="w-full h-auto object-contain rounded-lg shadow-md"
                priority
              />
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center mt-auto">
          <button
            type="button"
            onClick={onGetStarted}
            disabled={loading}
            className={`
    ${buttonColors[wallpaper] || buttonColors.default}
    text-white font-bold py-3 px-8 rounded-lg
    shadow-md hover:shadow-lg transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
  `}
          >
            {loading ? "Loading..." : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagementLanding;
