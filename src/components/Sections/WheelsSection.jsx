import { useRef, useEffect } from "react";
import styled from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Section = styled.section`
  min-height: 150vh;
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 5vw;
`;

const ContentWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 520px;
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
  transform: translateX(50px);

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
`;

const Title = styled.h2`
  font-family: "Orbitron", sans-serif;
  font-size: 1.8rem;
  color: #ffffff;
  margin-bottom: 1.5rem;
  letter-spacing: 0.1em;
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

const Description = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const SpecsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SpecCard = styled.div`
  padding: 1.1rem;
  text-align: center;
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

  &.full-width {
    grid-column: 1 / -1;
  }

  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.04) 50%,
      rgba(192, 57, 43, 0.06) 100%
    );
    border-color: rgba(192, 57, 43, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(192, 57, 43, 0.06),
      0 1px 2px rgba(255, 255, 255, 0.06) inset;
    transform: translateY(-1px);
  }
`;

const SpecLabel = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 0.4rem;
  position: relative;
  z-index: 1;
`;

const SpecValue = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: ${(p) => (p.$large ? "1.3rem" : "0.95rem")};
  color: #ffffff;
  font-weight: 600;
  position: relative;
  z-index: 1;
`;

const TireInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const TireRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1rem;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid #c0392b;
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

  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.04) 50%,
      rgba(192, 57, 43, 0.06) 100%
    );
    border-color: rgba(192, 57, 43, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(192, 57, 43, 0.06),
      0 1px 2px rgba(255, 255, 255, 0.06) inset;
    transform: translateY(-1px);
  }
`;

const TireLabel = styled.span`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  position: relative;
  z-index: 1;
`;

const TireSize = styled.span`
  font-family: "Orbitron", sans-serif;
  font-size: 0.85rem;
  color: #ffffff;
  position: relative;
  z-index: 1;
`;

const BrakeInfo = styled.div`
  margin-top: 1.25rem;
  padding: 1.1rem;
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
  transition: all 0.3s ease;

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

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.04) 50%,
      rgba(192, 57, 43, 0.06) 100%
    );
    border-color: rgba(192, 57, 43, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(192, 57, 43, 0.06),
      0 1px 2px rgba(255, 255, 255, 0.06) inset;
    transform: translateY(-1px);
  }
`;

const BrakeTitle = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: 0.8rem;
  color: #c0392b;
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }
`;

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */
export default function WheelsSection({ id }) {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);

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
            x: 0,
            duration: 0.8,
            ease: "power3.out",
          });
        },
        onLeave: () => {
          gsap.to(panel, {
            opacity: 0,
            x: 50,
            duration: 0.5,
          });
        },
        onEnterBack: () => {
          gsap.to(panel, {
            opacity: 1,
            x: 0,
            duration: 0.5,
          });
        },
        onLeaveBack: () => {
          gsap.to(panel, {
            opacity: 0,
            x: 50,
            duration: 0.5,
          });
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <Section ref={sectionRef} id={id}>
      <ContentWrapper>
        <Panel ref={panelRef}>
          <SectionLabel>Grip</SectionLabel>
          <Title>Wheels & Tires</Title>
          <FlagDivider />

          <Description>
            The Alfa Romeo Giulia Quadrifoglio comes standard with Pirelli P
            Zero or Pirelli P Zero Corsa tires, specifically developed for
            high-performance driving. These ultra-high-performance tires
            deliver exceptional grip and precise handling characteristics.
          </Description>

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

          <TireInfo>
            <TireRow>
              <TireLabel>Front Tires</TireLabel>
              <TireSize>245/35 R19</TireSize>
            </TireRow>
            <TireRow>
              <TireLabel>Rear Tires</TireLabel>
              <TireSize>285/30 R19</TireSize>
            </TireRow>
          </TireInfo>

          <BrakeInfo>
            <BrakeTitle>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
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
              Brembo Carbon-Ceramic Brakes
            </BrakeTitle>
            <BrakeSpecs>
              <span>Front: 390mm 6-piston</span>
              <span>Rear: 360mm 4-piston</span>
            </BrakeSpecs>
          </BrakeInfo>
        </Panel>
      </ContentWrapper>
    </Section>
  );
}