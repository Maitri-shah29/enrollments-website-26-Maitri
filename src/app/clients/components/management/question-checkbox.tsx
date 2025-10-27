"use client";

interface Props {
  index: number;
  question: string;
  onClick?: () => void;
}

export const QuestionCheckBox = ({ index, question, onClick }: Props) => {
  return (
    <label
      onClick={onClick}
      className="flex items-start gap-3 w-full cursor-pointer hover:bg-gray-100  rounded-md px-3 py-2"
    >
      {/* Fixed-size checkbox */}
      <input
        type="checkbox"
        className="flex-shrink-0 w-4 h-4 mt-0.5 checked:accent-gray-500 cursor-pointer overflow-hidden"
        readOnly
      />

      <span className="text-sm text-gray-800 overflow-hidden">
        {index + 1}.{" "}
        {question.length > 50 ? question.slice(0, 50) + "..." : question}
      </span>
    </label>
  );
};
