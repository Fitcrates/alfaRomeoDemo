import { useRef, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const glow = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
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
  justify-content: flex-start;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 500px;
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
  transform: translateX(-50px);

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

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
`;

const FeatureCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.03) 100%
  );
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(255, 255, 255, 0.04) inset;

  /* Glass highlight at the top edge */
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
    border-radius: inherit;
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

const FeatureIcon = styled.div`
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: linear-gradient(
    145deg,
    rgba(192, 57, 43, 0.15),
    rgba(139, 0, 0, 0.1)
  );
  border: 1px solid rgba(192, 57, 43, 0.25);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;

  svg {
    width: 20px;
    height: 20px;
    stroke: #c0392b;
    fill: none;
    stroke-width: 1.5;
  }
`;

const FeatureContent = styled.div`
  flex: 1;
  position: relative;
  z-index: 1;

  h4 {
    font-family: "Orbitron", sans-serif;
    font-size: 0.85rem;
    color: #ffffff;
    margin-bottom: 0.25rem;
    letter-spacing: 0.05em;
  }

  p {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.82rem;
    color: rgba(255, 255, 255, 0.45);
    line-height: 1.4;
  }
`;

const AmbientLightStrip = styled.div`
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(
    160deg,
    rgba(18, 18, 20, 1) 0%,
    rgba(8, 8, 10, 1) 100%
  );
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;

  /* Strong carbon fiber for the housing */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.03) 2px,
        rgba(255, 255, 255, 0.03) 4px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.03) 2px,
        rgba(255, 255, 255, 0.03) 4px
      );
    pointer-events: none;
    border-radius: inherit;
  }

  /* Machined edge */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    pointer-events: none;
  }
`;

const LightStripHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
`;

const LightStripTitle = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.15em;
`;

const LightStripStatus = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.75rem;
  color: #c0392b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #c0392b;
    box-shadow: 0 0 6px rgba(192, 57, 43, 0.6);
  }
`;

const LightStrip = styled.div`
  height: 3px;
  background: linear-gradient(
    90deg,
    #c0392b 0%,
    #ff6b6b 25%,
    #c0392b 50%,
    #ff6b6b 75%,
    #c0392b 100%
  );
  border-radius: 2px;
  animation: ${glow} 2s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(192, 57, 43, 0.5),
    0 0 40px rgba(192, 57, 43, 0.2);
  position: relative;
  z-index: 1;
`;

const AudioVisualizer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 36px;
  margin-top: 1rem;
  position: relative;
  z-index: 1;
`;

const AudioBar = styled.div.attrs((props) => ({
  style: {
    height: props.$height ? `${props.$height}px` : "10px",
  },
}))`
  width: 4px;
  background: linear-gradient(to top, rgba(192, 57, 43, 0.6), #c0392b);
  border-radius: 2px;
  transition: height 0.1s ease;
  box-shadow: 0 0 4px rgba(192, 57, 43, 0.2);
`;

const AudioLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  position: relative;
  z-index: 1;

  span {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.25);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`;

export default function InteriorSection({ id }) {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const [audioHeights, setAudioHeights] = useState(Array(14).fill(10));

  // Music fade in/out effect
  useEffect(() => {
    const audio = new Audio('/sounds/cc catch - strangers by night.mp3');
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const fadeAudio = (targetVolume, duration = 1500) => {
    if (!audioRef.current) return;
    
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const audio = audioRef.current;
    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease out cubic
      audio.volume = Math.max(0, Math.min(1, startVolume + volumeDiff * easeProgress));

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        if (targetVolume === 0) {
          audio.pause();
        }
      }
    }, stepTime);
  };

  useEffect(() => {
    let timeoutId;
    let animId;
    const updateHeights = () => {
      setAudioHeights((prev) => prev.map(() => 5 + Math.random() * 28));
      animId = requestAnimationFrame(() => {
        timeoutId = setTimeout(updateHeights, 100);
      });
    };
    updateHeights();
    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timeoutId);
    };
  }, []);

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
          // Start music with fade in
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
            fadeAudio(0.3, 2000);
          }
        },
        onLeave: () => {
          gsap.to(panel, {
            opacity: 0,
            x: -50,
            duration: 0.5,
          });
          // Fade out music
          fadeAudio(0, 1500);
        },
        onEnterBack: () => {
          gsap.to(panel, {
            opacity: 1,
            x: 0,
            duration: 0.5,
          });
          // Resume music with fade in
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
            fadeAudio(0.3, 1500);
          }
        },
        onLeaveBack: () => {
          gsap.to(panel, {
            opacity: 0,
            x: -50,
            duration: 0.5,
          });
          // Fade out music
          fadeAudio(0, 1500);
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <Section ref={sectionRef} id={id}>
      <ContentWrapper>
        <Panel ref={panelRef}>
          <SectionLabel>Luxury</SectionLabel>
          <Title>Interior & Comfort</Title>
          <FlagDivider />

          <FeatureGrid>
            <FeatureCard>
              <FeatureIcon>
                <svg viewBox="0 0 24 24">
                  <path d="M4 18v-6a8 8 0 0 1 16 0v6" />
                  <path d="M10 18h4" />
                  <circle cx="12" cy="10" r="2" />
                </svg>
              </FeatureIcon>
              <FeatureContent>
                <h4>Sparco Carbon Fiber Seats</h4>
                <p>
                  Lightweight racing seats with Alcantara inserts and carbon
                  fiber shell
                </p>
              </FeatureContent>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </FeatureIcon>
              <FeatureContent>
                <h4>Alcantara Steering Wheel</h4>
                <p>
                  Sport steering wheel with paddle shifters and integrated
                  controls
                </p>
              </FeatureContent>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>
                <svg viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8" />
                  <path d="M12 17v4" />
                </svg>
              </FeatureIcon>
              <FeatureContent>
                <h4>8.8" Connect Infotainment</h4>
                <p>
                  High-resolution touchscreen with Apple CarPlay and Android
                  Auto
                </p>
              </FeatureContent>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>
                <svg viewBox="0 0 24 24">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </FeatureIcon>
              <FeatureContent>
                <h4>Harman Kardon Audio</h4>
                <p>14-speaker premium sound system with 900W output</p>
              </FeatureContent>
            </FeatureCard>
          </FeatureGrid>

          <AmbientLightStrip>
            <LightStripHeader>
              <LightStripTitle>Ambient Lighting</LightStripTitle>
              <LightStripStatus>Active</LightStripStatus>
            </LightStripHeader>
            <LightStrip />
            <AudioVisualizer>
              {audioHeights.map((height, i) => (
                <AudioBar key={i} $height={height} />
              ))}
            </AudioVisualizer>
            <AudioLabel>
              <span>Harman Kardon</span>
              <span>14 Channels · 900W</span>
            </AudioLabel>
          </AmbientLightStrip>
        </Panel>
      </ContentWrapper>
    </Section>
  );
}