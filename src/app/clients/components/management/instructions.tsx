import Image from "next/image";
import Header from "./header";

export default function Instructions() {
  return (
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-[90%] shadow-lg overflow-hidden">
      <Header />
      <div className="p-10 overflow-y-auto h-full">
        <h1 className="text-2xl sm:text-3xl font-medium text-black text-left mb-8">
          Instructions
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
          <p>Instruction 1</p>
          <p>Instruction 2</p>
          <p>Instruction 3 </p>
        </div>
      </div>
    </div>
  );
}
