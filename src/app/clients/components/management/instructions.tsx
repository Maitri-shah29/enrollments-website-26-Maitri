import Image from "next/image";
import Header from "./header";

export default function Instructions() {
  return (
    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl w-[100%] h-[90%] shadow-lg flex flex-col overflow-auto">
      <Header />
      <div className="px-10 py-5 overflow-y-auto h-full">
        <h1 className="text-2xl text-black mb-1">Instructions</h1>

        {/* Email Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Image src="/profile-icon.svg" alt="User" width={40} height={40} />
            <div>
              <p className="text-black font-medium text-sm">Management</p>
              <p className="text-xs text-gray-700">
                &lt;loremipsum@acmvit.in&gt;
              </p>
              <p className="text-xs text-gray-700">to me ▾</p>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="text-black leading-relaxed space-y-4 text-base mt-5">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus
            ipsum mauris, cursus a ullamcorper sit amet, efficitur bibendum dui.
            Donec facilisis justo eget nisi eleifend, a bibendum velit rhoncus.
            Cras a nisl a odio euismod id, accumsan ac nisl. Aenean imperdiet
            velit in justo volutpat feugiat. Proin quis gravida turpis.
            Vestibulum felis purus, sodales non mi id, vulputate auctor sapien.
            Vestibulum vel dolor nunc. Orci varius natoque penatibus et magnis
            dis parturient montes, nascetur ridiculus mus.
          </p>
        </div>
      </div>
    </div>
  );
}
