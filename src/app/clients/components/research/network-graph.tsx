"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface ClusterCenter {
  x: number;
  y: number;
}

interface Node {
  id: string;
  x: number;
  y: number;
  r: number;
  type: "core" | "satellite";
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
}

const CONFIG = {
  minClusters: 5,
  maxClusters: 7,
  minSatellites: 2,
  maxSatellites: 5,
  linkOpacity: 0.12,
  nodeOpacity: 0.85,
  textColumnWidthRatio: 0.65,
  textZoneHeightRatio: 0.2,
};

const NetworkGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const { width, height } = svgEl.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const textColumnWidth = width * CONFIG.textColumnWidthRatio;
    const textZoneHeight = height * CONFIG.textZoneHeightRatio;

    const rightZone = {
      xMin: textColumnWidth + 50,
      xMax: width - 50,
      yMin: 50,
      yMax: height - 50,
    };

    const bottomZone = {
      xMin: 50,
      xMax: width - 50,
      yMin: textZoneHeight + 80,
      yMax: height - 50,
    };

    const svg = d3
      .select(svgEl)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Randomly mix between right zone and bottom zone for variety
    const zones = [rightZone, bottomZone];
    const clusterCenters: ClusterCenter[] = [];
    const numClusters =
      CONFIG.minClusters +
      Math.floor(Math.random() * (CONFIG.maxClusters - CONFIG.minClusters + 1));

    for (let i = 0; i < numClusters; i++) {
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const x = zone.xMin + Math.random() * (zone.xMax - zone.xMin);
      const y = zone.yMin + Math.random() * (zone.yMax - zone.yMin);
      clusterCenters.push({ x, y });
    }

    // Generate nodes and links
    const nodes: Node[] = [];
    const links: Link[] = [];

    clusterCenters.forEach((center, ci) => {
      const coreId = `c${ci}`;
      nodes.push({
        id: coreId,
        x: center.x,
        y: center.y,
        r: 6 + Math.random() * 2,
        type: "core",
      });

      const numSatellites =
        CONFIG.minSatellites +
        Math.floor(
          Math.random() * (CONFIG.maxSatellites - CONFIG.minSatellites + 1),
        );
      const baseAngle = Math.random() * Math.PI * 2;

      for (let i = 0; i < numSatellites; i++) {
        const angle =
          baseAngle +
          (Math.PI * 2 * i) / numSatellites +
          (Math.random() * 0.3 - 0.15);
        const radius = 40 + Math.random() * 25;
        const nid = `n${ci}-${i}`;

        nodes.push({
          id: nid,
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
          r: 2 + Math.random() * 0.8,
          type: "satellite",
        });

        links.push({ source: coreId, target: nid });
      }
    });

    // Glow filter
    const defs = svg.append("defs");
    const glow = defs
      .append("filter")
      .attr("id", "node-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glow.append("feGaussianBlur").attr("stdDeviation", 2);
    const merge = glow.append("feMerge");
    merge.append("feMergeNode");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // Links
    const link = svg
      .append("g")
      .attr("stroke", "#9b7fff")
      .attr("stroke-opacity", CONFIG.linkOpacity)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 0.8);

    // Nodes
    const node = svg
      .append("g")
      .selectAll<SVGCircleElement, Node>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => (d.type === "core" ? "#a47fff" : "#bda8ff"))
      .attr("opacity", CONFIG.nodeOpacity)
      .style("filter", "url(#node-glow)")
      .style("cursor", "grab")
      .on("mouseenter", function (_, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", d.r + 1.3);
      })
      .on("mouseleave", function (_, d) {
        d3.select(this).transition().duration(150).attr("r", d.r);
      });

    // Keep nodes within their zones
    const constrainToZones = () => {
      nodes.forEach((n) => {
        const inRightZone =
          n.x >= rightZone.xMin &&
          n.x <= rightZone.xMax &&
          n.y >= rightZone.yMin &&
          n.y <= rightZone.yMax;

        const inBottomZone =
          n.x >= bottomZone.xMin &&
          n.x <= bottomZone.xMax &&
          n.y >= bottomZone.yMin &&
          n.y <= bottomZone.yMax;

        if (!inRightZone && !inBottomZone) {
          if (n.x < rightZone.xMin) n.x += 2;
          if (n.x > rightZone.xMax) n.x -= 2;
          if (n.y < bottomZone.yMin) n.y += 2;
          if (n.y > bottomZone.yMax) n.y -= 2;
        }
      });
    };

    // Simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(45)
          .strength(0.5),
      )
      .force("charge", d3.forceManyBody().strength(-25))
      .force(
        "collide",
        d3.forceCollide<Node>((d) => d.r * 3),
      )
      .on("tick", () => {
        constrainToZones();

        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      });

    // Dragging
    node.call(
      d3
        .drag<SVGCircleElement, Node>()
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

    return () => {
      simulation.stop();
      svg.selectAll("*").remove();
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default NetworkGraph;
