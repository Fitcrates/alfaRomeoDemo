import { useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import AlfaRomeoLogo from '../../assets/Alfa Romeo.svg'

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(10px); }
`

const glassReveal = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96) translateY(20px);
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
    backdrop-filter: blur(20px);
  }
`

const Section = styled.section`
  min-height: 150vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 0 5vw;
  pointer-events: none;
`

const Content = styled.div`
  text-align: center;
  z-index: 10;
  margin-top: -20vh;
`

/* ── Glassmorphism Card ── */
const GlassPanel = styled.div`
  position: relative;
  overflow: hidden;
  padding: 3rem 4rem;
  border-radius: 18px;
  opacity: 0;
  animation: ${glassReveal} 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;

  /* Glass effect */
  background: linear-gradient(
    145deg,
    rgba(14, 14, 18, 0.55) 0%,
    rgba(10, 10, 12, 0.45) 50%,
    rgba(14, 14, 18, 0.5) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  /* Subtle border — brighter at top for lighting effect */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top-color: rgba(255, 255, 255, 0.12);

  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(192, 57, 43, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);

  /* Carbon fiber texture — matching all other panels */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(
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

  /* Top glass highlight — subtle reflection */
  &::after {
    content: '';
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

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    border-radius: 14px;
  }
`

/* ── Italian flag divider — matching other sections ── */
const FlagDivider = styled.div`
  width: 60px;
  height: 3px;
  border-radius: 2px;
  margin: 0 auto 1.5rem;
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
`

const Title = styled.h1`
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  opacity: 0;
  animation: ${fadeInUp} 1.2s ease-out 0.5s forwards;
  text-shadow: 
    0 0 40px rgba(192, 57, 43, 0.2),
    0 2px 10px rgba(0, 0, 0, 0.4);
  
  span {
    display: block;
    font-size: 0.35em;
    letter-spacing: 0.4em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
`

const Subtitle = styled.p`
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0;
  animation: ${fadeInUp} 1.2s ease-out 0.8s forwards;
  
  span {
    color: #C0392B;
    font-weight: 700;
  }
`

const Tagline = styled.div`
  margin-top: 1.5rem;
  opacity: 0;
  animation: ${fadeInUp} 1.2s ease-out 1.1s forwards;
  
  span {
    font-family: 'Exo 2', sans-serif;
    font-size: 0.9rem;
    font-style: italic;
    color: rgba(255, 255, 255, 0.35);
    letter-spacing: 0.1em;
  }
`

/* ── Scroll down indicator ── */
const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 15vh;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  opacity: 0;
  animation: ${fadeInUp} 1s ease-out 1.5s forwards;
  pointer-events: auto;
  cursor: pointer;
`

const ScrollText = styled.span`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.3em;
`

const ScrollArrow = styled.div`
  width: 24px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  position: relative;
  animation: ${bounce} 2s ease-in-out infinite;
  
  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 8px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 2px;
  }
`

/* ── Logo badge at top ── */
const AlfaLogo = styled.img`
  position: absolute;
  top: 5vh;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  animation: ${fadeInUp} 1s ease-out 0.2s forwards;
  width: 65px;
  height: 65px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(192, 57, 43, 0.2));
`

export default function HeroSection({ id }) {
  const sectionRef = useRef(null)

  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight * 1.2,
      behavior: 'smooth'
    })
  }

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
            <span>"La meccanica delle emozioni"</span>
          </Tagline>
        </GlassPanel>
      </Content>
      
      <ScrollIndicator onClick={scrollToNext}>
        <ScrollText>Explore</ScrollText>
        <ScrollArrow />
      </ScrollIndicator>
    </Section>
  )
}
