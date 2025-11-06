"use client";
import { useEffect, useState } from "react";
import About from "./components/cc/about";
import Contest from "./components/cc/contest";
import Instructions from "./components/cc/instructions";
import Interview from "./components/cc/interview";
import Homepage from "./components/cc/landing";
import CCNavBar from "./components/cc/navbar";
import Questions, { type RoundUserExtended } from "./components/cc/questions";

const Page = () => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");
  const [roundUsers, setRoundUsers] = useState<RoundUserExtended[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoundUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/round-user?domain=cc");
        if (!res.ok) throw new Error("Failed to fetch round user data");
        const data = await res.json();

        // Handle both single roundUser and array of roundUsers
        if (Array.isArray(data)) {
          setRoundUsers(data);
        } else if (data && typeof data === "object") {
          setRoundUsers([data]);
        } else {
          setRoundUsers([]);
        }
      } catch (err) {
        console.error("Error fetching round users:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch round user data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoundUsers();
  }, []);

  // Get the roundUser with formSubmission for the Questions component
  const roundUserWithFormSubmission = roundUsers.find(
    (ru) => ru.formSubmission !== null && ru.formSubmission !== undefined,
  );

  return (
    <div className="w-full h-full relative overflow-y-auto">
      <div className="absolute top-[1.2rem] left-0 w-full z-20 flex items-center justify-between px-16">
        <CCNavBar selected={selectedPanel} onSelect={setSelectedPanel} />
      </div>
      {selectedPanel === "Home" && (
        <Homepage onGetStarted={() => setSelectedPanel("About")} />
      )}
      {selectedPanel !== "Home" && (
        <div className="w-full min-h-full bg-[#121216] pt-28 pb-16">
          <div className="w-full space-y-8 px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-32 mt-[45px]">
            {selectedPanel === "About" && <About />}
            {selectedPanel === "Instructions" && <Instructions />}
            {selectedPanel === "Contest" && <Contest />}
            {selectedPanel === "Interview" && <Interview />}
            {selectedPanel === "Questions" && (
              <Questions
                roundUser={roundUserWithFormSubmission}
                loading={loading}
                error={error}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
