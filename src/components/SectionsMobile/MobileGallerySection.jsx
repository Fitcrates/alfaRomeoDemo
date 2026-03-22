import { useState } from "react";
import styled from "styled-components";
import MobilePanel from "./MobilePanel";

const colors = [
    {
        id: "rosso",
        name: "Rosso Competizione",
        hex: "#8B0000",
        accent: "#C0392B",
    },
    {
        id: "misano",
        name: "Misano Blue",
        hex: "#0047AB",
        accent: "#0066CC",
    },
    {
        id: "verde",
        name: "Verde Montreal",
        hex: "#1B4D3E",
        accent: "#2E8B57",
    },
    {
        id: "nero",
        name: "Nero Vulcano",
        hex: "#1a1a1a",
        accent: "#333333",
    },
];

const getColorDescription = (id) => {
    switch (id) {
        case "rosso":
            return "The iconic Alfa Romeo red. A symbol of passion, speed, and Italian racing heritage since 1910.";
        case "misano":
            return "Pure and pristine blue. A modern interpretation of classic elegance that highlights every curve.";
        case "verde":
            return "The legendary Montreal green. A tribute to the 1970 concept car that defined Alfa Romeo design.";
        case "nero":
            return "Deep volcanic black. Mysterious and powerful, absorbing light to reveal sculptural forms.";
        default:
            return "";
    }
};

/* ── Action page styles ── */

const ActionPage = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 12px;
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
`;

const ColorSwatch = styled.button`
  aspect-ratio: 1;
  border-radius: 10px;
  border: 3px solid
    ${(props) => (props.$active ? props.$accent : "transparent")};
  background: ${(props) => props.$color};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: ${(props) =>
        props.$active
            ? `0 0 16px ${props.$accent}60, inset 0 0 16px rgba(255, 255, 255, 0.1)`
            : "0 4px 12px rgba(0, 0, 0, 0.3)"};

  &:active {
    transform: scale(0.95);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2) 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.2) 100%
    );
  }

  &::after {
    content: ${(props) => (props.$active ? "'✓'" : "''")};
    position: absolute;
    bottom: 4px;
    right: 4px;
    font-size: 0.7rem;
    color: ${(props) => (props.$color === "#F5F5F5" ? "#333" : "#fff")};
  }
`;

const ColorInfo = styled.div`
  text-align: left;
  padding: 12px;
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

const ColorName = styled.h3`
  font-family: "Orbitron", sans-serif;
  font-size: 0.85rem;
  color: ${(props) => props.$color};
  margin: 0 0 4px;
  letter-spacing: 0.1em;
  text-shadow: 0 0 20px ${(props) => props.$color}40;
  position: relative;
  z-index: 1;
`;

const ColorCode = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin: 0;
  position: relative;
  z-index: 1;
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

const Description = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
  margin: 0;
`;

const ColorPreview = styled.div`
  width: 100%;
  height: 80px;
  border-radius: 10px;
  background: ${(props) => props.$color};
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px ${(props) => props.$accent}30;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.15) 100%
    );
  }

  &::after {
    content: "";
    position: absolute;
    top: 10%;
    left: 5%;
    width: 60%;
    height: 30%;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    filter: blur(10px);
    transform: rotate(-10deg);
  }
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid ${(props) => props.$accent || "#c0392b"};
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

const FinishGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const FinishCard = styled.div`
  padding: 10px;
  text-align: center;
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

const FinishLabel = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 4px;
`;

const FinishValue = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: 0.7rem;
  color: #ffffff;
  font-weight: 600;
`;

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */
export default function MobileGallerySection({ id, onColorChange }) {
    const [activeColor, setActiveColor] = useState(colors[0]);

    const handleColorSelect = (color) => {
        setActiveColor(color);
        if (onColorChange) {
            onColorChange(color.hex);
        }
    };

    return (
        <MobilePanel
            id={id}
            label="Personalize"
            title="Choose Your Color"
            action={
                <ActionPage>
                    <ColorGrid>
                        {colors.map((color) => (
                            <ColorSwatch
                                key={color.id}
                                $color={color.hex}
                                $accent={color.accent}
                                $active={activeColor.id === color.id}
                                onClick={() => handleColorSelect(color)}
                                aria-label={color.name}
                            />
                        ))}
                    </ColorGrid>

                    <ColorInfo>
                        <ColorName $color={activeColor.accent}>
                            {activeColor.name}
                        </ColorName>
                        <ColorCode>
                            Code: {activeColor.hex.toUpperCase()}
                        </ColorCode>
                    </ColorInfo>

                    <SwipeHint>Swipe for details →</SwipeHint>
                </ActionPage>
            }
            details={
                <DetailsPage>
                    <ColorPreview
                        $color={activeColor.hex}
                        $accent={activeColor.accent}
                    />

                    <Description>{getColorDescription(activeColor.id)}</Description>

                    <DetailRow $accent={activeColor.accent}>
                        <DetailLabel>Paint Type</DetailLabel>
                        <DetailValue>Tri-Coat Metallic</DetailValue>
                    </DetailRow>

                    <DetailRow $accent={activeColor.accent}>
                        <DetailLabel>Layers</DetailLabel>
                        <DetailValue>3-Stage</DetailValue>
                    </DetailRow>

                    <FinishGrid>
                        <FinishCard>
                            <FinishLabel>Clear Coat</FinishLabel>
                            <FinishValue>Ceramic</FinishValue>
                        </FinishCard>
                        <FinishCard>
                            <FinishLabel>Protection</FinishLabel>
                            <FinishValue>PPF Ready</FinishValue>
                        </FinishCard>
                    </FinishGrid>
                </DetailsPage>
            }
        />
    );
}