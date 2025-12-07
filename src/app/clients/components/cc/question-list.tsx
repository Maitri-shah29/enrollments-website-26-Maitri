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
  responses,
}: {
  questions: CCQuestionListProp[];
  onQuestionSelect: (questionId: string) => void;
  activeQuestionId: string | null;
  responses?: Record<string, string>;
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto hide-scrollbar">
      {questions.map((question) => (
        <QuestionListBox
          key={question.id}
          slNo={question.serial}
          title={question.title}
          difficulty={question.difficulty}
          isActive={activeQuestionId === question.id}
          hasResponse={!!responses?.[question.id]?.trim()}
          onClick={() => onQuestionSelect(question.id)}
        />
      ))}
    </div>
  );
};

export default QuestionList;
