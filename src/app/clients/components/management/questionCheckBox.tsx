"use client";
interface Props {
  index: number;
  question: string;
}
export const QuestionCheckBox = ({ index, question }: Props) => {
  return (
    <div>
      <label className="custom-checkbox">
        <input type="checkbox" defaultChecked readOnly></input>
        <span>
          {index + 1}. {question}
        </span>
      </label>
    </div>
  );
};
