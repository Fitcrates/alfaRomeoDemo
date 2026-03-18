import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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

const Section = styled.section`
  min-height: 150vh;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  padding: 0 5vw;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  max-width: 600px;
`;

const Panel = styled.div`
  width: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    rgba(22, 22, 26, 0.96) 0%,
    rgba(10, 10, 12, 0.98) 100%
  );
  border: 1px solid rgba(192, 57, 43, 0.25);
  border-radius: 14px;
  padding: 2.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(192, 57, 43, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  opacity: 0;
  transform: translateY(30px);

  /* Carbon fiber texture */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.015) 2px,
        rgba(255, 255, 255, 0.015) 4px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.015) 2px,
        rgba(255, 255, 255, 0.015) 4px
      );
    pointer-events: none;
    z-index: 0;
    border-radius: inherit;
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const SectionLabel = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.75rem;
  color: #c0392b;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  margin-bottom: 0.5rem;
  text-align: left;
`;

const Title = styled.h2`
  font-family: "Orbitron", sans-serif;
  font-size: 1.8rem;
  color: #ffffff;
  margin-bottom: 1.5rem;
  letter-spacing: 0.1em;
  text-align: left;
`;

const FlagDivider = styled.div`
  width: 60px;
  height: 3px;
  border-radius: 2px;
  margin-bottom: 1.5rem;
  background: linear-gradient(
    90deg,
    #009246 0%,
    #009246 33%,
    #ffffff 33%,
    #ffffff 66%,
    #ce2b37 66%,
    #ce2b37 100%
  );
  opacity: 0.6;
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ColorSwatch = styled.button`
  aspect-ratio: 1;
  border-radius: 12px;
  border: 3px solid
    ${(props) => (props.$active ? props.$accent : "transparent")};
  background: ${(props) => props.$color};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: ${(props) =>
    props.$active
      ? `0 0 20px ${props.$accent}60, inset 0 0 20px rgba(255, 255, 255, 0.1)`
      : "0 4px 15px rgba(0, 0, 0, 0.3)"};

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 25px ${(props) => props.$accent}40;
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
    bottom: 5px;
    right: 5px;
    font-size: 0.8rem;
    color: ${(props) => (props.$color === "#F5F5F5" ? "#333" : "#fff")};
  }
`;

const ColorInfo = styled.div`
  text-align: left;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.03) 100%
  );
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(255, 255, 255, 0.04) inset;

  /* Glass highlight at top edge */
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
      rgba(255, 255, 255, 0.15) 30%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.15) 70%,
      transparent 100%
    );
    pointer-events: none;
  }

  /* Subtle inner glow */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      ellipse at 30% 0%,
      rgba(255, 255, 255, 0.04) 0%,
      transparent 60%
    );
    pointer-events: none;
  }
`;

const ColorName = styled.h3`
  font-family: "Orbitron", sans-serif;
  font-size: 1.2rem;
  color: ${(props) => props.$color};
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
  text-shadow: 0 0 20px ${(props) => props.$color}40;
  position: relative;
  z-index: 1;
`;

const ColorCode = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  position: relative;
  z-index: 1;
`;

const ColorDescription = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 1rem;
  line-height: 1.5;
  position: relative;
  z-index: 1;
`;

export default function GallerySection({ id, onColorChange }) {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const [activeColor, setActiveColor] = useState(colors[0]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          gsap.to(panel, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
          });
        },
        onLeave: () => {
          gsap.to(panel, {
            opacity: 0,
            y: 30,
            duration: 0.5,
          });
        },
        onEnterBack: () => {
          gsap.to(panel, {
            opacity: 1,
            y: 0,
            duration: 0.5,
          });
        },
        onLeaveBack: () => {
          gsap.to(panel, {
            opacity: 0,
            y: 30,
            duration: 0.5,
          });
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const handleColorSelect = (color) => {
    setActiveColor(color);
    if (onColorChange) {
      onColorChange(color.hex);
    }
  };

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

  return (
    <Section ref={sectionRef} id={id}>
      <ContentWrapper>
        <Panel ref={panelRef}>
          <SectionLabel>Personalize</SectionLabel>
          <Title>Choose Your Color</Title>
          <FlagDivider />

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
              Color Code: {activeColor.hex.toUpperCase()}
            </ColorCode>
            <ColorDescription>
              {getColorDescription(activeColor.id)}
            </ColorDescription>
          </ColorInfo>
        </Panel>
      </ContentWrapper>
    </Section>
  );
}