"use client";
import { useEffect, useState } from "react";
import About from "./components/cc/about";
import Contest from "./components/cc/contest";
import Instructions from "./components/cc/instructions";
import Interview from "./components/cc/interview";
import Homepage from "./components/cc/landing";
import CCNavBar from "./components/cc/navbar";
import Questions, { type RoundUserExtended } from "./components/cc/questions";

type CCClientProps = {
  initialRoundUser?: RoundUserExtended | null;
};

const Page = ({ initialRoundUser }: CCClientProps) => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");
  const [roundUser, setRoundUser] = useState<RoundUserExtended | null>(
    initialRoundUser ?? null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [formSubmissionId, setFormSubmissionId] = useState<string | null>(null);
  const roundHidden = !!roundUser?.round?.hidden;

  // Create/fetch round user on demand (Get Started)
  const initializeRoundUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/round-user?domain=cc");
      if (!res.ok) throw new Error("Failed to initialize round user");
      const data = await res.json();

      if (data && typeof data === "object" && !Array.isArray(data)) {
        setRoundUser(data as RoundUserExtended);
      } else if (Array.isArray(data) && data.length > 0) {
        // Fallback if API still returns array
        setRoundUser(data[0] as RoundUserExtended);
      } else {
        setRoundUser(null);
        throw new Error("No round user returned");
      }

      // Move to About after initialization
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
      const serverResponses = roundUser.formSubmission.responses ?? [];
      serverResponses.forEach((r) => {
        if (r.response) initial[r.questionId] = r.response;
      });
      setResponses(initial);
      setFormSubmissionId(currentFsId);
    }
  }, [roundUser?.formSubmission, formSubmissionId]);

  return (
    <div className="w-full h-full relative overflow-y-auto">
      <div className="absolute top-[1.2rem] left-0 w-full z-20 flex items-center justify-between">
        <CCNavBar
          selected={selectedPanel}
          onSelect={setSelectedPanel}
          disabled={!roundUser}
        />
      </div>
      {selectedPanel === "Home" && (
        <Homepage onGetStarted={initializeRoundUser} />
      )}
      {selectedPanel !== "Home" && (
        <div className="w-full min-h-full bg-[#121216] pt-28 pb-16">
          <div className="w-full space-y-8 md:px-6 lg:px-11 xl:px-15 2xl:px-20 mt-[45px]">
            {selectedPanel === "Questions" && roundHidden ? (
              <div className="text-center text-[#C9EB3E] font-ShareTechMono text-xl py-12">
                This round is currently hidden and cannot be accessed.
              </div>
            ) : selectedPanel === "Questions" ? (
              <Questions
                roundUser={roundUser ?? undefined}
                loading={loading}
                error={error}
                responses={responses}
                setResponses={setResponses}
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
