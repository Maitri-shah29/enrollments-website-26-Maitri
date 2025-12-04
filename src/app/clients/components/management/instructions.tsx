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
            The instructions for the Management round are pretty
            straightforward. Answer each question honestly and be true to
            yourself. After answering a question hit the submit button then
            proceed to answering the rest. After all questions have been
            answered, hit the submit form button at the bottom of the page.
          </p>
          <p>
            Remember, there are no right or wrong answers here. We just want to
            get to know you better and see how you think. So, take your time,
            reflect on each question, and provide thoughtful responses. Good
            Luck!
          </p>
        </div>
      </div>
    </div>
  );
}
