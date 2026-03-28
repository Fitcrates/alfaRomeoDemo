import { useRef } from 'react'
import styled, { keyframes } from 'styled-components'
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
  gap: 1.2rem;
  margin-top: 1rem;
  opacity: 0;
  animation: ${fadeRight} 1.2s ease-out 1.1s forwards;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`

/* ── Encased Matte Scudetto Button ── */
const SpecButtonContainer = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.5rem;

  /* Rosso Competizione Red Gradient */
  background: linear-gradient(
    145deg,
    #c0392b 0%,
    #8b0000 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 0.6rem 2rem 0.6rem 0.8rem;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    0 10px 30px rgba(139, 0, 0, 0.4), /* Subtle dark red ambient shadow */
    inset 0 2px 5px rgba(255, 255, 255, 0.25),
    inset 0 -2px 5px rgba(0, 0, 0, 0.4);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* Carbon fiber weave - adjusted opacities to look great over red */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.06) 2px,
        rgba(255, 255, 255, 0.06) 4px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.15) 2px,
        rgba(0, 0, 0, 0.15) 4px
      );
    pointer-events: none;
    z-index: 0;
    border-radius: inherit;
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.45);
    box-shadow:
      0 15px 35px rgba(139, 0, 0, 0.6), /* Richer red glow on hover */
      inset 0 2px 5px rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(1px);
    box-shadow:
      0 4px 15px rgba(139, 0, 0, 0.5),
      inset 0 2px 4px rgba(255, 255, 255, 0.15);
  }
`

const SpecButtonText = styled.span`
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;

  ${SpecButtonContainer}:hover & {
    color: #ffffff; /* Clean white transition, no glow */
  }
`

/* Updated Accurate Giulia Scudetto SVG (Satin finish, broad shoulders, precise taper) */
const DetailedScudettoIcon = () => (
  <svg
    viewBox="0 0 100 120"
    style={{
      width: '56px',
      height: '68px',
      position: 'relative',
      zIndex: 1,
      filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.8))',
    }}
  >
    <defs>
      {/* Matte / Satin Silver finish based on plastic trim reference */}
      <linearGradient id="satinSilver" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d1d6da" />
        <stop offset="20%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#8e9499" />
        <stop offset="80%" stopColor="#e2e6e9" />
        <stop offset="100%" stopColor="#4a4e52" />
      </linearGradient>

      {/* Photorealistic perfectly tiling 3D Hexagon/Honeycomb Mesh */}
      <pattern
        id="largeHex"
        width="14"
        height="24"
        patternUnits="userSpaceOnUse"
        patternTransform="scale(0.8)"
      >
        {/* Base black hexes */}
        <path
          d="M7 0 L14 4 L14 12 L7 16 L0 12 L0 4 Z"
          fill="none"
          stroke="#050505"
          strokeWidth="2.5"
        />
        <path
          d="M0 24 L7 20 L14 24"
          fill="none"
          stroke="#050505"
          strokeWidth="2.5"
        />
        <path
          d="M7 16 L7 20"
          fill="none"
          stroke="#050505"
          strokeWidth="2.5"
        />

        {/* Subtle light catcher on the bottom/right edges for 3D molded plastic depth */}
        <path
          d="M7 16 L14 12 L14 4"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.5"
        />
        <path
          d="M0 24 L7 20 L7 16"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.5"
        />
      </pattern>
    </defs>

    {/* Deep dark void behind grille */}
    <path
      d="M 32 26 C 32 40, 68 40, 68 26 Q 80 25, 92 28 C 98 30, 96 40, 92 46 L 58 102 C 54 108, 46 108, 42 102 L 8 46 C 4 40, 2 30, 8 28 Q 20 25, 32 26 Z"
      fill="#443f3fff"
    />

    {/* Honeycomb Mesh overlay */}
    <path
      d="M 32 26 C 32 40, 68 40, 68 26 Q 80 25, 92 28 C 98 30, 96 40, 92 46 L 58 102 C 54 108, 46 108, 42 102 L 8 46 C 4 40, 2 30, 8 28 Q 20 25, 32 26 Z"
      fill="url(#largeHex)"
    />

    {/* Outer Matte/Satin Chrome Rim */}
    <path
      d="M 32 26 C 32 40, 68 40, 68 26 Q 80 25, 92 28 C 98 30, 96 40, 92 46 L 58 102 C 54 108, 46 108, 42 102 L 8 46 C 4 40, 2 30, 8 28 Q 20 25, 32 26 Z"
      fill="none"
      stroke="url(#satinSilver)"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Dark Inner Lip (adds thickness/depth to the perimeter) */}
    <path
      d="M 34 29 C 35 38, 65 38, 66 29 Q 78 28, 88 31 C 92 33, 91 39, 88 44 L 55 99 C 52 104, 48 104, 45 99 L 12 44 C 9 39, 8 33, 12 31 Q 22 28, 34 29 Z"
      fill="none"
      stroke="rgba(0,0,0,0.85)"
      strokeWidth="2.5"
    />

    {/* Centered Logo nestled perfectly inside the deep top cutout cradle */}
    <image
      href={AlfaRomeoLogo}
      x="30"
      y="-1"
      width="40"
      height="40"
      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.85))' }}
    />
  </svg>
)

/* --- Globals --- */

/* 1. Define the bounce animation */
const scudettoBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(10px); }
`

/* 2. Scroll indicator wrapper */
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

/* 3. Scudetto SVG Styling */
const ScudettoSVG = styled.svg`
  width: 26px;
  height: 38px;
  overflow: visible;

  .scudetto-mesh {
    fill: none; /* Removed mesh from tiny icon for clarity */
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

/* 4. The Scudetto React Component (Geometry updated to match main icon) */
const ScudettoArrow = () => (
  <ScudettoSVG viewBox="0 0 30 40">
    {/* Outer Chrome Shield Tracing */}
    <path
      className="scudetto-outline"
      d="M 10 8 C 10 13, 20 13, 20 8 Q 24 8, 27 9 C 29 10, 29 13, 27 15 L 18 34 C 16 37, 14 37, 12 34 L 3 15 C 1 13, 1 10, 3 9 Q 6 8, 10 8 Z"
    />

    {/* Inner "V" highlight line */}
    <path
      className="scudetto-inner"
      d="M 11 9 C 11 12, 19 12, 19 9 Q 23 9, 25 10 C 26 11, 26 12, 25 14 L 17 32 C 16 34, 14 34, 13 32 L 5 14 C 4 12, 4 11, 5 10 Q 7 9, 11 9 Z"
    />

    {/* Bouncing Element indicating scroll action */}
    <g className="scroll-bouncer">
      <rect x="14" y="16" width="2" height="6" rx="1" />
    </g>

    {/* Alfa Romeo Badge */}
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
          <SpecButtonContainer onClick={scrollToNext}>
            <DetailedScudettoIcon />
            <SpecButtonText>View Specs</SpecButtonText>
          </SpecButtonContainer>
        </ButtonGroup>
      </GlassPanel>

      <ScrollIndicator onClick={scrollToNext}>
        <ScrollText className="scroll-text">Scroll down</ScrollText>
        <ScudettoArrow />
      </ScrollIndicator>
    </Section>
  )
}