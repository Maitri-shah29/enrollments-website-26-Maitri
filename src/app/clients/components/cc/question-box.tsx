export type QuestionBoxProps = {
  subject: string;
  body: string;
};

const QuestionBox = (props: QuestionBoxProps) => {
  return (
    <div className="flex flex-col w-full h-full bg-[#16171B] border-[2px] border-solid border-[#393A3D]">
      <div className="w-full h-12 sm:h-12 flex items-center px-3 border border-solid border-[#393A3D] bg-[#242527] text-[#C9EB3E] font-ShareTechMono text-base sm:text-[20px] font-normal leading-normal">
        {props.subject}
      </div>
      <div className="flex-1 w-full px-3 py-3 hide-scrollbar border-0 focus:ring-0 focus:outline-none text-[#FFF] font-ShareTechMono text-sm sm:text-[16px] font-normal leading-normal resize-none">
        {props.body}
      </div>
    </div>
  );
};

export default QuestionBox;
