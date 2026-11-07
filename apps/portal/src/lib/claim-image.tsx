/**
 * The picture a claim link shows in a messaging app's preview: Canopy Boy
 * holding up the keys, a tag on the ring carrying the site's name. Drawn per
 * link by next/og, which reads TTF (not WOFF2), hence the TTF copies of
 * Urbanist.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const CLAIM_IMAGE_SIZE = { width: 1200, height: 630 };

const INK = "#1d1d1f";
const TEAL = "#005e69";
const GREEN = "#5dd38b";
const CORAL = "#fe6a59";
const SUN = "#fbcb7d";

/** Canopy Boy with the keys: the file's pixel size, and where on the ring the tag's string ties on. */
const FIGURE = { file: "canopy-boy-keys.png", width: 571, height: 988, tie: { x: 25, y: 285 } };
const FIGURE_HEIGHT = 580;
const FIGURE_LEFT = 585;
const FIGURE_TOP = 30;

const TAG = { width: 262, height: 150, rotate: -7, hole: 29 };

let assets: Promise<{ figure: string; fonts: { name: string; data: Buffer; weight: 700; style: "normal" }[] }> | null = null;

function loadAssets() {
  const pub = (...p: string[]) => path.join(process.cwd(), "public", ...p);
  assets ??= Promise.all([
    readFile(pub("illustrations", FIGURE.file)),
    readFile(pub("fonts", "urbanist", "urbanist-latin-700-normal.ttf")),
    readFile(pub("fonts", "urbanist", "urbanist-latin-ext-700-normal.ttf")),
  ]).then(([figure, latin, ext]) => ({
    figure: `data:image/png;base64,${figure.toString("base64")}`,
    fonts: [
      { name: "Urbanist", data: latin, weight: 700 as const, style: "normal" as const },
      { name: "Urbanist", data: ext, weight: 700 as const, style: "normal" as const },
    ],
  }));
  return assets;
}

/** Smaller type for a longer name, so the tag holds it in at most three lines. */
function tagFontSize(name: string): number {
  if (name.length <= 10) return 50;
  if (name.length <= 18) return 42;
  if (name.length <= 30) return 34;
  return 27;
}

/** Bits of confetti, kept clear of the middle, where a square crop keeps the picture. */
const CONFETTI: { x: number; y: number; w: number; h: number; r: number; c: string }[] = [
  { x: 70, y: 80, w: 26, h: 12, r: 25, c: GREEN },
  { x: 180, y: 190, w: 14, h: 14, r: 0, c: SUN },
  { x: 110, y: 420, w: 28, h: 12, r: -30, c: CORAL },
  { x: 230, y: 540, w: 16, h: 16, r: 45, c: "#ffffff" },
  { x: 250, y: 60, w: 12, h: 12, r: 0, c: CORAL },
  { x: 1060, y: 90, w: 28, h: 12, r: -20, c: SUN },
  { x: 960, y: 200, w: 14, h: 14, r: 45, c: "#ffffff" },
  { x: 1100, y: 330, w: 26, h: 12, r: 35, c: GREEN },
  { x: 1150, y: 200, w: 16, h: 16, r: 0, c: CORAL },
  { x: 1120, y: 560, w: 28, h: 12, r: -15, c: GREEN },
];

export async function claimImage(name: string): Promise<ImageResponse> {
  const { figure, fonts } = await loadAssets();
  const scale = FIGURE_HEIGHT / FIGURE.height;
  const tie = { x: FIGURE_LEFT + FIGURE.tie.x * scale, y: FIGURE_TOP + FIGURE.tie.y * scale };

  // The tag hangs to the left of the keys; its hole is where the string ends.
  const tagLeft = tie.x - TAG.width - 40;
  const tagTop = tie.y + 55;
  const a = (TAG.rotate * Math.PI) / 180;
  const dx = TAG.width / 2 - TAG.hole;
  const dy = TAG.hole - TAG.height / 2;
  const hole = {
    x: tagLeft + TAG.width / 2 + dx * Math.cos(a) - dy * Math.sin(a),
    y: tagTop + TAG.height / 2 + dx * Math.sin(a) + dy * Math.cos(a),
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: TEAL,
          fontFamily: "Urbanist",
        }}
      >
        {CONFETTI.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.w,
              height: p.h,
              borderRadius: p.w === p.h && p.r === 0 ? p.w : 3,
              backgroundColor: p.c,
              transform: `rotate(${p.r}deg)`,
            }}
          />
        ))}

        {/* The brand's two swoops, as on the sign-in page. */}
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M -40 560 C 300 470, 700 640, 1240 470" stroke={GREEN} strokeWidth="7" fill="none" opacity="0.9" />
          <path d="M 760 650 C 900 520, 1050 430, 1240 400" stroke={CORAL} strokeWidth="5" fill="none" opacity="0.8" />
        </svg>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={figure}
          width={Math.round(FIGURE.width * scale)}
          height={FIGURE_HEIGHT}
          style={{ position: "absolute", left: FIGURE_LEFT, top: FIGURE_TOP }}
          alt=""
        />

        {/* The tag, hanging from the ring. */}
        <div
          style={{
            position: "absolute",
            left: tagLeft,
            top: tagTop,
            width: TAG.width,
            height: TAG.height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "22px 34px 22px 26px",
            backgroundColor: "#fffaf0",
            border: `6px solid ${INK}`,
            borderRadius: 22,
            transform: `rotate(${TAG.rotate}deg)`,
            boxShadow: "0 10px 0 rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: TAG.hole - 11,
              top: TAG.hole - 11,
              width: 22,
              height: 22,
              borderRadius: 22,
              border: `5px solid ${INK}`,
              backgroundColor: TEAL,
            }}
          />
          <div
            style={{
              display: "flex",
              textAlign: "center",
              justifyContent: "center",
              fontSize: tagFontSize(name),
              lineHeight: 1.05,
              color: TEAL,
              letterSpacing: -0.5,
            }}
          >
            {name}
          </div>
        </div>

        {/* The string from the ring to the tag's hole. */}
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <path
            d={`M ${tie.x} ${tie.y} Q ${(tie.x + hole.x) / 2 - 10} ${Math.max(tie.y, hole.y) + 18} ${hole.x} ${hole.y}`}
            stroke={INK}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...CLAIM_IMAGE_SIZE, fonts }
  );
}
