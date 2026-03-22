import { useMemo } from "react";
import styled from "styled-components";

const GaugeWrapper = styled.div`
  position: relative;
  width: ${(p) => p.$size || "180px"};
  height: ${(p) => p.$size || "180px"};
`;

const GaugeSvg = styled.svg`
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.4));
`;

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
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
  text-shadow: 0 0 8px rgba(192, 57, 43, 0.4);
`;

const RpmUnit = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.5rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-top: 2px;
`;

const CX = 100;
const CY = 100;

const START_DEG = -225;
const END_DEG = 45;
const SWEEP = END_DEG - START_DEG;

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

export default function MobileRpmGauge({
    value = 0,
    maxRpm = 8000,
    size = "180px",
}) {
    const rpm = Math.min(Math.max(value, 0), maxRpm);
    const fraction = rpm / maxRpm;

    const ticks = useMemo(() => {
        const arr = [];
        const totalSteps = maxRpm / 500;
        for (let i = 0; i <= totalSteps; i++) {
            const rpmVal = i * 500;
            const f = rpmVal / maxRpm;
            const deg = fractionToAngle(f);
            const isMajor = rpmVal % 1000 === 0;
            const isRedzone = rpmVal >= 6500;

            const outerR = 80;
            const innerR = isMajor ? 68 : 73;
            const labelR = 60;

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
            });
        }
        return arr;
    }, [maxRpm]);

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

    const needleDeg = fractionToAngle(fraction);

    const needleLength = 72;
    const needleTail = 12;
    const needleWidth = 2;

    const tipP = polar(CX, CY, needleLength, needleDeg);
    const tailP = polar(CX, CY, needleTail, needleDeg + 180);
    const leftP = polar(CX, CY, 4, needleDeg + 90);
    const rightP = polar(CX, CY, 4, needleDeg - 90);
    const midLeftP = polar(CX, CY, needleWidth, needleDeg + 90);
    const midRightP = polar(CX, CY, needleWidth, needleDeg - 90);

    const needlePoints = [
        `${tipP.x},${tipP.y}`,
        `${midRightP.x + (tipP.x - CX) * 0.3},${midRightP.y + (tipP.y - CY) * 0.3}`,
        `${rightP.x},${rightP.y}`,
        `${tailP.x},${tailP.y}`,
        `${leftP.x},${leftP.y}`,
        `${midLeftP.x + (tipP.x - CX) * 0.3},${midLeftP.y + (tipP.y - CY) * 0.3}`,
    ].join(" ");

    const outerArc = arcPath(CX, CY, 83, START_DEG, END_DEG);

    return (
        <GaugeWrapper $size={size}>
            <GaugeSvg viewBox="0 0 200 200">
                <defs>
                    <linearGradient
                        id="mBezelGrad"
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

                    <radialGradient id="mDialFace" cx="50%" cy="45%" r="55%">
                        <stop offset="0%" stopColor="#1a1a1c" />
                        <stop offset="70%" stopColor="#0e0e10" />
                        <stop offset="100%" stopColor="#080809" />
                    </radialGradient>

                    <radialGradient id="mHubGrad" cx="40%" cy="35%">
                        <stop offset="0%" stopColor="#666" />
                        <stop offset="40%" stopColor="#444" />
                        <stop offset="100%" stopColor="#1a1a1a" />
                    </radialGradient>

                    <filter id="mNeedleGlow">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Chrome bezel */}
                <circle
                    cx={CX}
                    cy={CY}
                    r="98"
                    fill="none"
                    stroke="url(#mBezelGrad)"
                    strokeWidth="3"
                />
                <circle
                    cx={CX}
                    cy={CY}
                    r="96"
                    fill="none"
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth="0.5"
                />

                {/* Dial face */}
                <circle cx={CX} cy={CY} r="95" fill="url(#mDialFace)" />

                <circle
                    cx={CX}
                    cy={CY}
                    r="92"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="0.5"
                />

                {/* Outer arc */}
                <path
                    d={outerArc}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />

                {/* Redline blocks */}
                {redlineBlocks.map((block, i) => (
                    <path
                        key={`red-${i}`}
                        d={arcPath(CX, CY, 81, block.deg1, block.deg2)}
                        fill="none"
                        stroke="#C0392B"
                        strokeWidth="6"
                        strokeLinecap="butt"
                        opacity="0.85"
                    />
                ))}

                {/* Tick marks */}
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
                            strokeWidth={t.major ? "1.5" : "0.75"}
                            strokeLinecap="round"
                        />
                        {t.label && (
                            <text
                                x={t.labelX}
                                y={t.labelY + 2.5}
                                textAnchor="middle"
                                fill={
                                    t.redzone
                                        ? "rgba(192, 57, 43, 0.9)"
                                        : "rgba(255,255,255,0.75)"
                                }
                                fontFamily="'Orbitron', sans-serif"
                                fontSize="7.5"
                                fontWeight="600"
                            >
                                {t.label}
                            </text>
                        )}
                    </g>
                ))}

                {/* Branding */}
                <text
                    x={CX}
                    y={CY + 20}
                    textAnchor="middle"
                    fontFamily="'Times New Roman', 'Georgia', serif"
                    fontSize="6"
                    fontStyle="italic"
                    fill="rgba(255, 255, 255, 0.3)"
                >
                    Alfa Romeo
                </text>

                <text
                    x={CX}
                    y={CY + 38}
                    textAnchor="middle"
                    fontFamily="'Rajdhani', sans-serif"
                    fontSize="5"
                    fill="rgba(255, 255, 255, 0.3)"
                >
                    Giri × 1000
                </text>

                {/* Needle */}
                <polygon
                    points={needlePoints}
                    fill="#C0392B"
                    filter="url(#mNeedleGlow)"
                    style={{
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />

                {/* Center hub */}
                <circle
                    cx={CX}
                    cy={CY}
                    r="7"
                    fill="url(#mHubGrad)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.5"
                />
                <circle cx={CX} cy={CY} r="3.5" fill="#0e0e10" />

                {/* Glass reflection */}
                <ellipse
                    cx={CX - 14}
                    cy={CY - 28}
                    rx="40"
                    ry="24"
                    fill="rgba(255,255,255,0.015)"
                    transform={`rotate(-15, ${CX - 14}, ${CY - 28})`}
                />
            </GaugeSvg>

            <DigitalOverlay>
                <RpmValue>{Math.round(rpm).toLocaleString()}</RpmValue>
                <RpmUnit>RPM</RpmUnit>
            </DigitalOverlay>
        </GaugeWrapper>
    );
}