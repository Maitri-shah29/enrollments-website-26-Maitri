const NeonSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="w-full border-4 border-[#242527] bg-transparent">
    <div className="border-b-4 border-[#242527] bg-[#242527] px-4 sm:px-6 py-2 text-[#C9EB3E] font-ShareTechMono text-base sm:text-lg">
      {title}
    </div>
    <div className="px-5 py-6 text-white leading-relaxed tracking-wide bg-[#16171B] font-ShareTechMono space-y-10">
      {children}
    </div>
  </div>
);

export default NeonSection;
