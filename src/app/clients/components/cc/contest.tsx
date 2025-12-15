import type React from "react";
import Button from "./button";
import NeonSection from "./neon-section";

const Contest: React.FC = () => {
  return (
    <NeonSection title="CONTEST">
      <p>
        Join our weekly coding competition and test your skills against other
        developers.
      </p>
      <Button label="Coming Soon!"></Button>
    </NeonSection>
  );
};

export default Contest;
