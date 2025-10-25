import { Reply } from "lucide-react";
import Image from "next/image";
import Header from "./header";

export default function QuestionBox() {
  return (
    <div className="relative bg-white opacity-[70%] backdrop-blur-md rounded-2xl w-[90%] h-full shadow-lg overflow-y-auto">
      <Header />
      <div className="p-10">
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

        <p className="text-xl text-black mb-8">
          if you could be a different animal in a different universe what
          difference would you make?????? think deeply before you answer lorem
          ipsum loren ipsumy ydyayayay if you could be a different animal in a
          different universe what difference would you make?????? think deeply
          before you answer lorem ipsum loren ipsumy ydyayayay if you could be a
          different animal in a different universe what difference would you
          make?????? think deeply before you answer lorem ipsum loren ipsumy
          ydyayayay if you could be a different animal in a different universe
          what difference would you make?????? think deeply before you answer
          lorem ipsum loren ipsumy ydyayayay
        </p>

        {/* Answer Box */}
        <div className="bg-[#D9D9D9] rounded-2xl p-5 space-y-3">
          <div className="flex items-center text-sm text-gray-700 space-x-2">
            <Reply size={16} />
            <p>
              mgmt(ew-management@acm.org) -{" "}
              <span className="text-gray-500 italic">Saved draft</span>
            </p>
          </div>
          <textarea
            className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-gray-500 text-black"
            rows={6}
            placeholder="type your answer..."
          />
        </div>
      </div>
    </div>
  );
}
