"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import fetchRound, {
  type RoundWithRelations,
} from "../actions/fetch-round-details";
import About from "./components/design/about";
import AOIs from "./components/design/aoi";
import DesignNavbar from "./components/design/design-navbar";
import Home from "./components/design/home";
import Instructions from "./components/design/instructions";
import Interview from "./components/design/interview";
import Questions from "./components/design/questions";

const DesignClient = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");
  const [rounds, setRounds] = useState<RoundWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDesignRounds = async () => {
      try {
        setIsLoading(true);
        const roundsData = await fetchRound("design");
        if (!("error" in roundsData)) {
          setRounds(roundsData);
          console.log("Design rounds:", roundsData);
        } else {
          console.error("Error fetching rounds:", roundsData.error);
        }
      } catch (error) {
        console.error("Failed to fetch design rounds:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesignRounds();
  }, []);

  // active form round
  const formRound = rounds.find(
    (round) => round.type === "form" && round.active && round.number === 1,
  );

  // Get questions from the form round
  const formQuestions = formRound?.Question || [];

  return (
    <div className="flex flex-col w-full h-full border border-black text-white">
      <Image
        src="/images/design/background.svg"
        alt="About Design"
        width={1920}
        height={1080}
        className="w-full h-full object-cover absolute top-0"
      />
      <Image
        src="/images/design/acmlogo.svg"
        alt="About Design"
        width={400}
        height={400}
        className="w-[15vw] object-cover absolute top-5 left-5 z-30"
      />

      <DesignNavbar
        selected={selectedPanel}
        onSelect={setSelectedPanel}
        disableQuestions={isLoading}
      />
      <div className="flex overflow-y-auto z-10">
        {selectedPanel === "Home" && <Home />}
        {selectedPanel === "About" && <About />}
        {selectedPanel === "Instructions" && <Instructions />}
        {selectedPanel === "AOIs" && <AOIs />}
        {selectedPanel === "Questions" && !isLoading && formRound && (
          // pass formquestions and roundId as props
          <Questions questions={formQuestions} roundId={formRound.id} />
        )}
        {selectedPanel === "Interview" && <Interview />}
      </div>
    </div>
  );
};

export default DesignClient;
