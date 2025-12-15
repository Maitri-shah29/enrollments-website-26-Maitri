import type React from "react";
import Button from "./button";
import NeonSection from "./neon-section";

const Interview: React.FC = () => {
  return (
    <NeonSection title="INTERVIEW">
      <p>
        Simulate the interview experience to guarantee a confident,
        well-prepared, strong showing.
      </p>
      <Button label="Practice Now"></Button>
    </NeonSection>
  );
};

export default Interview;
