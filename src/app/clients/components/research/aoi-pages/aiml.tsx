"use client";

import Image from "next/image";
import type React from "react";
import NetworkGraph from "../network-graph";

const AIMLPage: React.FC = () => {
  return (
    <div className="relative flex w-full h-full bg-[#1A1A1A] overflow-hidden">
      <NetworkGraph />

      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10 z-10 max-w-4xl">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#C8B7FF] mb-4 sm:mb-6 md:mb-10">
          AI/ML
        </h1>
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-2 sm:pr-4">
          <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed">
            The AI/ML AOI delves into the world of intelligent systems that can
            learn, adapt, and make decisions. Members explore algorithms that
            power everything from predictive analytics to generative models,
            uncovering how data drives smarter and more efficient real-world
            solutions. <br />
            Key Focus Areas:
            <br />
            1. Machine Learning Fundamentals: Supervised, unsupervised, and
            reinforcement learning; model training and optimization <br />
            2. Deep Learning & Neural Networks: CNNs, RNNs, transformers, and
            attention mechanisms
            <br />
            3. Natural Language Processing: Sentiment analysis, translation,
            chatbots, and large language models
            <br />
            4. Computer Vision: Image classification, object detection, and
            generative image synthesis
            <br />
            5. Generative AI: GANs, diffusion models, and creative applications
            in art and content
            <br />
            6. MLOps & Deployment: Model versioning, pipeline automation, and
            scaling in production
            <br />
            7. Ethical AI: Bias detection, fairness, explainability, and
            responsible development
            <br />
            8. Real-World Applications: Healthcare diagnostics, autonomous
            vehicles, recommendation systems, fraud detection, and predictive
            maintenance.
            <br />
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIMLPage;
