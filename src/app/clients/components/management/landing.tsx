"use client";
import Image from "next/image";

type ManagementLandingProps = {
  onGetStarted: () => void;
};

const ManagementLanding = ({ onGetStarted }: ManagementLandingProps) => {
  return (
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-[90%] shadow-lg overflow-y-auto px-6">
      <div className="w-full mt-4">
        <div className="">
          <h1 className="text-2xl text-black mb-5">
            Welcome to ACM's Management Domain
          </h1>

          <div className="flex items-center justify-between mb-5">
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

          <Image
            src="/images/banner.svg"
            alt="Banner"
            width={1920}
            height={1080}
          />

          <div className="w-full mt-5 flex justify-center">
            <button
              type="button"
              onClick={onGetStarted}
              className="bg-[#AD3232CC] text-white hover:bg-[#AD3232CC]/70 font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementLanding;
