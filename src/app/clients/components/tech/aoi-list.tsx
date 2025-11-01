"use client";
import Image from "next/image";
import React from "react";
import { aoiList } from "@/lib/constants";
import type { AOI } from "@/lib/types";
import TechButton from "./button";

type Props = {
  activeAOI: AOI;
  onSelectAOI: (aoi: AOI) => void;
};

export default function AoiList({ activeAOI, onSelectAOI }: Props) {
  return (
    <div className="ml-4 mt-2 flex flex-col gap-1 text-[#993C7A] text-sm">
      {aoiList.map((aoi) => {
        const isActive = activeAOI === aoi;
        return (
          <TechButton
            key={aoi}
            type="button"
            onClick={() => onSelectAOI(aoi)}
            className={`cursor-pointer transition-all gap-3 flex items-center duration-150 text-sm mb-1 w-full text-left ${
              isActive ? "text-white" : "hover:text-white/80"
            }`}
          >
            <Image
              src={
                isActive
                  ? "/images/selected-folder.svg"
                  : "/images/unselected-folder.svg"
              }
              alt={`${aoi} icon`}
              width={16}
              height={16}
            />
            {aoi}
          </TechButton>
        );
      })}
    </div>
  );
}
