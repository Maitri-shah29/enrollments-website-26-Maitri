"use client";
import { useEffect, useState } from "react";
import { DOMAIN_CAP } from "@/lib/constants";
import createRoundUser from "../actions/create-round-user";
import About from "./components/cc/about";
import Contest from "./components/cc/contest";
import Instructions from "./components/cc/instructions";
import Interview from "./components/cc/interview";
import Homepage from "./components/cc/landing";
import CCNavBar from "./components/cc/navbar";
import Questions, { type RoundUserExtended } from "./components/cc/questions";

type CCClientProps = {
  initialRoundUser?: RoundUserExtended | null;
  roundUserCount: number;
};

const Page = ({ initialRoundUser, roundUserCount }: CCClientProps) => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");
  const [roundUser, setRoundUser] = useState<RoundUserExtended | null>(
    initialRoundUser ?? null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [savedResponses, setSavedResponses] = useState<Record<string, string>>(
    {},
  );
  const [questionsWithUnsavedEdits, setQuestionsWithUnsavedEdits] = useState<
    Set<string>
  >(new Set());
  const [formSubmissionId, setFormSubmissionId] = useState<string | null>(null);
  const roundHidden = !!roundUser?.round?.hidden;

  // Create/fetch round user on demand (Get Started)
  const continueCheck = () => {
    if (roundUserCount >= DOMAIN_CAP) {
      setError(
        `You have already enrolled in ${roundUserCount} domains. Maximum is ${DOMAIN_CAP}.`,
      );
      setLoading(false);
      return;
    }
    setSelectedPanel("About");
  };
  const initializeRoundUser = async () => {
    setLoading(true);
    setError(null);
    // console.log(await createRoundUser(Domain.cc));
    if (roundUserCount >= DOMAIN_CAP) {
      setError(
        `You have already enrolled in ${roundUserCount} domains. Maximum is ${DOMAIN_CAP}.`,
      );
      setLoading(false);
      return;
    }
    try {
      const result = await createRoundUser("cc");
      console.log(result);

      if ("error" in result) {
        if (result.error === "Round is not active") {
          setError("Selections for this domain haven't started yet");
        } else if (result.error === "No form round found for this domain") {
          setError("This domain is not available for selection at the moment");
        } else if (result.error === "Internal server error") {
          setError("Something went wrong. Please try again later");
        } else {
          setError(result.error ?? "Unknown error");
        }
        return;
      }

      setRoundUser(result.roundUser as RoundUserExtended);
      setSelectedPanel("About");
    } catch (err) {
      console.error("Error initializing round user:", err);

      setError(
        err instanceof Error ? err.message : "Failed to initialize round user",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    //console.log(roundUser);

    if (!roundUser?.formSubmission) return;

    const currentFsId = roundUser.formSubmission.id;

    if (formSubmissionId !== currentFsId) {
      const initial: Record<string, string> = {};
      const saved: Record<string, string> = {};
      const serverResponses = roundUser.formSubmission.responses ?? [];
      serverResponses.forEach((r) => {
        if (r.response) {
          initial[r.questionId] = r.response;
          saved[r.questionId] = r.response;
        }
      });
      setResponses(initial);
      setSavedResponses(saved);
      setFormSubmissionId(currentFsId);
    }
  }, [roundUser?.formSubmission, formSubmissionId]);

  return (
    <div className="w-full h-full relative overflow-y-auto">
      {/* Error Popup */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121216] border-2 border-[#C9EB3E] rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-[#C9EB3E] text-2xl font-ShareTechMono mb-4">
              Oops!
            </h3>
            <p className="text-white text-lg mb-6">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="w-full px-6 py-2 bg-[#C9EB3E] text-[#121216] font-ShareTechMono font-medium hover:bg-[#b8d938] transition-colors rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="absolute top-[1.2rem] left-0 w-full z-20 flex items-center justify-between">
        <CCNavBar
          selected={selectedPanel}
          onSelect={setSelectedPanel}
          disabled={!roundUser}
          roundHidden={roundHidden}
          roundUserCount={roundUserCount}
          roundUser={roundUser}
        />
      </div>
      {selectedPanel === "Home" && (
        <Homepage
          onGetStarted={initializeRoundUser}
          loading={loading}
          hasRoundUser={!!roundUser}
          onContinue={continueCheck}
        />
      )}
      {selectedPanel !== "Home" && (
        <div className="w-full min-h-full bg-[#121216] pt-28 pb-16">
          <div className="w-full space-y-8 md:px-6 lg:px-11 xl:px-15 2xl:px-20 mt-[45px]">
            {selectedPanel === "Questions" ? (
              <Questions
                roundUser={roundUser ?? undefined}
                loading={loading}
                error={error}
                responses={responses}
                setResponses={setResponses}
                savedResponses={savedResponses}
                setSavedResponses={setSavedResponses}
                questionsWithUnsavedEdits={questionsWithUnsavedEdits}
                setQuestionsWithUnsavedEdits={setQuestionsWithUnsavedEdits}
              />
            ) : (
              <>
                {selectedPanel === "About" && <About />}
                {selectedPanel === "Instructions" && <Instructions />}
                {selectedPanel === "Contest" && <Contest />}
                {selectedPanel === "Interview" && <Interview />}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
