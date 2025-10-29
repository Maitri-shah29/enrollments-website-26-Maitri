import type React from "react";
import Button from "./button";

const NeonSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="w-full border-4 border-[#242527] bg-transparent">
    <div className="border-b-4 border-[#242527] bg-[#242527] px-4 sm:px-6 py-2 text-[#C9EB3E] font-ShareTechMono text-base sm:text-lg">
      {title}
    </div>
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-white leading-relaxed tracking-wide bg-[#16171B] font-ShareTechMono space-y-6">
      {children}
    </div>
  </div>
);

const Interview: React.FC = () => {
  return (
    <>
      <NeonSection title="Interview">
        <p>
          Join our weekly coding competition and test your skills against other
          developers.
        </p>
        <Button label="Register Now"></Button>
      </NeonSection>
    </>
  );
};

export default Interview;
