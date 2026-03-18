import { useRef, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 15px rgba(192, 57, 43, 0.2); }
  50% { box-shadow: 0 0 30px rgba(192, 57, 43, 0.5); }
`;

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
  max-width: 450px;
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
  margin-bottom: 1rem;
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
  margin-bottom: 2rem;
`;

const SpecGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

const SpecItem = styled.div`
  padding: 1rem;
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

  .value {
    font-family: "Orbitron", sans-serif;
    font-size: 1.3rem;
    color: #c0392b;
    margin-bottom: 0.25rem;
    position: relative;
    z-index: 1;
  }

  .label {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    position: relative;
    z-index: 1;
  }
`;

/* ── Hood Lever ── */

const LeverHousing = styled.div`
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
  padding: 1.25rem 1.5rem;
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
    z-index: 2;
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

const LeverRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
`;

const LeverIconFrame = styled.div`
  width: 52px;
  height: 52px;
  min-width: 52px;
  border-radius: 10px;
  background: linear-gradient(
    145deg,
    rgba(192, 57, 43, 0.12),
    rgba(139, 0, 0, 0.08)
  );
  border: 1px solid
    ${(props) =>
      props.$active ? "rgba(192, 57, 43, 0.5)" : "rgba(192, 57, 43, 0.2)"};
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
    width: 30px;
    height: 30px;
    transition: all 0.4s ease;
  }
`;

const LeverTextBlock = styled.div`
  flex: 1;

  .lever-title {
    font-family: "Orbitron", sans-serif;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 0.15rem;
  }

  .lever-state {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.85rem;
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
  width: 56px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid
    ${(props) =>
      props.$active ? "rgba(192, 57, 43, 0.6)" : "rgba(255, 255, 255, 0.1)"};
  background: ${(props) =>
    props.$active
      ? "linear-gradient(180deg, rgba(192, 57, 43, 0.35) 0%, rgba(139, 0, 0, 0.25) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"};
  cursor: pointer;
  transition: all 0.35s ease;
  outline: none;

  /* The pull-tab nub */
  &::after {
    content: "";
    position: absolute;
    bottom: ${(props) => (props.$active ? "4px" : "14px")};
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 4px;
    border-radius: 2px;
    background: ${(props) =>
      props.$active ? "#C0392B" : "rgba(255, 255, 255, 0.2)"};
    transition: all 0.35s ease;
    box-shadow: ${(props) =>
      props.$active ? "0 0 8px rgba(192, 57, 43, 0.5)" : "none"};
  }

  /* Grip ridges */
  &::before {
    content: "";
    position: absolute;
    top: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 14px;
    background: repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06) 0px,
      rgba(255, 255, 255, 0.06) 1px,
      transparent 1px,
      transparent 4px
    );
    border-radius: 1px;
    pointer-events: none;
  }

  &:hover {
    border-color: rgba(192, 57, 43, 0.5);
    background: linear-gradient(
      180deg,
      rgba(192, 57, 43, 0.2) 0%,
      rgba(139, 0, 0, 0.12) 100%
    );
  }

  &:active {
    transform: scale(0.96);
  }
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 0.4rem;
  vertical-align: middle;
  transition: all 0.3s ease;
  background: ${(props) =>
    props.$active ? "#C0392B" : "rgba(255, 255, 255, 0.2)"};
  box-shadow: ${(props) =>
    props.$active ? "0 0 6px rgba(192, 57, 43, 0.6)" : "none"};
`;

/* ── Car-with-open-hood SVG icon ── */

function HoodIcon({ open }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Car body */}
      <path
        d="M8 42 L14 34 L24 30 L40 30 L50 34 L56 42 L56 46 L8 46 Z"
        fill="rgba(255,255,255,0.06)"
        stroke={open ? "#C0392B" : "rgba(255,255,255,0.35)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Hood (the front panel that tilts open) */}
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
        style={{
          transition: "all 0.5s ease",
        }}
      />

      {/* Hood prop rod when open */}
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

      {/* Windshield */}
      <path
        d="M24 30 L28 24 L38 24 L40 30"
        fill="rgba(255,255,255,0.04)"
        stroke={open ? "rgba(192,57,43,0.4)" : "rgba(255,255,255,0.25)"}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Roof */}
      <path
        d="M28 24 L30 21 L36 21 L38 24"
        fill="rgba(255,255,255,0.03)"
        stroke={open ? "rgba(192,57,43,0.3)" : "rgba(255,255,255,0.2)"}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Front wheel */}
      <circle
        cx="18"
        cy="46"
        r="5"
        fill="rgba(0,0,0,0.5)"
        stroke={open ? "rgba(192,57,43,0.5)" : "rgba(255,255,255,0.3)"}
        strokeWidth="1.5"
      />
      <circle
        cx="18"
        cy="46"
        r="2"
        fill="none"
        stroke={open ? "rgba(192,57,43,0.3)" : "rgba(255,255,255,0.15)"}
        strokeWidth="0.8"
      />

      {/* Rear wheel */}
      <circle
        cx="46"
        cy="46"
        r="5"
        fill="rgba(0,0,0,0.5)"
        stroke={open ? "rgba(192,57,43,0.5)" : "rgba(255,255,255,0.3)"}
        strokeWidth="1.5"
      />
      <circle
        cx="46"
        cy="46"
        r="2"
        fill="none"
        stroke={open ? "rgba(192,57,43,0.3)" : "rgba(255,255,255,0.15)"}
        strokeWidth="0.8"
      />

      {/* Ground line */}
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

export default function EngineBaySection({ id, onHoodToggle, hoodOpen }) {
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
          // Turn off hood transparency when leaving section
          if (hoodOpen && onHoodToggle) {
            onHoodToggle();
          }
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
          // Turn off hood transparency when leaving section
          if (hoodOpen && onHoodToggle) {
            onHoodToggle();
          }
        },
      });
    });

    return () => ctx.revert();
  }, [hoodOpen, onHoodToggle]);

  return (
    <Section ref={sectionRef} id={id}>
      <ContentWrapper>
        <Panel ref={panelRef}>
          <SectionLabel>Heart of the Beast</SectionLabel>
          <Title>2.9L V6 Bi-Turbo</Title>
          <FlagDivider />
          <Description>
            Ferrari-derived twin-turbocharged V6 engine with aluminum block and
            heads. Direct injection with variable valve timing delivers
            explosive power with Italian precision.
          </Description>

          <SpecGrid>
            <SpecItem>
              <div className="value">2,891</div>
              <div className="label">Displacement (cc)</div>
            </SpecItem>
            <SpecItem>
              <div className="value">90°</div>
              <div className="label">V-Angle</div>
            </SpecItem>
            <SpecItem>
              <div className="value">6,500</div>
              <div className="label">Redline (RPM)</div>
            </SpecItem>
            <SpecItem>
              <div className="value">11.0:1</div>
              <div className="label">Compression</div>
            </SpecItem>
          </SpecGrid>

          <LeverHousing>
            <LeverRow>
              <LeverIconFrame $active={hoodOpen}>
                <HoodIcon open={hoodOpen} />
              </LeverIconFrame>

              <LeverTextBlock $active={hoodOpen}>
                <div className="lever-title">Hood Release</div>
                <div className="lever-state">
                  <StatusDot $active={hoodOpen} />
                  {hoodOpen ? "Engine Bay Exposed" : "Hood Secured"}
                </div>
              </LeverTextBlock>

              <LeverHandle
                $active={hoodOpen}
                onClick={() => onHoodToggle?.(!hoodOpen)}
                aria-label={hoodOpen ? "Close hood" : "Open hood"}
              />
            </LeverRow>
          </LeverHousing>
        </Panel>
      </ContentWrapper>
    </Section>
  );
}