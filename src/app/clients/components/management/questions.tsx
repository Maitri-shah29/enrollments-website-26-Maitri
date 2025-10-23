import { QuestionCheckBox } from "./questionCheckBox";

interface Props {
  questions: string[];
}

export default function Questions({ questions }: Props) {
  return (
    <div className="relative bg-white/50 backdrop-blur-md rounded-2xl p-10 min-w-[90%] h-full shadow-lg overflow-y-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-left text-black text-center mb-8">
        Questions
      </h1>
      {/* Dynamic Content */}
      <div className="relativetext-black leading-relaxed space-y-4 text-base max-h-full">
        <ul className="space-y-4">
          {questions.map((question, index) => (
            <li key={question}>
              <QuestionCheckBox
                question={question}
                index={index}
              ></QuestionCheckBox>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
