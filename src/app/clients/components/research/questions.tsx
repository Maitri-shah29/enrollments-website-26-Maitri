"use client";
import type React from "react";
import { useState } from "react";

interface Question {
  header: string;
  content: string;
}

interface AOIData {
  header: string;
  questions: Question[];
}

interface QuestionsProps {
  selectedAOI?: string;
  selectedQuestionIdx?: number;
  onAOIChange?: (aoi: string) => void;
  onQuestionChange?: (idx: number) => void;
}

const Questions: React.FC<QuestionsProps> = ({
  selectedAOI: propSelectedAOI = "Blockchain",
  selectedQuestionIdx: propSelectedQuestionIdx = 0,
  onAOIChange,
  onQuestionChange,
}) => {
  const aoiData: AOIData[] = [
    {
      header: "Blockchain",
      questions: [
        {
          header: "Question 1",
          content: "What is a blockchain and how does it work?",
        },
        {
          header: "Question 2",
          content: "Explain the concept of consensus mechanisms.",
        },
        {
          header: "Question 3",
          content: "What is the difference between Bitcoin and Ethereum?",
        },
        {
          header: "Question 4",
          content: "Describe what a smart contract is.",
        },
        {
          header: "Question 5",
          content: "What is cryptocurrency and its role in blockchain?",
        },
        {
          header: "Question 6",
          content: "Explain public and private blockchains.",
        },
        {
          header: "Question 7",
          content: "What is proof of work?",
        },
        {
          header: "Question 8",
          content: "Describe the concept of distributed ledger technology.",
        },
        {
          header: "Question 9",
          content:
            "What are the applications of blockchain beyond cryptocurrency?",
        },
        {
          header: "Question 10",
          content: "Explain the trilemma in blockchain design.",
        },
      ],
    },
    {
      header: "Quantum Computing",
      questions: [
        {
          header: "Question 1",
          content:
            "What is quantum computing and how does it differ from classical computing?",
        },
        {
          header: "Question 2",
          content: "Explain quantum bits (qubits) and superposition.",
        },
        {
          header: "Question 3",
          content: "What is quantum entanglement?",
        },
        {
          header: "Question 4",
          content: "Describe quantum gates and their functions.",
        },
        {
          header: "Question 5",
          content: "What is quantum error correction?",
        },
        {
          header: "Question 6",
          content: "Explain Shor's algorithm and its significance.",
        },
        {
          header: "Question 7",
          content: "What are quantum simulators?",
        },
        {
          header: "Question 8",
          content: "Describe the challenges in building quantum computers.",
        },
        {
          header: "Question 9",
          content: "What are the potential applications of quantum computing?",
        },
        {
          header: "Question 10",
          content: "Explain decoherence in quantum systems.",
        },
      ],
    },
    {
      header: "AI/ML",
      questions: [
        {
          header: "Question 1",
          content:
            "What is the difference between machine learning and deep learning?",
        },
        {
          header: "Question 2",
          content: "Explain supervised and unsupervised learning.",
        },
        {
          header: "Question 3",
          content: "What are neural networks and how do they work?",
        },
        {
          header: "Question 4",
          content: "Describe the backpropagation algorithm.",
        },
        {
          header: "Question 5",
          content: "What are convolutional neural networks (CNNs)?",
        },
        {
          header: "Question 6",
          content: "Explain recurrent neural networks (RNNs).",
        },
        {
          header: "Question 7",
          content: "What is transfer learning?",
        },
        {
          header: "Question 8",
          content: "Describe the concepts of overfitting and underfitting.",
        },
        {
          header: "Question 9",
          content: "What are attention mechanisms?",
        },
        {
          header: "Question 10",
          content: "Explain transformer models and their significance.",
        },
      ],
    },
    {
      header: "BioInformatics",
      questions: [
        {
          header: "Question 1",
          content: "What is bioinformatics and its importance?",
        },
        {
          header: "Question 2",
          content: "Explain DNA sequencing and its applications.",
        },
        {
          header: "Question 3",
          content: "What is genome assembly?",
        },
        {
          header: "Question 4",
          content: "Describe protein structure prediction.",
        },
        {
          header: "Question 5",
          content: "What is sequence alignment?",
        },
        {
          header: "Question 6",
          content: "Explain BLAST and its use in bioinformatics.",
        },
        {
          header: "Question 7",
          content: "What are phylogenetic trees?",
        },
        {
          header: "Question 8",
          content: "Describe gene expression analysis.",
        },
        {
          header: "Question 9",
          content: "What is structural bioinformatics?",
        },
        {
          header: "Question 10",
          content:
            "Explain the applications of machine learning in drug discovery.",
        },
      ],
    },
    {
      header: "Cyber Security",
      questions: [
        {
          header: "Question 1",
          content: "What are the main types of cyber attacks?",
        },
        {
          header: "Question 2",
          content: "Explain encryption and its types.",
        },
        {
          header: "Question 3",
          content: "What is a firewall and how does it work?",
        },
        {
          header: "Question 4",
          content:
            "Describe the difference between authentication and authorization.",
        },
        {
          header: "Question 5",
          content: "What is a VPN and its importance?",
        },
        {
          header: "Question 6",
          content: "Explain penetration testing.",
        },
        {
          header: "Question 7",
          content: "What is malware and its classifications?",
        },
        {
          header: "Question 8",
          content: "Describe SSL/TLS protocols.",
        },
        {
          header: "Question 9",
          content: "What is network segmentation?",
        },
        {
          header: "Question 10",
          content: "Explain zero-day vulnerabilities and their implications.",
        },
      ],
    },
    {
      header: "IoT",
      questions: [
        {
          header: "Question 1",
          content: "What is the Internet of Things (IoT) and its applications?",
        },
        {
          header: "Question 2",
          content: "Explain IoT architecture and its layers.",
        },
        {
          header: "Question 3",
          content: "What are IoT protocols and communication standards?",
        },
        {
          header: "Question 4",
          content: "Describe MQTT and its use in IoT.",
        },
        {
          header: "Question 5",
          content: "What are IoT sensors and actuators?",
        },
        {
          header: "Question 6",
          content: "Explain edge computing in IoT systems.",
        },
        {
          header: "Question 7",
          content: "What is IoT security and its challenges?",
        },
        {
          header: "Question 8",
          content: "Describe smart homes and their implementation.",
        },
        {
          header: "Question 9",
          content: "What is industrial IoT (IIoT)?",
        },
        {
          header: "Question 10",
          content: "Explain the role of 5G in IoT.",
        },
      ],
    },
  ];

  const selectedAOI = propSelectedAOI;
  const selectedQuestionIdx = propSelectedQuestionIdx;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastSubmittedAnswers, setLastSubmittedAnswers] = useState<
    Record<string, string>
  >({});
  const [justSubmitted, setJustSubmitted] = useState<Record<string, boolean>>(
    {},
  );
  const [isFocused, setIsFocused] = useState(false);

  const currentAOI =
    aoiData.find((aoi) => aoi.header === selectedAOI) ?? aoiData[0];
  const safeIndex =
    selectedQuestionIdx >= 0 &&
    selectedQuestionIdx < currentAOI.questions.length
      ? selectedQuestionIdx
      : 0;
  const currentQuestion = currentAOI.questions[safeIndex];

  const getAnswerKey = () => `${currentAOI.header}-Q${safeIndex + 1}`;
  const currentAnswer = answers[getAnswerKey()] || "";
  const lastSubmitted = lastSubmittedAnswers[getAnswerKey()] || "";
  const isJustSubmitted = justSubmitted[getAnswerKey()] || false;

  const hasChangedSinceSubmit = currentAnswer !== lastSubmitted;

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [getAnswerKey()]: value,
    }));
    if (isJustSubmitted) {
      setJustSubmitted((prev) => ({
        ...prev,
        [getAnswerKey()]: false,
      }));
    }
  };

  const handleSubmit = () => {
    if (currentAnswer.trim()) {
      setJustSubmitted((prev) => ({
        ...prev,
        [getAnswerKey()]: true,
      }));
      setLastSubmittedAnswers((prev) => ({
        ...prev,
        [getAnswerKey()]: currentAnswer,
      }));
      console.log("Submitted answer:", currentAnswer);
    }
  };

  const canSubmit =
    currentAnswer.trim() && (!isJustSubmitted || hasChangedSinceSubmit);
  const buttonText =
    isJustSubmitted && !hasChangedSinceSubmit ? "Submitted" : "Submit";
  const buttonColor = canSubmit ? "#7D5BED" : "#4A4A4A";

  return (
    <div className="w-full h-full bg-[#1a1a1a] p-6 overflow-hidden flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-white break-words leading-tight font-bold text-[18px]">
          Question {safeIndex + 1}: {currentQuestion?.content}
        </h1>
      </div>

      <div className="h-full flex flex-col">
        <div className="relative h-full">
          <div
            className="relative h-full rounded-lg p-4 transition-colors"
            style={{
              border: `2px solid ${isFocused ? "#7D5BED" : "#C8B7FF"}`,
            }}
          >
            <button
              type="button"
              aria-label="Edit"
              className="absolute right-4 top-4 z-10 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Edit icon"
              >
                <title>Edit</title>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            <textarea
              className="
                w-full 
                h-full 
                bg-transparent 
                text-white 
                leading-normal
                resize-none 
                outline-none 
                border-none
                p-0
                placeholder-gray-500
                selection:bg-[#7D5BED]
              "
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        </div>

        <div className="flex justify-end flex-shrink-0 mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`text-white font-medium transition-all duration-200 w-45 h-10 rounded-md bg-[${buttonColor}] border-1 hover:cursor-pointer`}
            style={{
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Questions;
