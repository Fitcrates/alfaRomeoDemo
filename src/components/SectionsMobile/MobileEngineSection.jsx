import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import gsap from "gsap";
import MobilePanel from "./MobilePanel";
import MobileRpmGauge from "../UI/MobileUI/MobileRpmGauge";
import SpecCounter from "../UI/SpecCounter";
import MobileEngineStartButton from "../UI/MobileUI/MobileEngineStartButton";

const ActionPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 8px;
`;

const GaugeWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ButtonLabel = styled.span`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.15em;
`;

const SwipeHint = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.2);
  text-align: center;
  margin-top: auto;
  padding-top: 2px;
`;

const EngineInfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.03) 100%
  );
  margin-bottom: 10px;
`;

const EngineIcon = styled.div`
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: linear-gradient(145deg, #c0392b, #8b0000);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    fill: #ffffff;
  }
`;

const EngineText = styled.div`
  h4 {
    font-family: "Orbitron", sans-serif;
    font-size: 0.75rem;
    color: #ffffff;
    margin: 0 0 2px;
  }

  p {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0;
  }
`;

const SpecsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const SpecItem = styled.div`
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.02) 100%
  );
`;

export default function MobileEngineSection({
    id,
    scrollProgressRef,
    onEngineStart,
    headlightsOn = false,
}) {
    const [displayRpm, setDisplayRpm] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const rpmTweenRef = useRef(null);
    const wasEngineOnRef = useRef(false);
    const buttonClickedRef = useRef(false);
    const startupSoundRef = useRef(null);
    const runningSoundRef = useRef(null);
    const runningSound2Ref = useRef(null);
    const crossfadeIntervalRef = useRef(null);
    const targetVolumeRef = useRef(0.6);
    const visibilityRef = useRef(null);

    useEffect(() => {
        startupSoundRef.current = new Audio(
            "/sounds/GiuliaEngine (mp3cut.net).mp3",
        );
        startupSoundRef.current.volume = 0.6;

        runningSoundRef.current = new Audio("/sounds/engingRunning.mp3");
        runningSoundRef.current.volume = 0;

        runningSound2Ref.current = new Audio("/sounds/engingRunning.mp3");
        runningSound2Ref.current.volume = 0;

        return () => {
            [startupSoundRef, runningSoundRef, runningSound2Ref].forEach(
                (ref) => {
                    if (ref.current) {
                        ref.current.pause();
                        ref.current = null;
                    }
                },
            );
            if (crossfadeIntervalRef.current) {
                clearInterval(crossfadeIntervalRef.current);
            }
        };
    }, []);

    const startCrossfadeLoop = () => {
        if (!runningSoundRef.current || !runningSound2Ref.current) return;

        const audio1 = runningSoundRef.current;
        const audio2 = runningSound2Ref.current;
        const crossfadeDuration = 1.5;
        const targetVolume = targetVolumeRef.current;

        audio1.currentTime = 0;
        audio1.volume = targetVolume;
        audio1.play().catch(() => { });

        const audioDuration = audio1.duration || 5;
        const loopPoint = Math.max(0.5, audioDuration - crossfadeDuration);

        let activeAudio = 1;

        crossfadeIntervalRef.current = setInterval(() => {
            if (!wasEngineOnRef.current) {
                clearInterval(crossfadeIntervalRef.current);
                return;
            }

            const currentAudio = activeAudio === 1 ? audio1 : audio2;
            const nextAudio = activeAudio === 1 ? audio2 : audio1;

            if (currentAudio.currentTime >= loopPoint) {
                nextAudio.currentTime = 0;
                nextAudio.volume = 0;
                nextAudio.play().catch(() => { });

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

    useEffect(() => {
        if (rpmTweenRef.current) rpmTweenRef.current.kill();

        if (headlightsOn && !wasEngineOnRef.current) {
            wasEngineOnRef.current = true;
            const rpmObj = { rpm: 0 };

            if (startupSoundRef.current && buttonClickedRef.current) {
                startupSoundRef.current.currentTime = 0;
                startupSoundRef.current.play().catch(() => { });
                startupSoundRef.current.onended = () => {
                    if (
                        wasEngineOnRef.current &&
                        buttonClickedRef.current
                    ) {
                        startCrossfadeLoop();
                    }
                };
                buttonClickedRef.current = false;
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

            if (crossfadeIntervalRef.current) {
                clearInterval(crossfadeIntervalRef.current);
            }

            if (startupSoundRef.current) {
                startupSoundRef.current.pause();
                startupSoundRef.current.onended = null;
            }

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
            if (rpmTweenRef.current) rpmTweenRef.current.kill();
        };
    }, [headlightsOn]);

    useEffect(() => {
        visibilityRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.3 },
        );

        const section = document.getElementById(id);
        if (section) visibilityRef.current.observe(section);

        return () => {
            if (visibilityRef.current) visibilityRef.current.disconnect();
        };
    }, [id]);

    const handleEngineStart = () => {
        if (!headlightsOn) {
            buttonClickedRef.current = true;
        }
        if (onEngineStart) onEngineStart();
    };

    return (
        <MobilePanel
            id={id}
            label="Performance"
            title="Engine & Power"
            action={
                <ActionPage>
                    <GaugeWrapper>
                        <MobileRpmGauge
                            value={displayRpm}
                            maxRpm={8000}
                            size="120px"
                        />
                    </GaugeWrapper>

                    <ButtonRow>
                        <MobileEngineStartButton
                            onClick={handleEngineStart}
                            size="56px"
                            active={headlightsOn}
                        />
                        <ButtonLabel>
                            {headlightsOn ? "Lights On" : "Turn on lights"}
                        </ButtonLabel>
                    </ButtonRow>

                    <SwipeHint>Swipe for specs →</SwipeHint>
                </ActionPage>
            }
            details={
                <>
                    <EngineInfoCard>
                        <EngineIcon>
                            <svg viewBox="0 0 24 24">
                                <path d="M7 4v2h3v2H7l-2 2v3H3v-3H1v8h2v-3h2v3h3l2 2h8v-4h2v3h2V9h-2v3h-2V8h-3V6h3V4H7z" />
                            </svg>
                        </EngineIcon>
                        <EngineText>
                            <h4>2.9L V6 Bi-Turbo</h4>
                            <p>Ferrari-derived twin-turbo powerplant</p>
                        </EngineText>
                    </EngineInfoCard>

                    <SpecsGrid>
                        <SpecItem>
                            <SpecCounter
                                value={510}
                                label="Horsepower"
                                unit="HP"
                                isVisible={isVisible}
                                size="1.4rem"
                            />
                        </SpecItem>
                        <SpecItem>
                            <SpecCounter
                                value={600}
                                label="Torque"
                                unit="Nm"
                                isVisible={isVisible}
                                size="1.4rem"
                            />
                        </SpecItem>
                        <SpecItem>
                            <SpecCounter
                                value={3.9}
                                label="0-100 km/h"
                                unit="sec"
                                decimals={1}
                                isVisible={isVisible}
                                size="1.4rem"
                            />
                        </SpecItem>
                        <SpecItem>
                            <SpecCounter
                                value={307}
                                label="Top Speed"
                                unit="km/h"
                                isVisible={isVisible}
                                size="1.4rem"
                            />
                        </SpecItem>
                    </SpecsGrid>
                </>
            }
        />
    );
}