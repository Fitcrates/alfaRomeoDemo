import { useRef } from "react";
import styled, { keyframes } from "styled-components";
import AlfaRomeoLogo from "../../assets/Alfa Romeo.svg";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
`;

const glassReveal = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96) translateY(16px);
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
    backdrop-filter: blur(20px);
  }
`;

const Section = styled.section`
  height: 100vh;
  height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  padding: 0 16px;
  pointer-events: none;
`;

const AlfaLogo = styled.img`
  position: absolute;
  top: max(env(safe-area-inset-top, 12px), 12px);
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  animation: ${fadeInUp} 1s ease-out 0.2s forwards;
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(192, 57, 43, 0.2));
`;

const Content = styled.div`
  width: 100%;
  margin-bottom: 15vh;
  z-index: 10;
`;

const GlassPanel = styled.div`
  position: relative;
  overflow: hidden;
  padding: 1.5rem 1.25rem;
  border-radius: 14px;
  opacity: 0;
  animation: ${glassReveal} 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s
    forwards;

  background: linear-gradient(
    145deg,
    rgba(14, 14, 18, 0.6) 0%,
    rgba(10, 10, 12, 0.5) 50%,
    rgba(14, 14, 18, 0.55) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top-color: rgba(255, 255, 255, 0.12);

  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(192, 57, 43, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.012) 2px,
        rgba(255, 255, 255, 0.012) 4px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.012) 2px,
        rgba(255, 255, 255, 0.012) 4px
      );
    pointer-events: none;
    z-index: 0;
    border-radius: inherit;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
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

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const FlagDivider = styled.div`
  width: 40px;
  height: 2px;
  border-radius: 1px;
  margin: 0 auto 1rem;
  background: linear-gradient(
    90deg,
    #009246 0%,
    #009246 33%,
    #ffffff 33%,
    #ffffff 66%,
    #ce2b37 66%,
    #ce2b37 100%
  );
  opacity: 0;
  animation: ${fadeInUp} 1s ease-out 0.6s forwards;
`;

const Title = styled.h1`
  font-family: "Orbitron", sans-serif;
  font-size: clamp(1.6rem, 7vw, 2.4rem);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  text-align: center;
  opacity: 0;
  animation: ${fadeInUp} 1.2s ease-out 0.5s forwards;
  text-shadow: 0 0 30px rgba(192, 57, 43, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.4);

  span {
    display: block;
    font-size: 0.35em;
    letter-spacing: 0.35em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 0.4rem;
    font-weight: 500;
  }
`;

const Subtitle = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: clamp(0.95rem, 3vw, 1.2rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-align: center;
  opacity: 0;
  animation: ${fadeInUp} 1.2s ease-out 0.8s forwards;

  span {
    color: #c0392b;
    font-weight: 700;
  }
`;

const Tagline = styled.div`
  margin-top: 0.75rem;
  text-align: center;
  opacity: 0;
  animation: ${fadeInUp} 1.2s ease-out 1.1s forwards;

  span {
    font-family: "Exo 2", sans-serif;
    font-size: 0.75rem;
    font-style: italic;
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: 0.08em;
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 4vh;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  animation: ${fadeInUp} 1s ease-out 1.5s forwards;
  pointer-events: auto;
  cursor: pointer;
`;

const ScrollText = styled.span`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.25em;
`;

const ScrollArrow = styled.div`
  width: 20px;
  height: 34px;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  position: relative;
  animation: ${bounce} 2s ease-in-out infinite;

  &::before {
    content: "";
    position: absolute;
    top: 7px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 6px;
    background: rgba(255, 255, 255, 0.35);
    border-radius: 2px;
  }
`;

export default function MobileHeroSection({ id }) {
    const sectionRef = useRef(null);

    const scrollToNext = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: "smooth",
        });
    };

    return (
        <Section ref={sectionRef} id={id}>
            <AlfaLogo src={AlfaRomeoLogo} alt="Alfa Romeo" />

            <Content>
                <GlassPanel>
                    <FlagDivider />
                    <Title>
                        <span>Alfa Romeo</span>
                        Giulia Quadrifoglio
                    </Title>
                    <Subtitle>
                        <span>510 HP</span> of Italian Perfection
                    </Subtitle>
                    <Tagline>
                        <span>&ldquo;La meccanica delle emozioni&rdquo;</span>
                    </Tagline>
                </GlassPanel>
            </Content>

            <ScrollIndicator onClick={scrollToNext}>
                <ScrollText>Explore</ScrollText>
                <ScrollArrow />
            </ScrollIndicator>
        </Section>
    );
}