"use client";
import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface AOIsProps {
  onSelect: (panel: string) => void;
}

const aoiEllipse = "/images/research/aoi-ellipse.svg";
const researchEllipse = "/images/research/research-ellipse.svg";

function _StaticFaintLines() {
  const BASE_W = 1366;
  const BASE_H = 944;

  type Line = { w: number; left: number; top: number; rot: number };
  const lines: Line[] = [
    { w: 949.58, left: 368.89, top: 392.29, rot: 18.71 },
    { w: 936.34, left: 416.88, top: 307.24, rot: 24.59 },
    { w: 828.01, left: 368.89, top: 392.29, rot: 10.46 },
    { w: 948.11, left: 324.0, top: 781.96, rot: -5.15 },
    { w: 828.74, left: 368.89, top: 696.9, rot: -10.73 },
    { w: 960.33, left: 368.89, top: 696.9, rot: 15.78 },
    { w: 1027.32, left: 368.89, top: 392.29, rot: 28.9 },
    { w: 950.31, left: 324.0, top: 781.96, rot: 6.45 },
    { w: 948.19, left: 348.77, top: 928.33, rot: -14.13 },
    { w: 1043.89, left: 368.89, top: 696.9, rot: -19.73 },
    { w: 864.67, left: 416.88, top: 142.0, rot: 27.6 },
  ];

  const minLeft = Math.min(...lines.map((l) => l.left));
  const minTop = Math.min(...lines.map((l) => l.top));
  const leftOffsetPct = (minLeft / BASE_W) * 100;
  const topOffsetPct = (minTop / BASE_H) * 100;

  return (
    <div
      className="absolute"
      style={{
        left: `-${leftOffsetPct}%`,
        top: `-${topOffsetPct}%`,
        width: `calc(100% + ${leftOffsetPct}%)`,
        height: `calc(100% + ${topOffsetPct}%)`,
      }}
    >
      {lines.map((l, idx) => (
        <div
          key={idx}
          className="absolute h-px bg-white/10"
          style={{
            width: `${(l.w / BASE_W) * 100}%`,
            left: `${(l.left / BASE_W) * 100}%`,
            top: `${(l.top / BASE_H) * 100}%`,
            transformOrigin: "top left",
            transform: `rotate(${l.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

const AOIs: React.FC<AOIsProps> = ({ onSelect }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const aois = [
    "Blockchain",
    "Quantum Computing",
    "AI/ML",
    "Bioinformatics",
    "Cybersecurity",
    "IoT",
  ];

  interface NodeType extends d3.SimulationNodeDatum {
    id: string;
    fx?: number | null;
    fy?: number | null;
    x?: number;
    y?: number;
  }

  interface LinkType extends d3.SimulationLinkDatum<NodeType> {
    source: string | NodeType;
    target: string | NodeType;
  }

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    d3.select(svgElement).selectAll("*").remove();

    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;
    const researchSize = 70; // center circle size (was 100)
    const nodeSize = 35; // outer circle size (was 50)
    const researchRadius = researchSize / 2;
    const nodeRadius = nodeSize / 2;

    const nodes: NodeType[] = [
      { id: "research" },
      ...aois.map((aoi) => ({ id: aoi })),
    ];
    const links: LinkType[] = aois.map((aoi) => ({
      source: "research",
      target: aoi,
    }));

    const svg = d3
      .select(svgElement)
      .attr("viewBox", [0, 0, width, height])
      .style("background", "#1a1a1a")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "clamp(10px, 1.2vw, 14px)");

    const simulation = d3
      .forceSimulation<NodeType>(nodes)
      .force(
        "link",
        d3
          .forceLink<NodeType, LinkType>(links)
          .id((d) => d.id)
          .distance(200),
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .attr("stroke", "#9b7fff")
      .attr("stroke-opacity", 0.35)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2.8);

    const node = svg
      .append("g")
      .selectAll<SVGImageElement, NodeType>("image")
      .data(nodes)
      .join("image")
      .attr("href", (d) => (d.id === "research" ? researchEllipse : aoiEllipse))
      .attr("width", (d) => (d.id === "research" ? researchSize : nodeSize))
      .attr("height", (d) => (d.id === "research" ? researchSize : nodeSize))
      .attr("draggable", "false")
      // initial x/y left to tick handler; keep cursor/click/drag the same
      .style("cursor", (d) => (d.id === "research" ? "default" : "pointer"))
      .on("click", (_, d) => {
        if (d.id !== "research") {
          const panelName = d.id.replace(/\s|\//g, "").toUpperCase();
          onSelect(panelName);
        }
      })
      .call(
        d3
          .drag<SVGImageElement, NodeType>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    const label = svg
      .append("g")
      .selectAll<SVGTextElement, NodeType>("text")
      .data(nodes)
      .join("text")
      .text((d) => (d.id === "research" ? d.id.toUpperCase() : d.id))
      .attr("fill", "#fff")
      .attr("font-weight", (d) => (d.id === "research" ? "700" : "400"))
      .attr("font-size", (d) => (d.id === "research" ? "1.1rem" : "1rem"))
      .attr("text-anchor", "middle")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeType).x ?? 0)
        .attr("y1", (d) => (d.source as NodeType).y ?? 0)
        .attr("x2", (d) => (d.target as NodeType).x ?? 0)
        .attr("y2", (d) => (d.target as NodeType).y ?? 0);

      node
        .attr(
          "x",
          (d) =>
            (d.x ?? 0) - (d.id === "research" ? researchRadius : nodeRadius),
        )
        .attr(
          "y",
          (d) =>
            (d.y ?? 0) - (d.id === "research" ? researchRadius : nodeRadius),
        );

      label
        .attr("x", (d) => d.x ?? 0)
        .attr("y", (d) =>
          d.id === "research"
            ? (d.y ?? 0) + researchRadius + 20
            : (d.y ?? 0) + nodeRadius + 14,
        );
    });
  }, [onSelect]);

  return (
    <div className="flex justify-center items-center h-full w-full bg-[#1a1a1a]">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default AOIs;
