import { useMemo } from "react";
import styled from "styled-components";

/* ───────── Layout ───────── */
const GaugeWrapper = styled.div`
  position: relative;
  width: ${(p) => p.$size || "300px"};
  height: ${(p) => p.$size || "300px"};
`;

const GaugeSvg = styled.svg`
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5));
`;

/* ───────── Digital readout ───────── */
const DigitalOverlay = styled.div`
  position: absolute;
  bottom: 22%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
`;

const RpmValue = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
  text-shadow: 0 0 12px rgba(192, 57, 43, 0.4);
`;

const RpmUnit = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-top: 4px;
`;

const BrandName = styled.text`
  font-family: "Times New Roman", "Georgia", serif;
  font-size: 8px;
  font-style: italic;
  fill: rgba(255, 255, 255, 0.3);
  text-anchor: middle;
`;

const SubLabel = styled.text`
  font-family: "Rajdhani", sans-serif;
  font-size: 6.5px;
  fill: rgba(255, 255, 255, 0.3);
  text-anchor: middle;
`;

/* ═══════════════════════════════════════════════
   Helper Functions
   ═══════════════════════════════════════════════ */
const CX = 150;
const CY = 150;

/**
 * Map a 0-based RPM fraction into an angle.
 * 0 → 7 o'clock (−225°)  |  1 → 5 o'clock (+45°)
 */
const START_DEG = -225;
const END_DEG = 45;
const SWEEP = END_DEG - START_DEG; // 270°

const fractionToAngle = (f) => START_DEG + f * SWEEP;

const degToRad = (d) => (d * Math.PI) / 180;

const polar = (cx, cy, r, deg) => ({
  x: cx + r * Math.cos(degToRad(deg)),
  y: cy + r * Math.sin(degToRad(deg)),
});

const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

/* ═══════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════ */
export default function RpmGauge({
  value = 0,
  maxRpm = 8000,
  size = "300px",
}) {
  const rpm = Math.min(Math.max(value, 0), maxRpm);
  const fraction = rpm / maxRpm;

  /* ── Tick marks (0-7, every 500 = minor, every 1000 = major) ── */
  const ticks = useMemo(() => {
    const arr = [];
    const totalSteps = maxRpm / 500;
    for (let i = 0; i <= totalSteps; i++) {
      const rpmVal = i * 500;
      const f = rpmVal / maxRpm;
      const deg = fractionToAngle(f);
      const isMajor = rpmVal % 1000 === 0;
      const isRedzone = rpmVal >= 6500;

      const outerR = 118;
      const innerR = isMajor ? 102 : 108;
      const labelR = 92;

      const p1 = polar(CX, CY, outerR, deg);
      const p2 = polar(CX, CY, innerR, deg);
      const pLabel = polar(CX, CY, labelR, deg);

      arr.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        labelX: pLabel.x,
        labelY: pLabel.y,
        label: isMajor ? String(rpmVal / 1000) : null,
        major: isMajor,
        redzone: isRedzone,
        deg,
      });
    }
    return arr;
  }, [maxRpm]);

  /* ── Redline block marks (individual red blocks from 6500-8000) ── */
  const redlineBlocks = useMemo(() => {
    const blocks = [];
    const blockStart = 6500;
    const blockStep = 250;
    for (
      let rpmVal = blockStart;
      rpmVal < maxRpm;
      rpmVal += blockStep
    ) {
      const f1 = rpmVal / maxRpm;
      const f2 = (rpmVal + blockStep * 0.7) / maxRpm;
      const deg1 = fractionToAngle(f1);
      const deg2 = fractionToAngle(f2);
      blocks.push({ deg1, deg2 });
    }
    return blocks;
  }, [maxRpm]);

  /* ── Needle angle ── */
  const needleDeg = fractionToAngle(fraction);

  /* ── Needle polygon points (long thin needle like the real Giulia) ── */
  const needleLength = 108;
  const needleTail = 18;
  const needleWidth = 2.5;

  const tipP = polar(CX, CY, needleLength, needleDeg);
  const tailP = polar(CX, CY, needleTail, needleDeg + 180);
  const leftP = polar(CX, CY, 6, needleDeg + 90);
  const rightP = polar(CX, CY, 6, needleDeg - 90);
  const midLeftP = polar(CX, CY, needleWidth, needleDeg + 90);
  const midRightP = polar(CX, CY, needleWidth, needleDeg - 90);

  // Create a tapered needle shape
  const needlePoints = [
    `${tipP.x},${tipP.y}`,
    `${midRightP.x + (tipP.x - CX) * 0.3},${midRightP.y + (tipP.y - CY) * 0.3}`,
    `${rightP.x},${rightP.y}`,
    `${tailP.x},${tailP.y}`,
    `${leftP.x},${leftP.y}`,
    `${midLeftP.x + (tipP.x - CX) * 0.3},${midLeftP.y + (tipP.y - CY) * 0.3}`,
  ].join(" ");

  /* ── Arc for the gauge track (thin outer arc) ── */
  const outerArc = arcPath(CX, CY, 122, START_DEG, END_DEG);

  /* Temperature indicators at the bottom corners */
  const tempCPos = polar(CX, CY, 72, fractionToAngle(0.02));
  const tempHPos = polar(CX, CY, 72, fractionToAngle(0.98));

  return (
    <GaugeWrapper $size={size}>
      <GaugeSvg viewBox="0 0 300 300">
        <defs>
          {/* Chrome bezel gradient */}
          <linearGradient
            id="bezelGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#555" />
            <stop offset="20%" stopColor="#888" />
            <stop offset="40%" stopColor="#aaa" />
            <stop offset="50%" stopColor="#ccc" />
            <stop offset="60%" stopColor="#aaa" />
            <stop offset="80%" stopColor="#777" />
            <stop offset="100%" stopColor="#444" />
          </linearGradient>

          {/* Dial face gradient */}
          <radialGradient id="dialFace" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#1a1a1c" />
            <stop offset="70%" stopColor="#0e0e10" />
            <stop offset="100%" stopColor="#080809" />
          </radialGradient>

          {/* Center hub gradient */}
          <radialGradient id="hubGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#666" />
            <stop offset="40%" stopColor="#444" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </radialGradient>

          {/* Needle glow */}
          <filter id="needleGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle inner shadow */}
          <filter id="innerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="2" />
            <feComposite
              in2="SourceAlpha"
              operator="arithmetic"
              k2="-1"
              k3="1"
            />
            <feFlood floodColor="#000" floodOpacity="0.4" />
            <feComposite in2="SourceGraphic" operator="in" />
            <feComposite in="SourceGraphic" />
          </filter>
        </defs>

        {/* ── Chrome outer bezel ── */}
        <circle
          cx={CX}
          cy={CY}
          r="148"
          fill="none"
          stroke="url(#bezelGrad)"
          strokeWidth="4"
        />
        <circle
          cx={CX}
          cy={CY}
          r="145"
          fill="none"
          stroke="rgba(0,0,0,0.6)"
          strokeWidth="1"
        />

        {/* ── Dial face ── */}
        <circle cx={CX} cy={CY} r="144" fill="url(#dialFace)" />

        {/* ── Subtle outer ring inside bezel ── */}
        <circle
          cx={CX}
          cy={CY}
          r="140"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.5"
        />

        {/* ── Thin outer gauge arc ── */}
        <path
          d={outerArc}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* ── Redline blocks ── */}
        {redlineBlocks.map((block, i) => (
          <path
            key={`red-${i}`}
            d={arcPath(CX, CY, 120, block.deg1, block.deg2)}
            fill="none"
            stroke="#C0392B"
            strokeWidth="8"
            strokeLinecap="butt"
            opacity="0.85"
          />
        ))}

        {/* ── Tick marks ── */}
        {ticks.map((t, i) => (
          <g key={`tick-${i}`}>
            <line
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={
                t.redzone
                  ? "rgba(192, 57, 43, 0.9)"
                  : t.major
                    ? "#ffffff"
                    : "rgba(255,255,255,0.35)"
              }
              strokeWidth={t.major ? "2" : "1"}
              strokeLinecap="round"
            />
            {t.label && (
              <text
                x={t.labelX}
                y={t.labelY + 3.5}
                textAnchor="middle"
                fill={
                  t.redzone
                    ? "rgba(192, 57, 43, 0.9)"
                    : "rgba(255,255,255,0.75)"
                }
                fontFamily="'Orbitron', sans-serif"
                fontSize="11"
                fontWeight="600"
              >
                {t.label}
              </text>
            )}
          </g>
        ))}

        {/* ── "Alfa Romeo" branding ── */}
        <BrandName x={CX} y={CY + 30}>
          Alfa Romeo
        </BrandName>

        {/* ── "Giri x1000" label ── */}
        <SubLabel x={CX} y={CY + 58}>
          Giri × 1000
        </SubLabel>

        {/* ── Small temperature marks (C and H) ── */}
        <text
          x={tempCPos.x + 12}
          y={tempCPos.y + 8}
          fill="rgba(255,255,255,0.2)"
          fontFamily="'Rajdhani', sans-serif"
          fontSize="6"
          textAnchor="middle"
        >
          C
        </text>
        <text
          x={tempHPos.x - 12}
          y={tempHPos.y + 8}
          fill="rgba(192,57,43,0.3)"
          fontFamily="'Rajdhani', sans-serif"
          fontSize="6"
          textAnchor="middle"
        >
          H
        </text>

        {/* ── Needle ── */}
        <polygon
          points={needlePoints}
          fill="#C0392B"
          filter="url(#needleGlow)"
          style={{
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* ── Center hub (chrome cap) ── */}
        <circle
          cx={CX}
          cy={CY}
          r="10"
          fill="url(#hubGrad)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />
        <circle cx={CX} cy={CY} r="5" fill="#0e0e10" />

        {/* ── Glass reflection (subtle) ── */}
        <ellipse
          cx={CX - 20}
          cy={CY - 40}
          rx="60"
          ry="35"
          fill="rgba(255,255,255,0.015)"
          transform="rotate(-15, 150, 110)"
        />
      </GaugeSvg>

      {/* ── Digital RPM readout ── */}
      <DigitalOverlay>
        <RpmValue>
          {Math.round(rpm).toLocaleString()}
        </RpmValue>
        <RpmUnit>RPM</RpmUnit>
      </DigitalOverlay>
    </GaugeWrapper>
  );
}