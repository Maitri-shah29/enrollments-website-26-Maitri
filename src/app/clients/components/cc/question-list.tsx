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
  currentResponses,
  questionsWithUnsavedEdits,
}: {
  questions: CCQuestionListProp[];
  onQuestionSelect: (questionId: string) => void;
  activeQuestionId: string | null;
  responses?: Record<string, string>;
  currentResponses?: Record<string, string>;
  questionsWithUnsavedEdits?: Set<string>;
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto hide-scrollbar">
      {questions.map((question) => {
        const hasSavedResponse = !!responses?.[question.id]?.trim();
        const hasUnsavedEdit =
          questionsWithUnsavedEdits?.has(question.id) || false;
        const isDone = hasSavedResponse && !hasUnsavedEdit;
        return (
          <QuestionListBox
            key={question.id}
            slNo={question.serial}
            title={question.title}
            difficulty={question.difficulty}
            isActive={activeQuestionId === question.id}
            hasResponse={isDone}
            onClick={() => onQuestionSelect(question.id)}
          />
        );
      })}
    </div>
  );
};

export default QuestionList;
