import { useRef, useState } from 'react'
import styled, { keyframes, css } from 'styled-components'
import AlfaRomeoLogo from '../../assets/Alfa Romeo.svg'

/* --- Animations --- */
const fadeRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const glassReveal = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96) translateX(-30px);
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateX(0);
    backdrop-filter: blur(20px);
  }
`

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(192, 57, 43, 0.5); }
  50% { box-shadow: 0 0 40px rgba(192, 57, 43, 0.8); }
`

const scudettoBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(10px); }
`

/* --- Layout Containers --- */
const Section = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  padding-left: clamp(5vw, 12vw, 15vw);
  padding-right: 5vw;
  pointer-events: none;
`

/* --- Glassmorphism Card --- */
const GlassPanel = styled.div`
  position: relative;
  overflow: hidden;
  padding: 3rem;
  border-radius: 18px;
  max-width: 680px;
  text-align: left;
  pointer-events: auto;

  opacity: 0;
  animation: ${glassReveal} 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;

  background: linear-gradient(
    145deg,
    rgba(14, 14, 18, 0.55) 0%,
    rgba(10, 10, 12, 0.45) 50%,
    rgba(14, 14, 18, 0.5) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left-color: rgba(255, 255, 255, 0.15);
  border-top-color: rgba(255, 255, 255, 0.15);

  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);

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

  & > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: 1024px) {
    max-width: 500px;
    padding: 2.5rem;
  }

  @media (max-width: 768px) {
    max-width: 100%;
    margin-top: 40vh;
    padding: 2rem 1.5rem;
  }
`

/* --- Typography & Elements --- */
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
  opacity: 0;
  animation: ${fadeRight} 1s ease-out 0.6s forwards;
`

const Title = styled.h1`
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(2rem, 3.5vw, 3.2rem);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  opacity: 0;
  animation: ${fadeRight} 1.2s ease-out 0.5s forwards;

  span {
    display: block;
    font-size: 0.4em;
    letter-spacing: 0.3em;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
`

const Description = styled.p`
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(1rem, 1.2vw, 1.15rem);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-bottom: 2rem;
  font-weight: 400;
  max-width: 90%;
  opacity: 0;
  animation: ${fadeRight} 1.2s ease-out 0.8s forwards;
`

const ButtonGroup = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 1.2rem;
  margin-top: 2rem;
  opacity: 0;
  animation: ${fadeRight} 1.2s ease-out 1.1s forwards;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`

/* --- Inlined Start Button Styles --- */
const RoundButtonContainer = styled.button`
  position: relative;
  width: ${(props) => props.$size || '120px'};
  height: ${(props) => props.$size || '120px'};
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: transparent;
  padding: 0;
  outline: none;

  &:focus {
    outline: none;
  }
`

const OuterRing = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(
    145deg,
    #e8e8e8 0%,
    #a0a0a0 25%,
    #c0c0c0 50%,
    #808080 75%,
    #a0a0a0 100%
  );
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.5),
    inset 0 2px 3px rgba(255, 255, 255, 0.3),
    inset 0 -2px 3px rgba(0, 0, 0, 0.3);
`

const MiddleRing = styled.div`
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%);
  box-shadow:
    inset 0 2px 5px rgba(0, 0, 0, 0.8),
    inset 0 -1px 2px rgba(255, 255, 255, 0.1);
`

const InnerButton = styled.div`
  position: absolute;
  inset: 15px;
  border-radius: 50%;
  background: ${(props) =>
    props.$active
      ? 'linear-gradient(145deg, #ff4444 0%, #8B0000 100%)'
      : 'linear-gradient(145deg, #C0392B 0%, #8B0000 50%, #5a1a1a 100%)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow:
    0 4px 15px rgba(192, 57, 43, 0.4),
    inset 0 2px 3px rgba(255, 255, 255, 0.2),
    inset 0 -2px 5px rgba(0, 0, 0, 0.3);

  ${(props) =>
    props.$active &&
    css`
      animation: ${pulse} 1.5s ease-in-out infinite;
    `}

  ${RoundButtonContainer}:hover & {
    background: linear-gradient(
      145deg,
      #d94444 0%,
      #a02020 50%,
      #6a2020 100%
    );
    box-shadow:
      0 6px 25px rgba(192, 57, 43, 0.6),
      inset 0 2px 3px rgba(255, 255, 255, 0.3),
      inset 0 -2px 5px rgba(0, 0, 0, 0.3);
  }

  ${RoundButtonContainer}:active & {
    transform: scale(0.95);
    box-shadow:
      0 2px 10px rgba(192, 57, 43, 0.4),
      inset 0 2px 5px rgba(0, 0, 0, 0.4),
      inset 0 -1px 2px rgba(255, 255, 255, 0.1);
  }
`

const ButtonText = styled.span`
  font-family: 'Orbitron', sans-serif;
  font-size: ${(props) => (props.$small ? '0.5rem' : '0.65rem')};
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.4;
  text-align: center;
`

const PowerIcon = styled.div`
  width: 20px;
  height: 20px;
  margin-bottom: 4px;

  svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: #ffffff;
    stroke-width: 2;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }
`

/* --- ViewSpecsButton Component --- */
const ViewSpecsButton = ({ onClick, size = '120px' }) => {
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = () => {
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)
    if (onClick) onClick()
  }

  return (
    <RoundButtonContainer $size={size} onClick={handleClick}>
      <OuterRing />
      <MiddleRing />
      <InnerButton $active={isPressed}>
        <PowerIcon>
          <svg viewBox="0 0 24 24">
            <path
              d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0"
              strokeLinecap="round"
            />
          </svg>
        </PowerIcon>
        <ButtonText>VIEW</ButtonText>
        <ButtonText $small>SPECS</ButtonText>
      </InnerButton>
    </RoundButtonContainer>
  )
}

/* --- Scroll Indicator Globals --- */
const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 5vh;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  opacity: 0;
  animation: ${fadeRight} 1s ease-out 1.5s forwards;
  pointer-events: auto;
  cursor: pointer;

  &:hover .scroll-text {
    color: #ffffff;
  }
`

const ScrollText = styled.span`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.3em;
  transition: all 0.3s ease;
  className: 'scroll-text';
`

const ScudettoSVG = styled.svg`
  width: 26px;
  height: 38px;
  overflow: visible;

  .scudetto-mesh {
    fill: none;
  }

  .scudetto-outline {
    fill: none;
    stroke: rgba(255, 255, 255, 0.4);
    stroke-width: 1.5px;
    transition: all 0.3s ease;
  }

  .scudetto-inner {
    fill: none;
    stroke: rgba(255, 255, 255, 0.15);
    stroke-width: 0.5px;
  }

  .scroll-bouncer {
    animation: ${scudettoBounce} 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  .scroll-bouncer rect {
    fill: rgba(255, 255, 255, 0.6);
    transition: all 0.3s ease;
  }

  ${ScrollIndicator}:hover & .scudetto-outline {
    stroke: #ffffff;
  }
  ${ScrollIndicator}:hover & .scroll-bouncer rect {
    fill: #ffffff;
  }
`

const ScudettoArrow = () => (
  <ScudettoSVG viewBox="0 0 30 40">
    <path
      className="scudetto-outline"
      d="M 10 8 C 10 13, 20 13, 20 8 Q 24 8, 27 9 C 29 10, 29 13, 27 15 L 18 34 C 16 37, 14 37, 12 34 L 3 15 C 1 13, 1 10, 3 9 Q 6 8, 10 8 Z"
    />
    <path
      className="scudetto-inner"
      d="M 11 9 C 11 12, 19 12, 19 9 Q 23 9, 25 10 C 26 11, 26 12, 25 14 L 17 32 C 16 34, 14 34, 13 32 L 5 14 C 4 12, 4 11, 5 10 Q 7 9, 11 9 Z"
    />
    <g className="scroll-bouncer">
      <rect x="14" y="16" width="2" height="6" rx="1" />
    </g>
    <image
      href={AlfaRomeoLogo}
      x="9"
      y="0"
      width="12"
      height="12"
      style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))' }}
    />
  </ScudettoSVG>
)

export default function HeroSection({ id }) {
  const sectionRef = useRef(null)

  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight * 1.2,
      behavior: 'smooth',
    })
  }

  return (
    <Section ref={sectionRef} id={id}>
      <GlassPanel>
        <FlagDivider />
        <Title>
          <span>Alfa Romeo</span>
          Giulia Quadrifoglio
        </Title>

        <Description>
          Experience Italian engineering in a fully interactive 3D space.
          Discover the mechanics of emotion and explore every aerodynamic detail
          of this Ferrari-derived masterpiece.
        </Description>

        <ButtonGroup>
          <ViewSpecsButton onClick={scrollToNext} />
        </ButtonGroup>
      </GlassPanel>

      <ScrollIndicator onClick={scrollToNext}>
        <ScrollText className="scroll-text">Scroll down</ScrollText>
        <ScudettoArrow />
      </ScrollIndicator>
    </Section>
  )
}