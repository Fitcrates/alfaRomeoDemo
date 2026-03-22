import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import gsap from "gsap";
import MobilePanel from "./MobilePanel";

/* ── Action page styles ── */

const ActionPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 10px;
`;



const SpecsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
`;

const SpecCard = styled.div`
  padding: 10px;
  text-align: center;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.03) 100%
  );

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    );
    pointer-events: none;
  }

  &.full-width {
    grid-column: 1 / -1;
  }
`;

const SpecLabel = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 0.25rem;
`;

const SpecValue = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: ${(p) => (p.$large ? "1.2rem" : "0.8rem")};
  color: #ffffff;
  font-weight: 600;
`;

const SwipeHint = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.2);
  text-align: center;
  margin-top: auto;
  padding-top: 2px;
`;

/* ── Details page styles ── */

const DetailsPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Description = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
  margin: 0 0 4px;
`;

const TireRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid #c0392b;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.03) 100%
  );

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    );
    pointer-events: none;
  }

  position: relative;
  overflow: hidden;
`;

const TireLabel = styled.span`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const TireSize = styled.span`
  font-family: "Orbitron", sans-serif;
  font-size: 0.7rem;
  color: #ffffff;
`;

const BrakeInfo = styled.div`
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.03) 100%
  );
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 100%
    );
    pointer-events: none;
  }
`;

const BrakeTitle = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: 0.65rem;
  color: #c0392b;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 1;
`;

const BrakeSpecs = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  z-index: 1;

  span {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.6);
  }
`;

/* ── Wheel SVG component ── */

function WheelIllustration({ spinning = false }) {
    const wheelRef = useRef(null);

    useEffect(() => {
        if (!wheelRef.current) return;

        if (spinning) {
            gsap.to(wheelRef.current, {
                rotation: 360,
                duration: 4,
                ease: "none",
                repeat: -1,
                transformOrigin: "center center",
            });
        } else {
            gsap.killTweensOf(wheelRef.current);
        }

        return () => {
            if (wheelRef.current) {
                gsap.killTweensOf(wheelRef.current);
            }
        };
    }, [spinning]);

    const CX = 75;
    const CY = 75;
    const outerR = 68;
    const tireR = 72;
    const innerR = 50;
    const hubR = 12;
    const boltR = 8;
    const spokeCount = 5;

    const spokes = [];
    for (let i = 0; i < spokeCount; i++) {
        const angle = (i * 360) / spokeCount - 90;
        const nextAngle = ((i + 1) * 360) / spokeCount - 90;
        const rad = (angle * Math.PI) / 180;
        const nextRad = (nextAngle * Math.PI) / 180;
        const midRad = ((angle + nextAngle / 2 + angle / 2) * Math.PI) / 180;

        const innerX1 = CX + 16 * Math.cos(rad);
        const innerY1 = CY + 16 * Math.sin(rad);
        const outerX1 = CX + (innerR - 2) * Math.cos(rad - 0.08);
        const outerY1 = CY + (innerR - 2) * Math.sin(rad - 0.08);
        const outerX2 = CX + (innerR - 2) * Math.cos(rad + 0.08);
        const outerY2 = CY + (innerR - 2) * Math.sin(rad + 0.08);

        spokes.push(
            <polygon
                key={`spoke-${i}`}
                points={`${innerX1},${innerY1} ${outerX1},${outerY1} ${outerX2},${outerY2}`}
                fill="rgba(255,255,255,0.12)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
            />,
        );

        // Cloverleaf hole between spokes
        const holeAngle = angle + 360 / spokeCount / 2;
        const holeRad = (holeAngle * Math.PI) / 180;
        const holeX = CX + 34 * Math.cos(holeRad);
        const holeY = CY + 34 * Math.sin(holeRad);

        spokes.push(
            <ellipse
                key={`hole-${i}`}
                cx={holeX}
                cy={holeY}
                rx="10"
                ry="7"
                transform={`rotate(${holeAngle}, ${holeX}, ${holeY})`}
                fill="#080809"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.5"
            />,
        );

        // Bolt
        const boltX = CX + boltR * Math.cos(rad);
        const boltY = CY + boltR * Math.sin(rad);
        spokes.push(
            <circle
                key={`bolt-${i}`}
                cx={boltX}
                cy={boltY}
                r="2"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="0.5"
            />,
        );
    }

    return (
        <WheelSvg viewBox="0 0 150 150">
            <defs>
                <radialGradient id="tireGrad" cx="45%" cy="40%">
                    <stop offset="0%" stopColor="#2a2a2c" />
                    <stop offset="70%" stopColor="#1a1a1c" />
                    <stop offset="100%" stopColor="#0e0e10" />
                </radialGradient>
                <radialGradient id="rimGrad" cx="40%" cy="35%">
                    <stop offset="0%" stopColor="#3a3a3e" />
                    <stop offset="50%" stopColor="#2a2a2e" />
                    <stop offset="100%" stopColor="#1a1a1e" />
                </radialGradient>
                <radialGradient id="mHubGradW" cx="40%" cy="35%">
                    <stop offset="0%" stopColor="#666" />
                    <stop offset="40%" stopColor="#444" />
                    <stop offset="100%" stopColor="#1a1a1a" />
                </radialGradient>
            </defs>

            {/* Tire */}
            <circle
                cx={CX}
                cy={CY}
                r={tireR}
                fill="url(#tireGrad)"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.5"
            />
            {/* Tire tread subtle pattern */}
            <circle
                cx={CX}
                cy={CY}
                r={tireR - 3}
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="4"
                strokeDasharray="3 5"
            />

            {/* Rim outer edge */}
            <circle
                cx={CX}
                cy={CY}
                r={outerR}
                fill="none"
                stroke="rgba(180,180,180,0.3)"
                strokeWidth="1.5"
            />

            {/* Rim face */}
            <circle cx={CX} cy={CY} r={innerR} fill="url(#rimGrad)" />
            <circle
                cx={CX}
                cy={CY}
                r={innerR}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
            />

            {/* Rim barrel area */}
            <circle
                cx={CX}
                cy={CY}
                r={(outerR + innerR) / 2}
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={(outerR - innerR)}
            />

            {/* Spokes & details */}
            <g ref={wheelRef}>{spokes}</g>

            {/* Center hub */}
            <circle
                cx={CX}
                cy={CY}
                r={hubR}
                fill="url(#mHubGradW)"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.5"
            />
            {/* Alfa Romeo center cap hint */}
            <circle
                cx={CX}
                cy={CY}
                r="6"
                fill="#0e0e10"
                stroke="rgba(192,57,43,0.4)"
                strokeWidth="0.5"
            />
            <circle cx={CX} cy={CY} r="3" fill="#C0392B" opacity="0.6" />

            {/* Glass reflection */}
            <ellipse
                cx={CX - 12}
                cy={CY - 20}
                rx="25"
                ry="14"
                fill="rgba(255,255,255,0.02)"
                transform={`rotate(-20, ${CX - 12}, ${CY - 20})`}
            />
        </WheelSvg>
    );
}

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */
export default function MobileWheelsSection({ id }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.3 },
        );

        const section = document.getElementById(id);
        if (section) observer.observe(section);

        return () => observer.disconnect();
    }, [id]);

    return (
        <MobilePanel
            id={id}
            label="Grip"
            title="Wheels & Tires"
            action={
                <ActionPage>

                    <SpecsGrid>
                        <SpecCard>
                            <SpecLabel>Wheel Size</SpecLabel>
                            <SpecValue $large>19"</SpecValue>
                        </SpecCard>
                        <SpecCard>
                            <SpecLabel>Material</SpecLabel>
                            <SpecValue>Forged Aluminum</SpecValue>
                        </SpecCard>
                        <SpecCard className="full-width">
                            <SpecLabel>Design</SpecLabel>
                            <SpecValue>Dark 5-Hole Cloverleaf</SpecValue>
                        </SpecCard>
                    </SpecsGrid>

                    <SwipeHint>Swipe for details →</SwipeHint>
                </ActionPage>
            }
            details={
                <DetailsPage>
                    <Description>
                        Pirelli P Zero Corsa tires specifically developed for
                        high-performance driving deliver exceptional grip and precise
                        handling characteristics.
                    </Description>

                    <TireRow>
                        <TireLabel>Front Tires</TireLabel>
                        <TireSize>245/35 R19</TireSize>
                    </TireRow>
                    <TireRow>
                        <TireLabel>Rear Tires</TireLabel>
                        <TireSize>285/30 R19</TireSize>
                    </TireRow>
                </DetailsPage>
            }
            extra={
                <DetailsPage>
                    <BrakeInfo>
                        <BrakeTitle>
                            <svg
                                viewBox="0 0 24 24"
                                width="14"
                                height="14"
                                fill="none"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="#C0392B"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="6"
                                    stroke="#C0392B"
                                    strokeWidth="1"
                                />
                                <circle cx="12" cy="12" r="2.5" fill="#C0392B" />
                                {[0, 60, 120, 180, 240, 300].map((a) => {
                                    const rad = (a * Math.PI) / 180;
                                    return (
                                        <circle
                                            key={a}
                                            cx={12 + 8 * Math.cos(rad)}
                                            cy={12 + 8 * Math.sin(rad)}
                                            r="0.8"
                                            fill="#C0392B"
                                        />
                                    );
                                })}
                            </svg>
                            Brembo Carbon-Ceramic
                        </BrakeTitle>
                        <BrakeSpecs>
                            <span>Front: 390mm 6-piston</span>
                            <span>Rear: 360mm 4-piston</span>
                        </BrakeSpecs>
                    </BrakeInfo>
                </DetailsPage>
            }
        />
    );
}