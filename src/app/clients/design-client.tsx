/*
TODOS
1) Add sign in gaurd if the user is not logged in i think jenifer is working on it's component so it can be resued here
2) add form validation to the text boxes inside questions component i think design questions will only have long answer questions or smth so it shouldnt be too hard 
3) TO BE DISCUSSED WITH SC adding auto save 3 sec debounce iirc they did say yes to it but asking once more wouldnt hurt
4) Adding a varname guard, right now a question with any varname will be rendered, we can hardcode a list of allowed varnames inside question submission so stoopid questions dont get rendered 
*/
"use client";
import type { Response } from "@prisma/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import createFormSubmission from "../actions/create-form-submission";
import ensureRoundUser from "../actions/ensure-round-user";
import fetchFormResponses from "../actions/fetch-form-responses";
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
  const [roundUserId, setRoundUserId] = useState<string | null>(null);
  const [formSubmissionId, setFormSubmissionId] = useState<string | null>(null);
  const [savedResponses, setSavedResponses] = useState<Response[]>([]);

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

  // get questions from the form round
  const formQuestions = formRound?.Question || [];

  useEffect(() => {
    const setupFormData = async () => {
      if (!formRound) return;

      try {
        // Ensure round user
        const roundUserResult = await ensureRoundUser(formRound.id);
        if (!("success" in roundUserResult) || !roundUserResult.success) {
          console.error("Failed to ensure round user:", roundUserResult);
          return;
        }
        setRoundUserId(roundUserResult.roundUserId);
        console.log("Round user ensured:", roundUserResult.roundUserId);

        // create/fetch form submission
        const formSubmissionResult = await createFormSubmission(formRound.id);
        if (
          !("success" in formSubmissionResult) ||
          !formSubmissionResult.formSubmission
        ) {
          console.error(
            "Failed to create form submission:",
            formSubmissionResult,
          );
          return;
        }
        setFormSubmissionId(formSubmissionResult.formSubmission.id);
        console.log(
          "Form submission created/fetched:",
          formSubmissionResult.formSubmission.id,
        );

        // fetch saved responses from db
        const responsesResult = await fetchFormResponses(
          formSubmissionResult.formSubmission.id,
        );
        if ("responses" in responsesResult && responsesResult.responses) {
          setSavedResponses(responsesResult.responses);
          console.log("Loaded saved responses:", responsesResult.responses);
        } else {
          console.error("Failed to fetch responses:", responsesResult);
        }
      } catch (error) {
        console.error("Error setting up form data:", error);
      }
    };

    setupFormData();
  }, [formRound]);

  return (
    <div className="flex flex-col w-full h-full border border-black text-white figma-cursor">
      <Image
        src="/images/design/background.svg"
        alt="About Design"
        width={1920}
        height={1080}
        className="w-full h-full object-cover absolute top-0 left-0"
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
        disableQuestions={isLoading || !formSubmissionId}
      />
      <div
        key={selectedPanel}
        className="flex overflow-y-auto z-10 animate-panel-transition [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {selectedPanel === "Home" && <Home />}
        {selectedPanel === "About" && <About />}
        {selectedPanel === "Instructions" && <Instructions />}
        {selectedPanel === "AOIs" && <AOIs />}
        {selectedPanel === "Questions" &&
          !isLoading &&
          formRound &&
          formSubmissionId && (
            <Questions
              questions={formQuestions}
              roundId={formRound.id}
              formSubmissionId={formSubmissionId}
              savedResponses={savedResponses}
            />
          )}
        {selectedPanel === "Interview" && <Interview />}
      </div>
    </div>
  );
};

export default DesignClient;
