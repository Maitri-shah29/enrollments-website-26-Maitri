"use client";

import Image from "next/image";
import type React from "react";
import NetworkGraph from "../network-graph";

const quantumcomputingPage: React.FC = () => {
  return (
    <div className="relative flex w-full h-full bg-[#1A1A1A] overflow-hidden">
      <NetworkGraph />

      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10 z-10 max-w-4xl">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#C8B7FF] mb-4 sm:mb-6 md:mb-10">
          Quantum Computing
        </h1>
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-2 sm:pr-4">
          <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed">
            The Quantum Computing AOI explores the future of computation beyond
            classical boundaries. Members learn about qubits, entanglement, and
            quantum algorithms, experimenting with cutting-edge research that is
            redefining how we approach complex problem-solving.
            <br />
            Key Focus Areas:
            <br />
            1. Quantum Mechanics: Superposition, entanglement, and quantum
            interference principles
            <br />
            2. Qubit Technologies: Superconducting qubits, trapped ions, and
            photonic computing
            <br />
            3. Quantum Gates & Circuits: Single and multi-qubit gates and
            circuit design
            <br />
            4. Quantum Algorithms: Shor's algorithm, Grover's algorithm, VQE,
            and QAOA
            <br />
            5. Quantum Programming: Qiskit, Cirq, Q#, and hands-on circuit
            development
            <br />
            6. Error Correction: Dealing with decoherence and fault-tolerant
            computing
            <br />
            7. Quantum Cryptography: QKD and post-quantum security
            <br />
            8. Quantum Simulation: Molecular modeling and quantum chemistry
            <br />
            9. Hardware Platforms: IBM Quantum, Google Quantum AI, and cloud
            access
            <br />
          </p>
        </div>
      </div>
    </div>
  );
};

export default quantumcomputingPage;
