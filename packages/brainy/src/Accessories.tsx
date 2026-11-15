import type { Equipped } from "@brainee/core";
import { useId } from "react";
import { INK } from "./model";

const clasp = (cx: number, cy: number, r: number) => {
  const q = r * 0.4;
  return `M${cx} ${cy - r}L${cx + q} ${cy - q}L${cx + r} ${cy}L${cx + q} ${cy + q}L${cx} ${cy + r}L${cx - q} ${cy + q}L${cx - r} ${cy}L${cx - q} ${cy - q}Z`;
};

/** Slot `back`: drawn BEHIND the body so the silhouette changes. Sways with the frame ticker `t`. */
export function BackAccessories({ equipped, t = 0 }: { equipped: Equipped; t?: number }) {
  const id = useId();
  if (equipped.back !== "cape") return null;
  const sway = Math.sin(t * 2 * Math.PI * 0.55) * 7;
  const flick = Math.sin(t * 2 * Math.PI * 0.55 + 1.2) * 4;
  return (
    <g data-acc="cape" data-part="hero-cape">
      <defs>
        <linearGradient id={`${id}-cape`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5A3FE0" />
          <stop offset="1" stopColor="#8C76FF" />
        </linearGradient>
      </defs>
      <path
        d={`M70 124C50 152 14 180 ${2 + sway} 222Q${44 + sway * 0.5} 208 ${72 + sway * 0.5} 215Q${92 + flick} 222 110 212Q${128 + flick} 222 ${148 + sway * 0.5} 215Q${176 + sway * 0.5} 208 ${218 + sway} 222C206 180 170 152 150 124Z`}
        fill={`url(#${id}-cape)`}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d={`M${2 + sway} 222Q${44 + sway * 0.5} 208 ${72 + sway * 0.5} 215Q${92 + flick} 222 110 212Q${128 + flick} 222 ${148 + sway * 0.5} 215Q${176 + sway * 0.5} 208 ${218 + sway} 222L${208 + sway} 200Q${176 + sway * 0.5} 190 ${148 + sway * 0.5} 197Q${128 + flick} 204 110 194Q${92 + flick} 204 ${72 + sway * 0.5} 197Q${44 + sway * 0.5} 190 ${12 + sway} 200Z`}
        fill="#FF9EC2"
      />
    </g>
  );
}

/** The star clasp sits on the neck in front of the body. */
export function CapeClasp({ equipped }: { equipped: Equipped }) {
  if (equipped.back !== "cape") return null;
  return (
    <g data-acc="cape-clasp">
      <path
        d="M80 150Q110 164 140 150"
        fill="none"
        stroke="#FFAE1A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={clasp(110, 160, 9)}
        fill="#FFAE1A"
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  );
}
/** Cosmetic slots follow the new head, eye and neck anchors and move with the body. */
export function Accessories({ equipped }: { equipped: Equipped }) {
  return (
    <>
      {equipped.face === "glasses" && (
        <g data-acc="glasses" fill="none" stroke={INK} strokeWidth="3">
          <circle cx="92" cy="104" r="15" />
          <circle cx="128" cy="104" r="15" />
          <path d="M107 104q3-5 6 0M77 102l-15-5m81 5 15-5" />
        </g>
      )}
      {equipped.neck === "bowtie" && (
        <g data-acc="bowtie" fill="#FF6F9F">
          <path d="m110 162-22-12v24zm0 0 22-12v24z" />
          <circle cx="110" cy="162" r="6" fill="#C24E7E" />
        </g>
      )}
      {equipped.neck === "scarf" && (
        <g data-acc="scarf">
          <rect x="69" y="153" width="82" height="16" rx="8" fill="#5A3FE0" />
          <rect x="129" y="162" width="14" height="33" rx="5" fill="#8C76FF" />
          <path d="M82 156v10m16-10v10m16-10v10" stroke="#FFAE1A" strokeWidth="3" />
        </g>
      )}
      {equipped.head === "cowboy" && (
        <g data-acc="cowboy">
          <path d="M74 20Q70-26 93-15L110-6l17-9q23-11 19 35Z" fill="#F0A27E" />
          <path d="M75 10h70v10H75Z" fill="#9A3B12" />
          <path d="M34 12q76 30 152 0-76 51-152 0Z" fill="#B06A5A" />
        </g>
      )}
      {equipped.head === "cap" && (
        <g data-acc="cap">
          <path d="M64 24q46-65 92 0Z" fill="#2847C7" />
          <ellipse cx="153" cy="24" rx="29" ry="7" fill="#5A3FE0" />
          <circle cx="110" cy="-7" r="5" fill="#5A3FE0" />
        </g>
      )}
      {equipped.head === "phones" && (
        <g data-acc="phones">
          <path d="M29 88Q26-42 110-16q84-26 81 104" stroke={INK} strokeWidth="8" fill="none" />
          <rect x="18" y="75" width="22" height="35" rx="9" fill="#FF6F9F" />
          <rect x="180" y="75" width="22" height="35" rx="9" fill="#FF6F9F" />
        </g>
      )}
    </>
  );
}

/** The cape on its own, for the Starter Pack unlock animation. Same drawing as on Brainy. */
export function HeroCapeArt({ className }: { className?: string }) {
  const equipped = { back: "cape" } as const;
  return (
    <svg viewBox="0 20 220 210" className={className} aria-hidden="true">
      <BackAccessories equipped={equipped} />
      <CapeClasp equipped={equipped} />
    </svg>
  );
}
