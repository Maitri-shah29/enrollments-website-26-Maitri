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
            recruitment! In this round, you'll have the opportunity to
            demonstrate your leadership abilities, organizational skills, and
            vision for creating impactful events and initiatives. You'll be
            presented with a series of questions that assess your strategic
            thinking, team coordination capabilities, and understanding of what
            it takes to manage successful communities.
          </p>
          <p>
            Once you've completed all the questions, review your answers
            thoroughly and click submit. We're looking for individuals who
            demonstrate strong communication skills, proactive leadership, and
            the drive to bring people together while executing events and
            projects that make a lasting impact on the ACM-VIT community. Good
            luck!
          </p>
        </div>
      </div>
    </div>
  );
}
