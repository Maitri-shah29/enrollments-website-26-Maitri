"use client";
import * as d3 from "d3";
import { useEffect, useRef } from "react";

const aoiEllipse = "/images/research/aoi-ellipse.svg";
const researchEllipse = "/images/research/research-ellipse.svg";

const AOIs: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const aois = [
    "Blockchain",
    "Quantum Computing",
    "AI/ML",
    "Bioinformatics",
    "Cybersecurity",
    "IoT",
  ];

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    d3.select(svgElement).selectAll("*").remove();

    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;

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
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.2);

    const node = svg
      .append("g")
      .selectAll<SVGImageElement, NodeType>("image")
      .data(nodes)
      .join("image")
      .attr("href", (d) => (d.id === "research" ? researchEllipse : aoiEllipse))
      .attr("width", (d) => (d.id === "research" ? 100 : 50))
      .attr("height", (d) => (d.id === "research" ? 100 : 50))
      .attr("x", -35)
      .attr("y", -35)
      .style("cursor", "pointer")
      .on("click", (_, d) => console.log(`Clicked on ${d.id}`))
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
      .attr("font-size", (d) => (d.id === "research" ? "1.2rem" : "1rem"))
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.id === "research" ? 60 : 50));

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeType).x ?? 0)
        .attr("y1", (d) => (d.source as NodeType).y ?? 0)
        .attr("x2", (d) => (d.target as NodeType).x ?? 0)
        .attr("y2", (d) => (d.target as NodeType).y ?? 0);

      node.attr("x", (d) => (d.x ?? 0) - 35).attr("y", (d) => (d.y ?? 0) - 35);

      label.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    });
  }, []); // ✅ Removed `aois` dependency — it's constant

  return (
    <div className="flex justify-center items-center h-full w-full bg-[#1a1a1a] overflow-hidden">
      {/* Accessibility title for SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        role="img"
        aria-label="Areas of Interest Visualization"
      >
        <title>Areas of Interest Visualization</title>
      </svg>
    </div>
  );
};

export default AOIs;
