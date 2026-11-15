import type { Equipped } from "@brainee/core";
import { INK } from "./model";
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
