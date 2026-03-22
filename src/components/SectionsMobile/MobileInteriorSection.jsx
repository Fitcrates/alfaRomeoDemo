import { useRef, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import MobilePanel from "./MobilePanel";

const glow = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

/* ── Action page styles ── */

const ActionPage = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
`;

const FeatureCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
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

const FeatureIcon = styled.div`
  width: 32px;
  height: 32px;
  min-width: 32px;
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

  svg {
    width: 16px;
    height: 16px;
    stroke: #c0392b;
    fill: none;
    stroke-width: 1.5;
  }
`;

const FeatureContent = styled.div`
  flex: 1;

  h4 {
    font-family: "Orbitron", sans-serif;
    font-size: 0.65rem;
    color: #ffffff;
    margin: 0 0 2px;
    letter-spacing: 0.05em;
  }

  p {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.45);
    line-height: 1.3;
    margin: 0;
  }
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

const AmbientLightStrip = styled.div`
  padding: 12px;
  background: linear-gradient(
    160deg,
    rgba(18, 18, 20, 1) 0%,
    rgba(8, 8, 10, 1) 100%
  );
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;

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
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
`;

const LightStripTitle = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.15em;
`;

const LightStripStatus = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.65rem;
  color: #c0392b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &::before {
    content: "";
    display: inline-block;
    width: 5px;
    height: 5px;
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
  gap: 2px;
  height: 30px;
  margin-top: 8px;
  position: relative;
  z-index: 1;
`;

const AudioBar = styled.div.attrs((props) => ({
    style: {
        height: props.$height ? `${props.$height}px` : "8px",
    },
}))`
  width: 3px;
  background: linear-gradient(to top, rgba(192, 57, 43, 0.6), #c0392b);
  border-radius: 2px;
  transition: height 0.1s ease;
  box-shadow: 0 0 4px rgba(192, 57, 43, 0.2);
`;

const AudioLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  position: relative;
  z-index: 1;

  span {
    font-family: "Rajdhani", sans-serif;
    font-size: 0.55rem;
    color: rgba(255, 255, 255, 0.25);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`;

const DetailCard = styled.div`
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

const DetailLabel = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 4px;
`;

const DetailValue = styled.div`
  font-family: "Orbitron", sans-serif;
  font-size: 0.7rem;
  color: #ffffff;
  font-weight: 600;
`;

const Description = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
  margin: 0;
`;

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */
export default function MobileInteriorSection({ id }) {
    const [audioHeights, setAudioHeights] = useState(Array(12).fill(8));

    const audioRef = useRef(null);
    const fadeIntervalRef = useRef(null);
    const audioUnlockedRef = useRef(false);
    const isInSectionRef = useRef(false);

    // Music fade in/out effect
    useEffect(() => {
        const audio = new Audio('/sounds/cc catch - strangers by night.mp3');
        audio.loop = true;
        audio.volume = 0;
        audio.preload = 'auto';
        audioRef.current = audio;

        const events = ['click', 'touchstart', 'keydown', 'mousedown'];
        const unlockAudio = () => {
            if (audioUnlockedRef.current) {
                events.forEach(e => document.removeEventListener(e, unlockAudio));
                return;
            }
            if (!audioRef.current) return;
            audioRef.current.play().then(() => {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioUnlockedRef.current = true;
                events.forEach(e => document.removeEventListener(e, unlockAudio));
                if (isInSectionRef.current) {
                    audioRef.current.play().catch(() => {});
                    fadeAudio(0.3, 2000);
                }
            }).catch(() => {});
        };

        events.forEach(event => document.addEventListener(event, unlockAudio, { passive: true }));
        return () => {
            events.forEach(event => document.removeEventListener(event, unlockAudio));
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        };
    }, []);

    const fadeAudio = (targetVolume, duration = 1500) => {
        if (!audioRef.current) return;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        const audio = audioRef.current;
        const startVolume = audio.volume;
        const volumeDiff = targetVolume - startVolume;
        const steps = 30;
        const stepTime = duration / steps;
        let currentStep = 0;
        fadeIntervalRef.current = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            audio.volume = Math.max(0, Math.min(1, startVolume + volumeDiff * easeProgress));
            if (currentStep >= steps) {
                clearInterval(fadeIntervalRef.current);
                if (targetVolume === 0) audio.pause();
            }
        }, stepTime);
    };

    useEffect(() => {
        let timeoutId;
        let animId;
        const updateHeights = () => {
            setAudioHeights((prev) => prev.map(() => 4 + Math.random() * 22));
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

    return (
            <MobilePanel
                id={id}
                label="Luxury"
                title="Interior & Comfort"
                onEnterAction={() => {
                    isInSectionRef.current = true;
                    if (audioRef.current && audioUnlockedRef.current) {
                        audioRef.current.play().catch(() => {});
                        fadeAudio(0.3, 2000);
                    }
                }}
                onLeaveAction={() => {
                    isInSectionRef.current = false;
                    fadeAudio(0, 1500);
                }}
                action={
                <ActionPage>
                    <FeatureCard>
                        <FeatureIcon>
                            <svg viewBox="0 0 24 24">
                                <path d="M4 18v-6a8 8 0 0 1 16 0v6" />
                                <path d="M10 18h4" />
                                <circle cx="12" cy="10" r="2" />
                            </svg>
                        </FeatureIcon>
                        <FeatureContent>
                            <h4>Sparco Carbon Seats</h4>
                            <p>Lightweight racing seats with Alcantara inserts</p>
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
                            <h4>Alcantara Steering</h4>
                            <p>Sport wheel with paddle shifters</p>
                        </FeatureContent>
                    </FeatureCard>

                    <SwipeHint>Swipe for details →</SwipeHint>
                </ActionPage>
            }
            details={
                <ActionPage>
                    <FeatureCard>
                        <FeatureIcon>
                            <svg viewBox="0 0 24 24">
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                <path d="M8 21h8" />
                                <path d="M12 17v4" />
                            </svg>
                        </FeatureIcon>
                        <FeatureContent>
                            <h4>8.8" Infotainment</h4>
                            <p>CarPlay & Android Auto</p>
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
                            <p>14-speaker · 900W premium sound</p>
                        </FeatureContent>
                    </FeatureCard>
                </ActionPage>
            }
            extra={
                <DetailsPage>
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
                            <span>14 Ch · 900W</span>
                        </AudioLabel>
                    </AmbientLightStrip>

                    <DetailCard>
                        <DetailLabel>Upholstery</DetailLabel>
                        <DetailValue>Alcantara & Carbon Fiber</DetailValue>
                    </DetailCard>

                    <DetailCard>
                        <DetailLabel>Climate</DetailLabel>
                        <DetailValue>Dual-Zone Automatic</DetailValue>
                    </DetailCard>
                </DetailsPage>
            }
        />
    );
}