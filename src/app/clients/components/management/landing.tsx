"use client";
import Image from "next/image";

type ManagementLandingProps = {
  onGetStarted: () => void;
};

const ManagementLanding = ({ onGetStarted }: ManagementLandingProps) => {
  return (
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-[90%] shadow-lg overflow-y-auto">
      <div className="w-full mt-4">
        <div className="p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-black text-center mb-8">
            WELCOME
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

          <div className="text-black leading-relaxed space-y-4 text-base">
            <p>You've recieved a mail from Management.</p>
          </div>

          {/* Get Started Button */}
          <div className="w-full mt-8 flex justify-start">
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
