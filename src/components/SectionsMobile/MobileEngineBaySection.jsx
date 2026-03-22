import { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import MobilePanel from "./MobilePanel";

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(192, 57, 43, 0.2); }
  50% { box-shadow: 0 0 20px rgba(192, 57, 43, 0.5); }
`;

/* ── Action page styles ── */

const ActionPage = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
`;

const Description = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
  margin: 0;
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
`;

const SpecLabel = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 0.25rem;
`;

const SpecValue = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: ${(p) => (p.$large ? "1.1rem" : "0.75rem")};
  color: ${(p) => (p.$accent ? "#c0392b" : "#ffffff")};
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
  gap: 10px;
`;

const DetailRow = styled.div`
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

const DetailLabel = styled.span`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const DetailValue = styled.span`
  font-family: "Orbitron", sans-serif;
  font-size: 0.65rem;
  color: #ffffff;
`;

/* ── Hood Lever ── */

const LeverHousing = styled.div`
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
  padding: 12px;

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
    z-index: 2;
  }
`;

const LeverRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
`;

const LeverIconFrame = styled.div`
  width: 42px;
  height: 42px;
  min-width: 42px;
  border-radius: 8px;
  background: linear-gradient(
    145deg,
    rgba(192, 57, 43, 0.12),
    rgba(139, 0, 0, 0.08)
  );
  border: 1px solid
    ${(props) =>
        props.$active
            ? "rgba(192, 57, 43, 0.5)"
            : "rgba(192, 57, 43, 0.2)"};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s ease;

  ${(props) =>
        props.$active &&
        css`
      background: linear-gradient(
        145deg,
        rgba(192, 57, 43, 0.25),
        rgba(139, 0, 0, 0.18)
      );
      animation: ${pulse} 2s ease-in-out infinite;
    `}

  svg {
    width: 24px;
    height: 24px;
    transition: all 0.4s ease;
  }
`;

const LeverTextBlock = styled.div`
  flex: 1;

  .lever-title {
    font-family: "Orbitron", sans-serif;
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 2px;
  }

  .lever-state {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    transition: color 0.3s ease;
    color: ${(props) =>
        props.$active ? "#C0392B" : "rgba(255, 255, 255, 0.55)"};
  }
`;

const LeverHandle = styled.button`
  position: relative;
  width: 48px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid
    ${(props) =>
        props.$active
            ? "rgba(192, 57, 43, 0.6)"
            : "rgba(255, 255, 255, 0.1)"};
  background: ${(props) =>
        props.$active
            ? "linear-gradient(180deg, rgba(192, 57, 43, 0.35) 0%, rgba(139, 0, 0, 0.25) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"};
  cursor: pointer;
  transition: all 0.35s ease;
  outline: none;

  &::after {
    content: "";
    position: absolute;
    bottom: ${(props) => (props.$active ? "4px" : "12px")};
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 3px;
    border-radius: 2px;
    background: ${(props) =>
        props.$active ? "#C0392B" : "rgba(255, 255, 255, 0.2)"};
    transition: all 0.35s ease;
    box-shadow: ${(props) =>
        props.$active ? "0 0 8px rgba(192, 57, 43, 0.5)" : "none"};
  }

  &::before {
    content: "";
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 12px;
    background: repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06) 0px,
      rgba(255, 255, 255, 0.06) 1px,
      transparent 1px,
      transparent 3px
    );
    border-radius: 1px;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-right: 0.35rem;
  vertical-align: middle;
  transition: all 0.3s ease;
  background: ${(props) =>
        props.$active ? "#C0392B" : "rgba(255, 255, 255, 0.2)"};
  box-shadow: ${(props) =>
        props.$active ? "0 0 6px rgba(192, 57, 43, 0.6)" : "none"};
`;

/* ── Hood SVG icon ── */

function HoodIcon({ open }) {
    return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M8 42 L14 34 L24 30 L40 30 L50 34 L56 42 L56 46 L8 46 Z"
                fill="rgba(255,255,255,0.06)"
                stroke={open ? "#C0392B" : "rgba(255,255,255,0.35)"}
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d={
                    open
                        ? "M24 30 L14 34 L14 20 L22 18 Z"
                        : "M24 30 L14 34 L14 34 L24 30 Z"
                }
                fill={open ? "rgba(192, 57, 43, 0.15)" : "none"}
                stroke={open ? "#C0392B" : "rgba(255,255,255,0.35)"}
                strokeWidth="1.5"
                strokeLinejoin="round"
                style={{ transition: "all 0.5s ease" }}
            />
            {open && (
                <line
                    x1="19"
                    y1="19"
                    x2="19"
                    y2="30"
                    stroke="#C0392B"
                    strokeWidth="1"
                    opacity="0.6"
                />
            )}
            <path
                d="M24 30 L28 24 L38 24 L40 30"
                fill="rgba(255,255,255,0.04)"
                stroke={
                    open ? "rgba(192,57,43,0.4)" : "rgba(255,255,255,0.25)"
                }
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            <path
                d="M28 24 L30 21 L36 21 L38 24"
                fill="rgba(255,255,255,0.03)"
                stroke={
                    open ? "rgba(192,57,43,0.3)" : "rgba(255,255,255,0.2)"
                }
                strokeWidth="1"
                strokeLinejoin="round"
            />
            <circle
                cx="18"
                cy="46"
                r="5"
                fill="rgba(0,0,0,0.5)"
                stroke={
                    open ? "rgba(192,57,43,0.5)" : "rgba(255,255,255,0.3)"
                }
                strokeWidth="1.5"
            />
            <circle
                cx="18"
                cy="46"
                r="2"
                fill="none"
                stroke={
                    open ? "rgba(192,57,43,0.3)" : "rgba(255,255,255,0.15)"
                }
                strokeWidth="0.8"
            />
            <circle
                cx="46"
                cy="46"
                r="5"
                fill="rgba(0,0,0,0.5)"
                stroke={
                    open ? "rgba(192,57,43,0.5)" : "rgba(255,255,255,0.3)"
                }
                strokeWidth="1.5"
            />
            <circle
                cx="46"
                cy="46"
                r="2"
                fill="none"
                stroke={
                    open ? "rgba(192,57,43,0.3)" : "rgba(255,255,255,0.15)"
                }
                strokeWidth="0.8"
            />
            <line
                x1="4"
                y1="51"
                x2="60"
                y2="51"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
            />
        </svg>
    );
}

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */
export default function MobileEngineBaySection({
    id,
    onHoodToggle,
    hoodOpen,
}) {
    return (
        <MobilePanel
            id={id}
            label="Heart of the Beast"
            title="2.9L V6 Bi-Turbo"
            action={
                <ActionPage>
                    <Description>
                        Ferrari-derived twin-turbocharged V6 with aluminum block and
                        heads. Direct injection delivers explosive power with Italian
                        precision.
                    </Description>

                    <SpecsGrid>
                        <SpecCard>
                            <SpecLabel>Displacement</SpecLabel>
                            <SpecValue $large $accent>
                                2,891
                            </SpecValue>
                            <SpecLabel>cc</SpecLabel>
                        </SpecCard>
                        <SpecCard>
                            <SpecLabel>V-Angle</SpecLabel>
                            <SpecValue $large $accent>
                                90°
                            </SpecValue>
                        </SpecCard>
                        <SpecCard>
                            <SpecLabel>Redline</SpecLabel>
                            <SpecValue $large $accent>
                                6,500
                            </SpecValue>
                            <SpecLabel>RPM</SpecLabel>
                        </SpecCard>
                        <SpecCard>
                            <SpecLabel>Compression</SpecLabel>
                            <SpecValue $large $accent>
                                11.0:1
                            </SpecValue>
                        </SpecCard>
                    </SpecsGrid>

                    <SwipeHint>Swipe for details →</SwipeHint>
                </ActionPage>
            }
            details={
                <DetailsPage>
                    <LeverHousing>
                        <LeverRow>
                            <LeverIconFrame $active={hoodOpen}>
                                <HoodIcon open={hoodOpen} />
                            </LeverIconFrame>

                            <LeverTextBlock $active={hoodOpen}>
                                <div className="lever-title">Hood Release</div>
                                <div className="lever-state">
                                    <StatusDot $active={hoodOpen} />
                                    {hoodOpen ? "Engine Exposed" : "Hood Secured"}
                                </div>
                            </LeverTextBlock>

                            <LeverHandle
                                $active={hoodOpen}
                                onClick={() => onHoodToggle?.(!hoodOpen)}
                                aria-label={
                                    hoodOpen ? "Close hood" : "Open hood"
                                }
                            />
                        </LeverRow>
                    </LeverHousing>

                    <DetailRow>
                        <DetailLabel>Configuration</DetailLabel>
                        <DetailValue>V6 Twin-Turbo</DetailValue>
                    </DetailRow>
                    <DetailRow>
                        <DetailLabel>Injection</DetailLabel>
                        <DetailValue>Direct GDI</DetailValue>
                    </DetailRow>
                    <DetailRow>
                        <DetailLabel>Block Material</DetailLabel>
                        <DetailValue>Aluminum Alloy</DetailValue>
                    </DetailRow>
                    <DetailRow>
                        <DetailLabel>Valve Timing</DetailLabel>
                        <DetailValue>Variable VVT</DetailValue>
                    </DetailRow>
                    <DetailRow>
                        <DetailLabel>Turbocharger</DetailLabel>
                        <DetailValue>Twin-Scroll Bi-Turbo</DetailValue>
                    </DetailRow>
                </DetailsPage>
            }
        />
    );
}