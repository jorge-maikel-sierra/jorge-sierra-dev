import { ImageResponse } from "next/og";
import type { Profile } from "@/lib/content/schema";

export const OG_SIZE = { width: 1200, height: 630 };

// Shared by opengraph-image and twitter-image: headline, name and a simple
// version of the five-layer graph. Colors come from docs/design.md §3.
const LAYERS = [4, 3, 3, 3, 2];

export function renderOgImage(profile: Profile) {
  const layers = LAYERS.map((count, li) =>
    Array.from({ length: count }, (_, k) => ({
      x: 770 + li * 92,
      y: 315 + (k - (count - 1) / 2) * 92,
    })),
  );
  const nodes = layers.flat();
  // Same wiring as the hero graph: node k links to k and k + 1 of the next layer.
  const edges = layers.slice(0, -1).flatMap((layer, li) => {
    const next = layers[li + 1];
    return layer.flatMap((node, k) =>
      [next[k % next.length], next[(k + 1) % next.length]].map((to) => ({ from: node, to })),
    );
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#07080A",
          color: "#ECEDEF",
          padding: "72px",
          position: "relative",
        }}
      >
        <svg
          width="1200"
          height="630"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {edges.map((edge, i) => (
            <line
              key={i}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              stroke="#6EF0B0"
              strokeOpacity="0.3"
              strokeWidth="2"
            />
          ))}
          {nodes.map((node, i) => (
            <circle
              key={i}
              cx={node.x}
              cy={node.y}
              r="12"
              fill="#07080A"
              stroke="#6EF0B0"
              strokeWidth="2.5"
            />
          ))}
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "640px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 0.94, letterSpacing: "-0.035em" }}>
            <span style={{ display: "flex" }}>
              {profile.hero.titleLine1.split(" ").slice(0, -1).join(" ")}&nbsp;
              <span style={{ color: "#FF9F5A" }}>
                {profile.hero.titleLine1.split(" ").slice(-1)}
              </span>
            </span>
            <span style={{ display: "flex" }}>
              {profile.hero.titleLine2.split(" ").slice(0, -1).join(" ")}&nbsp;
              <span style={{ color: "#6EF0B0" }}>
                {profile.hero.titleLine2.split(" ").slice(-1)}
              </span>
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700 }}>{profile.name}</span>
            <span style={{ fontSize: 26, color: "#B4B9C1" }}>{profile.headline}</span>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
