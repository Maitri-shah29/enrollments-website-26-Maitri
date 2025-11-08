"use client";

import Image from "next/image";
import type React from "react";
import NetworkGraph from "../network-graph";

const blockchainPage: React.FC = () => {
  return (
    <div className="relative flex w-full h-full bg-[#1A1A1A] overflow-hidden">
      <NetworkGraph />

      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10 z-10 max-w-4xl">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#C8B7FF] mb-4 sm:mb-6 md:mb-10">
          Blockchain
        </h1>
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-2 sm:pr-4">
          <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed">
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem
            ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum v lorem ipsum eugfuw
            kurfuwbfhweb rbfuyrgp4ugfhfiuwe psiuhfouwgfiewb bwiubfiuwgfwegf7gw
            uwebcuhsdbvouwg8 wegf87gf wegfo8wegf9w7ef
            wbcusbdvy8gwefesdbjckusbdvywegvwbvhbvjsbvduv8wgvbvhjbvjhsdv sd
            yugrvehvbwehbvhewbvhsdbvbvyweguewbewbvhbvyubvuywegvubhvbvweyfwe8hfbf
            fugo8wegvobv bvuwewe eubo8wegowyebvuybewuybvuvb kjhbv wbefiyug
            djkfvbkuebvuyre kjfbviyuerbi8yr lorem ipsum dolor sit amet wkjehbiwfyw
            kwhbvwuyvb8wey khvbygrv8owgvo8wegfw wuebo8wegfo8we7gew
            uvbowvogwe789fwe jhvbouwgvo8gwvo8vo8 kfubhvouego8rgv
            huvboygv8gf87wef87wefrvb ubvygvo8gfo8we7
          </p>
        </div>
      </div>
    </div>
  );
};

export default blockchainPage;
