import QuestionListBox from "./question-list-box";

export type CCQuestionListProp = {
  id: string;
  serial: number;
  title: string;
  difficulty: string;
};

const sampleQuestions: CCQuestionListProp[] = [
  { id: "q_123", serial: 1, title: "Two Sum Problem", difficulty: "Easy" },
  {
    id: "q_456",
    serial: 2,
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
  },
  { id: "q_789", serial: 3, title: "N-Queens Solver", difficulty: "Hard" },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
  {
    id: "q_012",
    serial: 4,
    title: "Implement Stack using Queues",
    difficulty: "Easy",
  },
];

const QuestionList = ({
  questions = sampleQuestions,
}: {
  questions?: CCQuestionListProp[];
} = {}) => {
  return (
    <div className="flex flex-col h-60 overflow-y-scroll hide-scrollbar">
      {questions.map((question) => (
        <QuestionListBox
          key={question.id}
          slNo={question.serial}
          title={question.title}
          difficulty={question.difficulty}
        />
      ))}
    </div>
  );
};

export default QuestionList;
