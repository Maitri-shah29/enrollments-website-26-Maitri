import React from "react";

export type AnswerBoxProps = {
  subject: string;
  body: string;
};

const AnswerBox = (props: AnswerBoxProps) => {
  return (
    <div className="flex flex-col w-[800px] h-[350px] bg-[#16171B] border-[2px] border-solid border-[#393A3D]">
      <div className="w-full h-[50px] flex items-center px-3 border border-solid border-[#393A3D] bg-[#242527] text-[#C9EB3E] font-ShareTechMono text-[20px] font-normal leading-normal">
        {props.subject}
      </div>
      <textarea
        className="flex-1 w-full px-3 py-3 hide-scrollbar border-0 focus:ring-0 focus:outline-none bg-[#] text-[#FFF] font-ShareTechMono text-[20px] font-normal leading-normal resize-none"
        placeholder="If you write in Python you are not a CP guy"
      >
        {props.body}
      </textarea>
    </div>
  );
};

export default AnswerBox;
