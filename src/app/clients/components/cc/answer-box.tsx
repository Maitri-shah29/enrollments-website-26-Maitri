export type AnswerBoxProps = {
  id?: string;
  subject: string;
  body: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

const AnswerBox = (props: AnswerBoxProps) => {
  return (
    <div className="flex flex-col w-full h-full bg-[#16171B] border-[2px] border-solid border-[#393A3D]">
      <div className="w-full h-[50px] flex items-center px-3 border border-solid border-[#393A3D] bg-[#242527] text-[#C9EB3E] font-ShareTechMono text-[20px] font-normal leading-normal">
        {props.subject}
      </div>
      <textarea
        id={props.id}
        className="flex-1 w-full px-3 py-3 hide-scrollbar border-0 focus:ring-0 focus:outline-none bg-[#16171B] text-[#FFF] font-ShareTechMono text-[20px] font-normal leading-normal resize-none"
        placeholder={
          props.placeholder || "Enter your subjective answer here..."
        }
        value={props.value || ""}
        onChange={(e) => props.onChange?.(e.target.value)}
        disabled={props.disabled}
      />
    </div>
  );
};

export default AnswerBox;
