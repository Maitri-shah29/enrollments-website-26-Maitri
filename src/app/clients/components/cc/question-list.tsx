import QuestionListBox from "./question-list-box";

export type CCQuestionListProp = {
  id: string;
  serial: number;
  title: string;
  difficulty: string;
};

const QuestionList = ({
  questions,
  onQuestionSelect,
  activeQuestionId,
}: {
  questions: CCQuestionListProp[];
  onQuestionSelect: (questionId: string) => void;
  activeQuestionId: string | null;
}) => {
  return (
    <div className="flex flex-col min-h-screen overflow-y-scroll hide-scrollbar">
      {questions.map((question) => (
        <QuestionListBox
          key={question.id}
          slNo={question.serial}
          title={question.title}
          difficulty={question.difficulty}
          isActive={activeQuestionId === question.id}
          onClick={() => onQuestionSelect(question.id)}
        />
      ))}
    </div>
  );
};

export default QuestionList;
