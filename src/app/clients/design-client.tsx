/*
TODOS
1) Add sign in gaurd if the user is not logged in i think jenifer is working on it's component so it can be resued here
2) add form validation to the text boxes inside questions component i think design questions will only have long answer questions or smth so it shouldnt be too hard 
3) TO BE DISCUSSED WITH SC adding auto save 3 sec debounce iirc they did say yes to it but asking once more wouldnt hurt
4) Adding a varname guard, right now a question with any varname will be rendered, we can hardcode a list of allowed varnames inside question submission so stoopid questions dont get rendered 
*/
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { RoundUserExtended } from "@/app/clients/components/cc/questions";
import type { DesignAOI } from "@/lib/types";
import About from "./components/design/about";
import AOIs from "./components/design/aoi";
import DesignNavbar from "./components/design/design-navbar";
import Home from "./components/design/home";
import Instructions from "./components/design/instructions";
import Interview from "./components/design/interview";
import Questions from "./components/design/questions";

const AOI_JOIN_LIMIT = 3;

interface DesignClientProps {
  initialRoundUser?: RoundUserExtended | null;
}

const DesignClient = ({ initialRoundUser }: DesignClientProps) => {
  const [selectedPanel, setSelectedPanel] = useState<string>("Home");
  const [roundUser, setRoundUser] = useState<RoundUserExtended | null>(
    initialRoundUser ?? null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedAOIs, setJoinedAOIs] = useState<Set<DesignAOI>>(new Set());
  const [aoisLoaded, setAoisLoaded] = useState(false);
  const roundHidden = !!roundUser?.round?.hidden;

  // Load joined AOIs from localStorage on mount
  useEffect(() => {
    const savedAOIs = localStorage.getItem("design-joined-aois");
    if (savedAOIs) {
      try {
        const parsed = JSON.parse(savedAOIs) as DesignAOI[];
        console.log("Restored Design AOIs from localStorage:", parsed);
        setJoinedAOIs(new Set(parsed));
      } catch (err) {
        console.error("Failed to parse saved Design AOIs:", err);
      }
    }
    setAoisLoaded(true);
  }, []);

  // Save joined AOIs to localStorage when they change
  useEffect(() => {
    if (!aoisLoaded) return;
    const aoiArray = [...joinedAOIs];
    console.log("Saving Design AOIs to localStorage:", aoiArray);
    localStorage.setItem("design-joined-aois", JSON.stringify(aoiArray));
  }, [joinedAOIs, aoisLoaded]);

  const handleJoinAOI = (aoi: DesignAOI) => {
    if (joinedAOIs.size < AOI_JOIN_LIMIT) {
      setJoinedAOIs((prev) => new Set([...prev, aoi]));
    }
  };

  const handleLeaveAOI = (aoi: DesignAOI) => {
    setJoinedAOIs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(aoi);
      return newSet;
    });
  };

  const initializeRoundUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/round-user?domain=design");
      if (!res.ok) throw new Error("Failed to initialize round user");
      const data = await res.json();

      if (data && typeof data === "object" && !Array.isArray(data)) {
        setRoundUser(data as RoundUserExtended);
      } else if (Array.isArray(data) && data.length > 0) {
        setRoundUser(data[0] as RoundUserExtended);
      } else {
        setRoundUser(null);
        throw new Error("No round user returned");
      }

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

  // get questions from the round
  const formQuestions = roundUser?.round?.Question || [];

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
        roundUser={roundUser}
      />
      <div
        key={selectedPanel}
        className="flex overflow-y-auto z-10 animate-panel-transition [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {selectedPanel === "Home" && (
          <Home onGetStarted={initializeRoundUser} loading={loading} />
        )}
        {selectedPanel === "About" && <About />}
        {selectedPanel === "Instructions" && <Instructions />}
        {selectedPanel === "AOIs" && (
          <AOIs
            joinedAOIs={joinedAOIs}
            onJoinAOI={handleJoinAOI}
            onLeaveAOI={handleLeaveAOI}
            aoiJoinLimit={AOI_JOIN_LIMIT}
          />
        )}
        {selectedPanel === "Questions" && roundHidden ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white text-xl py-12">
              <h1 className="text-2xl font-bold mb-4">Round Hidden</h1>
              <p>This round is currently hidden and cannot be accessed.</p>
            </div>
          </div>
        ) : (
          selectedPanel === "Questions" &&
          roundUser &&
          roundUser.formSubmission && (
            <Questions
              questions={formQuestions}
              roundUser={roundUser}
              joinedAOIs={joinedAOIs}
            />
          )
        )}
        {selectedPanel === "Interview" && <Interview />}
      </div>
    </div>
  );
};

export default DesignClient;
