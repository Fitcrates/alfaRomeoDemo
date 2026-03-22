import { useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";

const modes = [
    { id: "race", label: "RACE", fullName: "Race", color: "#ff0000" },
    { id: "dynamic", label: "d", fullName: "Dynamic", color: "#3b82f6" },
    { id: "natural", label: "n", fullName: "Natural", color: "#ffffff" },
    {
        id: "efficient",
        label: "a",
        fullName: "All Weather",
        color: "#27ae60",
    },
];

const glowPulse = keyframes`
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
`;

const hintPulse = keyframes`
  0%, 70%, 100% { opacity: 0; }
  30%, 50% { opacity: 1; }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  transform: scale(0.8);
  transform-origin: top center;
`;

const DnaTitle = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.3em;
  text-transform: uppercase;
`;

const CarbonSurround = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: #0c0c0e;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.02) 2px,
        rgba(255, 255, 255, 0.02) 4px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.02) 2px,
        rgba(255, 255, 255, 0.02) 4px
      );
    pointer-events: none;
  }
`;

const OuterBezel = styled.div`
  position: relative;
  width: 136px;
  height: 136px;
  border-radius: 50%;
  background: linear-gradient(
    145deg,
    #6a6a6e 0%,
    #3a3a3e 20%,
    #555558 40%,
    #2a2a2e 60%,
    #4a4a4e 80%,
    #3a3a3e 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);

  &::before {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: linear-gradient(
      160deg,
      #555558 0%,
      #3a3a3e 30%,
      #4a4a4e 50%,
      #2d2d30 70%,
      #3a3a3e 100%
    );
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4),
      inset 0 -1px 1px rgba(255, 255, 255, 0.08);
  }
`;

const DialFace = styled.div`
  position: relative;
  width: 116px;
  height: 116px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 45% 40%,
    #1e1e22 0%,
    #141416 40%,
    #0e0e10 100%
  );
  z-index: 1;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6),
    inset 0 -1px 3px rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.97);
  }
`;

const ModeLabel = styled.div`
  position: absolute;
  font-weight: ${(p) => (p.$isRace ? "700" : "600")};
  font-family: ${(p) =>
        p.$isRace ? "'Orbitron', sans-serif" : "'Rajdhani', sans-serif"};
  font-size: ${(p) => (p.$isRace ? "0.5rem" : "0.85rem")};
  letter-spacing: ${(p) => (p.$isRace ? "0.15em" : "0.02em")};
  text-transform: ${(p) => (p.$isRace ? "uppercase" : "lowercase")};
  color: ${(p) => (p.$active ? p.$color : "rgba(255, 255, 255, 0.12)")};
  text-shadow: ${(p) =>
        p.$active
            ? `0 0 8px ${p.$color}90, 0 0 16px ${p.$color}40`
            : "none"};
  transition: color 0.4s ease, text-shadow 0.4s ease;
  pointer-events: none;
  animation: ${(p) => (p.$active ? glowPulse : "none")} 2s ease-in-out
    infinite;
  line-height: 1;
`;

const ClickHintRing = styled.div`
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1px solid rgba(192, 57, 43, 0.25);
  animation: ${hintPulse} 4s ease-in-out infinite;
  animation-delay: 2s;
  pointer-events: none;
  z-index: 2;
`;

const InnerChromeRing = styled.div`
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: linear-gradient(
    145deg,
    #5a5a5e 0%,
    #3a3a3e 25%,
    #4a4a4e 50%,
    #2a2a2e 75%,
    #3a3a3e 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
`;

const CenterKnob = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 45% 40%,
    #222226 0%,
    #18181c 50%,
    #101014 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.5),
    inset 0 -1px 2px rgba(255, 255, 255, 0.04);
`;

const ShockIcon = styled.div`
  color: ${(p) => p.$color || "#C0392B"};
  transition: color 0.4s ease, filter 0.4s ease;
  filter: drop-shadow(0 0 4px ${(p) => p.$color || "#C0392B"}60);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(15deg);
`;

const ModeInfo = styled.div`
  text-align: center;
`;

const ModeName = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${(p) => p.$color};
  text-transform: uppercase;
  letter-spacing: 0.12em;
  text-shadow: 0 0 14px ${(p) => p.$color}60;
  margin-bottom: 0.1rem;
  transition: color 0.4s ease, text-shadow 0.4s ease;
`;

const ModeDescription = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
`;

function ShockAbsorberSvg({ color = "#C0392B", size = 20 }) {
    return (
        <svg
            viewBox="0 0 40 60"
            width={size}
            height={size * 1.5}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="20" cy="6" r="3" />
            <line x1="20" y1="9" x2="20" y2="14" />
            <polyline points="14,16 26,20 14,24 26,28 14,32 26,36" />
            <rect x="13" y="36" width="14" height="10" rx="1.5" fill={color} />
            <line x1="20" y1="46" x2="20" y2="51" />
            <circle cx="20" cy="54" r="3" />
        </svg>
    );
}

const labelPositions = {
    dynamic: { top: "28%", left: "19%", transform: "translate(-50%, -50%)" },
    natural: { top: "48%", left: "13%", transform: "translate(-50%, -50%)" },
    efficient: { top: "68%", left: "17%", transform: "translate(-50%, -50%)" },
    race: { top: "15%", right: "14%", transform: "translate(-80%, -80%)" },
};

const descriptions = {
    dynamic: "Maximum performance & responsiveness",
    natural: "Balanced everyday driving",
    efficient: "Optimized fuel economy",
    race: "Track-focused, all systems maximized",
};

export default function MobileDnaModeRotary({
    onModeChange,
    initialMode = "race",
}) {
    const [activeMode, setActiveMode] = useState(initialMode);
    const [hasClicked, setHasClicked] = useState(false);
    const modeIndex = modes.findIndex((m) => m.id === activeMode);

    const handleClick = useCallback(() => {
        setHasClicked(true);
        const nextIndex = (modeIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];
        setActiveMode(nextMode.id);
        if (onModeChange) onModeChange(nextMode);
    }, [modeIndex, onModeChange]);

    const currentMode = modes[modeIndex];
    const activeColor = currentMode.color;

    return (
        <Container>
            <DnaTitle>Alfa™ DNA Pro</DnaTitle>

            <CarbonSurround>
                <OuterBezel>
                    <DialFace onClick={handleClick}>
                        {modes.map((mode) => {
                            const pos = labelPositions[mode.id];
                            return (
                                <ModeLabel
                                    key={mode.id}
                                    $active={activeMode === mode.id}
                                    $color={mode.color}
                                    $isRace={mode.id === "race"}
                                    style={pos}
                                >
                                    {mode.label}
                                </ModeLabel>
                            );
                        })}

                        {!hasClicked && <ClickHintRing />}

                        <InnerChromeRing>
                            <CenterKnob>
                                <ShockIcon $color={activeColor}>
                                    <ShockAbsorberSvg color={activeColor} size={14} />
                                </ShockIcon>
                            </CenterKnob>
                        </InnerChromeRing>
                    </DialFace>
                </OuterBezel>
            </CarbonSurround>

            <ModeInfo>
                <ModeName $color={activeColor}>{currentMode.fullName}</ModeName>
                <ModeDescription>{descriptions[activeMode]}</ModeDescription>
            </ModeInfo>
        </Container>
    );
}