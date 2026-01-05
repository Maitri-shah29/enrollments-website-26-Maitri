import type React from "react";
import Button from "./button";
import NeonSection from "./neon-section";

const Contest: React.FC = () => {
  return (
    <NeonSection title="CONTEST">
      <p>
        The Round 2 of Competitive Coding domain is a contest hosted on
        HackerRank.
      </p>
      <Button
        label="Go to Contest"
        onClick={() =>
          window.open("https://www.hackerrank.com/acm-cc-contest", "_blank")
        }
      ></Button>
    </NeonSection>
  );
};

export default Contest;
