"use client";

import Image from "next/image";
import type React from "react";
import NetworkGraph from "../network-graph";

const bioinfoPage: React.FC = () => {
  return (
    <div className="relative flex w-full h-full bg-[#1A1A1A] overflow-hidden">
      <NetworkGraph />

      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10 z-10 max-w-4xl">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#C8B7FF] mb-4 sm:mb-6 md:mb-10">
          Bioinformatics
        </h1>
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-2 sm:pr-4">
          <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed">
            The Bioinformatics AOI blends computation with biology to decode
            complex biological data. Members use algorithms and analytical tools
            to study genomics, protein structures, and healthcare datasets,
            contributing to the growing intersection of technology and life
            sciences. <br />
            Key Focus Areas:
            <br />
            1. Genomics & Sequencing: Next-generation sequencing, genome
            assembly, and variant calling <br />
            2. Protein Structure: Folding prediction, molecular docking, and
            tools like AlphaFold <br />
            3. Sequence Alignment: BLAST, phylogenetic analysis, and
            evolutionary biology
            <br />
            4. Gene Expression: RNA-seq processing and differential expression
            analysis
            <br />
            5. Systems Biology: Metabolic pathway modeling and network analysis
            <br />
            6. Drug Discovery: Computational screening and pharmacogenomics
            <br />
            7. Clinical Bioinformatics: Precision medicine and cancer genomics
            <br />
            8. Biological Databases: NCBI, UniProt, PDB, and data mining
            strategies
            <br />
            9. ML in Biology: Disease prediction and protein function analysis
            <br />
          </p>
        </div>
      </div>
    </div>
  );
};

export default bioinfoPage;
