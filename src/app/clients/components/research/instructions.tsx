"use client";

import NetworkGraph from "./network-graph";

export default function Instructions() {
  return (
    <div className="relative w-full min-h-screen bg-[#1A1A1A] text-white overflow-hidden">
      {/* Background Graph (interactive) */}
      <div className="absolute inset-0 z-0">
        <NetworkGraph />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 px-[4vw] py-[5vh] max-w-7xl">
        <h1 className="text-[clamp(1rem,1.5vw,1.25rem)] font-semibold text-[#C8B7FF] mb-[1vh] font-monopoly-bold">
          Instructions
        </h1>

        <p className="text-gray-300 leading-relaxed text-justify font-monopoly text-[clamp(0.875rem,1.2vw,1rem)]">
          Welcome to the first round of ACM-VIT's Research Domain selections!{" "}
          <br></br>
          1. Go to the Explore tab on the left sidebar and join up to 3 AoIs
          based on your preferences.
          <br />
          2. Proceed to Round 1. Answer the common questions first, and then the
          domain-wise questions.
          <br />
          3. Make sure you click on Save after every answer. If you see the
          "Saved Successfully" popup on the top right, your answer has been
          saved. You may change your answers after you save answer. You cannot
          change your answers once you have submitted the form.
          <br />
          4. After answering all questions, click on ‘Submit Form’ at the bottom
          of the left sidebar.
          <br />
          All the best!
          <br />
          <br />
          PS - You’ll probably use AI for these questions, which is totally
          fine. Just keep in mind that we’ll be evaluating your originality and
          your ability to learn so feel free to use AI for support, but make
          sure your answers reflect your own thinking.
        </p>
      </div>
    </div>
  );
}
