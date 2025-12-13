import Image from "next/image";
import Header from "./header";

interface InstructionsProps {
  onBack?: () => void;
}

export default function Instructions({ onBack }: InstructionsProps) {
  return (
    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col overflow-auto">
      <Header onClick={onBack} />
      <div className="px-10 py-5 overflow-y-auto h-full">
        <h1 className="text-2xl text-black mb-1">Instructions</h1>

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
            Welcome to the first round of ACM-VIT's Management Domain
            selections. First let’s get the instructions out of the way.
            <br />
            &nbsp;1. Answer all the questions of Round 1.
            <br />
            &nbsp;2. Click on "Save Answer" after answering every question, to
            save your response.
            <br />
            &nbsp;3. Click on “Submit Form” after answering and reviewing all
            questions.
            <br />
            In this round, you'll be presented with a series of situational
            questions that assess your management skills and certain quirky
            questions just for our fun!
          </p>
          <p>Good luck!</p>
        </div>
      </div>
    </div>
  );
}
