"use client";
import type React from "react";

const AOIs: React.FC = () => {
  const aois = ["AOI 1", "AOI 2", "AOI 3", "AOI 4"];

  // Placeholder function for AOI click
  const handleAOIClick = (aoi: string) => {
    console.log(`Clicked on ${aoi}`);
    // TODO: Implement navigation or action for selected AOI
  };

  return (
    <div className="border border-black m-4 p-10">
      <h2 className="text-lg font-bold mb-4">Areas of Interest</h2>
      <ul className="space-y-2">
        {aois.map((aoi) => (
          <li key={aoi}>
            <button
              type="button"
              onClick={() => handleAOIClick(aoi)}
              className="w-full text-left border border-black p-2 hover:bg-gray-100"
            >
              {aoi}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AOIs;
