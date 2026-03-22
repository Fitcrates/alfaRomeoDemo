import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RpmGauge from "../UI/RpmGauge";
import SpecCounter from "../UI/SpecCounter";
import EngineStartButton from "../UI/EngineStartButton";

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

  /* Carbon fibre overlay */
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
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 1.5rem;
  letter-spacing: 0.1em;
`;

/* Italian flag divider */
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

const SpecsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
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
`;

const EngineInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
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
  margin-bottom: 1.5rem;
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

const EngineIcon = styled.div`
  width: 50px;
  height: 50px;
  min-width: 50px;
  background: linear-gradient(145deg, #c0392b, #8b0000);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;

  svg {
    width: 28px;
    height: 28px;
    fill: #ffffff;
  }
`;

const EngineText = styled.div`
  position: relative;
  z-index: 1;

  h4 {
    font-family: "Orbitron", sans-serif;
    font-size: 1rem;
    color: #ffffff;
    margin-bottom: 0.25rem;
  }

  p {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const GaugeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const ButtonLabel = styled.span`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.2em;
`;

export default function EngineSection({
  id,
  scrollProgressRef,
  onEngineStart,
  headlightsOn = false,
}) {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [displayRpm, setDisplayRpm] = useState(0);
  const rpmTweenRef = useRef(null);
  const wasEngineOnRef = useRef(false);
  const buttonClickedRef = useRef(false); // Track if button was clicked locally
  const startupSoundRef = useRef(null);
  const runningSoundRef = useRef(null);

  // Initialize audio elements with crossfade looping
  const runningSound2Ref = useRef(null);
  const crossfadeIntervalRef = useRef(null);
  const targetVolumeRef = useRef(0.6);

  useEffect(() => {
    startupSoundRef.current = new Audio('/sounds/EngineStart.wav');
    startupSoundRef.current.volume = 0.6;

    // Create two audio elements for crossfade looping
    runningSoundRef.current = new Audio('/sounds/IdleGiula.wav');
    runningSoundRef.current.volume = 0;

    runningSound2Ref.current = new Audio('/sounds/IdleGiula.wav');
    runningSound2Ref.current.volume = 0;

    return () => {
      if (startupSoundRef.current) {
        startupSoundRef.current.pause();
        startupSoundRef.current = null;
      }
      if (runningSoundRef.current) {
        runningSoundRef.current.pause();
        runningSoundRef.current = null;
      }
      if (runningSound2Ref.current) {
        runningSound2Ref.current.pause();
        runningSound2Ref.current = null;
      }
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
      }
    };
  }, []);

  // Crossfade loop function for seamless audio
  const startCrossfadeLoop = () => {
    if (!runningSoundRef.current || !runningSound2Ref.current) return;

    const audio1 = runningSoundRef.current;
    const audio2 = runningSound2Ref.current;
    const crossfadeDuration = 1.5; // seconds
    const targetVolume = targetVolumeRef.current;

    // Start first audio
    audio1.currentTime = 0;
    audio1.volume = targetVolume;
    audio1.play().catch(() => { });

    const audioDuration = audio1.duration || 5; // fallback duration
    const loopPoint = Math.max(0.5, audioDuration - crossfadeDuration);

    let activeAudio = 1;

    crossfadeIntervalRef.current = setInterval(() => {
      if (!wasEngineOnRef.current) {
        clearInterval(crossfadeIntervalRef.current);
        return;
      }

      const currentAudio = activeAudio === 1 ? audio1 : audio2;
      const nextAudio = activeAudio === 1 ? audio2 : audio1;

      // Check if we need to start crossfade
      if (currentAudio.currentTime >= loopPoint) {
        // Start next audio and crossfade
        nextAudio.currentTime = 0;
        nextAudio.volume = 0;
        nextAudio.play().catch(() => { });

        // Crossfade volumes
        const fadeSteps = 30;
        let step = 0;
        const fadeInterval = setInterval(() => {
          step++;
          const progress = step / fadeSteps;
          currentAudio.volume = targetVolume * (1 - progress);
          nextAudio.volume = targetVolume * progress;

          if (step >= fadeSteps) {
            clearInterval(fadeInterval);
            currentAudio.pause();
            currentAudio.currentTime = 0;
          }
        }, (crossfadeDuration * 1000) / fadeSteps);

        activeAudio = activeAudio === 1 ? 2 : 1;
      }
    }, 100);
  };

  // Handle engine state changes - only play sound when button clicked locally
  useEffect(() => {
    if (rpmTweenRef.current) {
      rpmTweenRef.current.kill();
    }

    if (headlightsOn && !wasEngineOnRef.current) {
      wasEngineOnRef.current = true;
      const rpmObj = { rpm: 0 };

      // Only play startup sound if button was clicked in THIS section (not from FreeRoam lights)
      if (startupSoundRef.current && buttonClickedRef.current) {
        startupSoundRef.current.currentTime = 0;
        startupSoundRef.current.play().catch(() => { });

        // When startup sound ends, start the crossfade running loop
        startupSoundRef.current.onended = () => {
          if (wasEngineOnRef.current) {
            startCrossfadeLoop();
          }
          buttonClickedRef.current = false;
        };
      }

      rpmTweenRef.current = gsap.to(rpmObj, {
        rpm: 7500,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => setDisplayRpm(Math.round(rpmObj.rpm)),
        onComplete: () => {
          rpmTweenRef.current = gsap.to(rpmObj, {
            rpm: 1700,
            duration: 0.8,
            ease: "power2.inOut",
            onUpdate: () => setDisplayRpm(Math.round(rpmObj.rpm)),
          });
        },
      });
    } else if (!headlightsOn && wasEngineOnRef.current) {
      wasEngineOnRef.current = false;
      setDisplayRpm(0);

      // Stop crossfade loop
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
      }

      // Stop all engine sounds with fade out (no startup sound on turn off)
      if (startupSoundRef.current) {
        startupSoundRef.current.pause();
        startupSoundRef.current.onended = null;
      }

      // Fade out both running sounds
      const fadeOutAudio = (audio) => {
        if (!audio) return;
        const fadeOut = () => {
          if (audio.volume > 0.03) {
            audio.volume = Math.max(0, audio.volume - 0.03);
            requestAnimationFrame(fadeOut);
          } else {
            audio.pause();
            audio.volume = 0;
            audio.currentTime = 0;
          }
        };
        fadeOut();
      };

      fadeOutAudio(runningSoundRef.current);
      fadeOutAudio(runningSound2Ref.current);
    }

    return () => {
      if (rpmTweenRef.current) {
        rpmTweenRef.current.kill();
      }
    };
  }, [headlightsOn]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          setIsVisible(true);
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
          setIsVisible(true);
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

  const handleEngineStart = () => {
    // Mark that button was clicked locally - this enables sound playback
    if (!headlightsOn) {
      buttonClickedRef.current = true;
    }
    if (onEngineStart) {
      onEngineStart();
    }
  };

  return (
    <Section ref={sectionRef} id={id}>
      <ContentWrapper>
        <Panel ref={panelRef}>
          <SectionLabel>Performance</SectionLabel>
          <Title>Engine & Power</Title>
          <FlagDivider />

          <EngineInfo>
            <EngineIcon>
              <svg viewBox="0 0 24 24">
                <path d="M7 4v2h3v2H7l-2 2v3H3v-3H1v8h2v-3h2v3h3l2 2h8v-4h2v3h2V9h-2v3h-2V8h-3V6h3V4H7z" />
              </svg>
            </EngineIcon>
            <EngineText>
              <h4>2.9L V6 Bi-Turbo</h4>
              <p>Ferrari-derived twin-turbo powerplant</p>
            </EngineText>
          </EngineInfo>

          <GaugeContainer>
            <RpmGauge
              value={displayRpm}
              maxRpm={8000}
              size="280px"
            />
          </GaugeContainer>

          <SpecsGrid>
            <SpecItem>
              <SpecCounter
                value={510}
                label="Horsepower"
                unit="HP"
                isVisible={isVisible}
                size="2rem"
              />
            </SpecItem>
            <SpecItem>
              <SpecCounter
                value={600}
                label="Torque"
                unit="Nm"
                isVisible={isVisible}
                size="2rem"
              />
            </SpecItem>
            <SpecItem>
              <SpecCounter
                value={3.9}
                label="0-100 km/h"
                unit="sec"
                decimals={1}
                isVisible={isVisible}
                size="2rem"
              />
            </SpecItem>
            <SpecItem>
              <SpecCounter
                value={307}
                label="Top Speed"
                unit="km/h"
                isVisible={isVisible}
                size="2rem"
              />
            </SpecItem>
          </SpecsGrid>

          <ButtonContainer>
            <ButtonLabel>
              {headlightsOn ? "Lights On" : "Turn on lights"}
            </ButtonLabel>
            <EngineStartButton
              onClick={handleEngineStart}
              size="100px"
              active={headlightsOn}
            />
          </ButtonContainer>
        </Panel>
      </ContentWrapper>
    </Section>
  );
}