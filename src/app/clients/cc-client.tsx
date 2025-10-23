import CCNavBar from "./components/cc/navbar";
import QuestionList from "./components/cc/question-list";

export default function CCClient() {
  return (
    <div className="bg-[#16171B] w-full h-full">
      <CCNavBar></CCNavBar>
      <QuestionList></QuestionList>
    </div>
  );
}
