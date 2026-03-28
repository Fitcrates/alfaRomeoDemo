import { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import AlfaRomeoLogo from '../../assets/Alfa Romeo.svg'

/* ── Animations ── */
const flagShimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

const subtlePulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`

const glow = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`

const barRise = keyframes`
  0% { transform: scaleY(0); }
  100% { transform: scaleY(1); }
`

/* ── Nav Shell ── */
const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  background: linear-gradient(
    180deg,
    rgba(14, 14, 18, 0.97) 100%,
    rgba(10, 10, 12, 0.94) 100%,
    rgba(10, 10, 12, 0) 100%
  );

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
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      #009246 0%,
      #009246 33.33%,
      #ffffff 33.33%,
      #ffffff 66.66%,
      #ce2b37 66.66%,
      #ce2b37 100%
    );
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: 768px) {
    padding: 0 1rem;
    height: 56px;
  }
`

/* ── Logo ── */
const Logo = styled.a`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
`

const LogoIcon = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 0 6px rgba(192, 57, 43, 0.25));
  transition: filter 0.3s ease;

  ${Logo}:hover & {
    filter: drop-shadow(0 0 10px rgba(192, 57, 43, 0.5));
  }
`

const LogoText = styled.span`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.15em;
  text-transform: uppercase;

  @media (max-width: 768px) {
    display: none;
  }
`

/* ── Navigation Links ── */
const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 0;

  @media (max-width: 768px) {
    display: none;
  }
`

const NavLink = styled.a`
  position: relative;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  transition: color 0.25s ease;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    width: 0;
    height: 1px;
    background: #c0392b;
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }

  &:hover {
    color: rgba(255, 255, 255, 0.95);
    &::after {
      width: 60%;
    }
  }
`

const LinkSeparator = styled.span`
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
  display: block;
`

/* ── CTA Buttons (UPDATED TO MATCH HERO/ENGINE COMPONENTS) ── */
const CTAGroup = styled.div`
  display: flex;
  align-items: center;
`

const BaseNavBtn = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 6px;
  padding: 0.55rem 1.3rem;
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  /* Glass highlight at top edge */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 30%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0.15) 70%,
      transparent 100%
    );
    pointer-events: none;
  }

  &:active {
    transform: scale(0.97) translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.45rem 0.9rem;
    font-size: 0.58rem;
  }
`

/* Primary Red Styling */
const TrackButton = styled(BaseNavBtn)`
  background: linear-gradient(
    135deg,
    rgba(192, 57, 43, 0.8) 0%,
    rgba(139, 0, 0, 0.8) 100%
  );
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(16px);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(255, 255, 255, 0.1) inset;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(231, 76, 60, 0.9) 0%,
      rgba(169, 0, 0, 0.9) 100%
    );
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow:
      0 8px 32px rgba(192, 57, 43, 0.4),
      0 0 20px rgba(192, 57, 43, 0.2),
      0 1px 2px rgba(255, 255, 255, 0.2) inset;
    transform: translateY(-1px);
  }
`

/* Secondary Glass Styling */
const ReturnButton = styled(BaseNavBtn)`
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.03) 100%
  );
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(255, 255, 255, 0.04) inset;

  /* Subtle inner glow */
  &::after {
    content: '';
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
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(192, 57, 43, 0.06),
      0 1px 2px rgba(255, 255, 255, 0.06) inset;
    transform: translateY(-1px);
  }
`

const StatusDot = styled.span`
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${(props) =>
    props.$active ? '#ffffff' : 'rgba(255,255,255,0.25)'};
  box-shadow: ${(props) =>
    props.$active ? '0 0 6px rgba(255,255,255,0.6)' : 'none'};
  margin-right: 0.5rem;
  animation: ${(props) => (props.$active ? subtlePulse : 'none')} 2s ease-in-out
    infinite;
`

/* ── Mobile Menu ── */
const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  span {
    width: 22px;
    height: 1.5px;
    background: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;
    border-radius: 1px;
  }
`

const MobileOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 12, 0.98);
  backdrop-filter: blur(20px);
  z-index: 90;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  pointer-events: ${(props) => (props.$isOpen ? 'auto' : 'none')};
  transition: opacity 0.4s ease;

  @media (min-width: 769px) {
    display: none;
  }
`

const MobileNavLink = styled.button`
  background: none;
  border: none;
  font-family: 'Orbitron', sans-serif;
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 0.5rem 1rem;
  cursor: pointer;

  &:active {
    color: #c0392b;
    transform: scale(0.95);
  }
`

const MobileMenuExitButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 32px;
    height: 32px;
    fill: currentColor;
  }
`

/* ── Modal Elements ── */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  pointer-events: ${(props) => (props.$isOpen ? 'auto' : 'none')};
  transition: opacity 0.35s ease;
`

const ModalPanel = styled.div`
  background: linear-gradient(
    145deg,
    rgba(22, 22, 26, 0.98) 0%,
    rgba(10, 10, 12, 0.99) 100%
  );
  border: 1px solid rgba(192, 57, 43, 0.35);
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 520px;
  width: 90vw;
  box-shadow:
    0 30px 100px rgba(0, 0, 0, 0.7),
    0 0 80px rgba(192, 57, 43, 0.15);
  transform: ${(props) =>
    props.$isOpen ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(20px)'};
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);

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
    border-radius: inherit;
  }
`

const ModalTitle = styled.h2`
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  color: #ffffff;
  text-align: center;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
`

const ModalSubtitle = styled.p`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-bottom: 2rem;
`

const TrackGrid = styled.div`
  display: flex;
  gap: 1rem;
  @media (max-width: 500px) {
    flex-direction: column;
  }
`

const TrackCard = styled.button`
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border-radius: 12px;
  padding: 1.5rem 1rem 1rem;
  background: linear-gradient(
    160deg,
    rgba(18, 18, 20, 1) 0%,
    rgba(8, 8, 10, 1) 100%
  );
  border: 1px solid rgba(192, 57, 43, 0.2);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 -1px 0 rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(
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
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.12) 30%,
      rgba(255, 255, 255, 0.18) 50%,
      rgba(255, 255, 255, 0.12) 70%,
      transparent 100%
    );
    pointer-events: none;
    border-radius: inherit;
  }

  &:hover {
    border-color: rgba(192, 57, 43, 0.55);
    box-shadow:
      0 8px 40px rgba(0, 0, 0, 0.5),
      0 0 28px rgba(192, 57, 43, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.97);
  }
`

const TrackIcon = styled.div`
  font-size: 2.5rem;
  line-height: 1;
  position: relative;
  z-index: 1;
`

const TrackName = styled.span`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
`

const TrackDesc = styled.span`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
  position: relative;
  z-index: 1;
`

/* ── Modal Card Visualizers ── */
const CardVisualizer = styled.div`
  width: 100%;
  padding: 0.75rem 0.75rem 0.6rem;
  background: linear-gradient(
    160deg,
    rgba(12, 12, 14, 1) 0%,
    rgba(6, 6, 8, 1) 100%
  );
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    pointer-events: none;
  }
`

const CardLightStrip = styled.div`
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
  box-shadow:
    0 0 20px rgba(192, 57, 43, 0.5),
    0 0 40px rgba(192, 57, 43, 0.2);
  margin-bottom: 0.6rem;
`

const CardBarGroup = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 24px;
`

const CardBar = styled.div`
  width: 4px;
  height: ${(props) => props.$height}px;
  background: linear-gradient(to top, rgba(192, 57, 43, 0.6), #c0392b);
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(192, 57, 43, 0.25);
  transform-origin: bottom;
  animation: ${barRise} 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: ${(props) => props.$delay}s;

  ${TrackCard}:hover & {
    box-shadow: 0 0 8px rgba(192, 57, 43, 0.55);
  }
`

const CardBarLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;

  span {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.25);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`

const ModalCloseBtn = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;

  &:hover {
    background: rgba(192, 57, 43, 0.2);
    border-color: rgba(192, 57, 43, 0.5);
    color: #ffffff;
  }
`

const DRIFT_BARS = [6, 18, 9, 22, 5, 20, 12, 24, 7, 15]
const KARTING_BARS = [18, 20, 22, 16, 24, 19, 21, 17, 23, 20]

export default function Navbar({ onTakeToRacetrack, inRacetrack }) {
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showTrackModal, setShowTrackModal] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleTrackSelect = (trackId) => {
    setShowTrackModal(false)
    onTakeToRacetrack(trackId)
  }

  return (
    <>
      <Nav $scrolled={scrolled}>
        <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>

          <LogoText>Alfa Romeo</LogoText>
          <LogoIcon src={AlfaRomeoLogo} alt="Alfa Romeo" />
        </Logo>

        <NavLinks>
          <NavLink onClick={() => scrollToSection('engine')}>
            Performance
          </NavLink>
          <LinkSeparator />
          <NavLink onClick={() => scrollToSection('suspension')}>
            Dynamics
          </NavLink>
          <LinkSeparator />
          <NavLink onClick={() => scrollToSection('interior')}>Interior</NavLink>
          <LinkSeparator />
          <NavLink onClick={() => scrollToSection('enginebay')}>
            Engine Bay
          </NavLink>
          <LinkSeparator />
          <NavLink onClick={() => scrollToSection('gallery')}>Colors</NavLink>
          <LinkSeparator />
          <NavLink onClick={() => scrollToSection('contact')}>
            Test Drive
          </NavLink>
          <LinkSeparator />
          <NavLink onClick={() => scrollToSection('footer')}>Credits</NavLink>
          <LinkSeparator />
          <NavLink onClick={() => scrollToSection('freeroam')}>
            Free Roam
          </NavLink>
        </NavLinks>

        {inRacetrack ? (
          <ReturnButton onClick={() => onTakeToRacetrack(null)}>
            <StatusDot $active />
            Return to Showcase
          </ReturnButton>
        ) : (
          <CTAGroup>
            <TrackButton onClick={() => setShowTrackModal(true)}>
              <StatusDot />
              Track Mode
            </TrackButton>
          </CTAGroup>
        )}

        <MobileMenuButton
          aria-label="Menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span />
          <span />
          <span />
        </MobileMenuButton>

        <MobileOverlay $isOpen={isMobileMenuOpen}>
          <MobileMenuExitButton onClick={() => setIsMobileMenuOpen(false)}>
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </MobileMenuExitButton>

          <MobileNavLink
            onClick={() => {
              scrollToSection('engine')
              setIsMobileMenuOpen(false)
            }}
          >
            Performance
          </MobileNavLink>
          <MobileNavLink
            onClick={() => {
              scrollToSection('suspension')
              setIsMobileMenuOpen(false)
            }}
          >
            Dynamics
          </MobileNavLink>
          <MobileNavLink
            onClick={() => {
              scrollToSection('interior')
              setIsMobileMenuOpen(false)
            }}
          >
            Interior
          </MobileNavLink>
          <MobileNavLink
            onClick={() => {
              scrollToSection('enginebay')
              setIsMobileMenuOpen(false)
            }}
          >
            Engine Bay
          </MobileNavLink>
          <MobileNavLink
            onClick={() => {
              scrollToSection('gallery')
              setIsMobileMenuOpen(false)
            }}
          >
            Colors
          </MobileNavLink>
          <MobileNavLink
            onClick={() => {
              scrollToSection('contact')
              setIsMobileMenuOpen(false)
            }}
          >
            Test Drive
          </MobileNavLink>
          <MobileNavLink
            onClick={() => {
              scrollToSection('footer')
              setIsMobileMenuOpen(false)
            }}
          >
            Credits
          </MobileNavLink>
          {!inRacetrack && (
            <TrackButton
              onClick={() => {
                setShowTrackModal(true)
                setIsMobileMenuOpen(false)
              }}
              style={{ marginTop: '1rem' }}
            >
              <StatusDot />
              Track Mode
            </TrackButton>
          )}
        </MobileOverlay>
      </Nav>

      {/* Track Selection Modal */}
      <ModalOverlay
        $isOpen={showTrackModal}
        onClick={() => setShowTrackModal(false)}
      >
        <ModalPanel
          $isOpen={showTrackModal}
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'relative' }}
        >
          <ModalCloseBtn onClick={() => setShowTrackModal(false)}>
            ✕
          </ModalCloseBtn>
          <ModalTitle>Select Track</ModalTitle>
          <ModalSubtitle>Choose your battleground</ModalSubtitle>

          <TrackGrid>
            {/* ── Drift Track card ── */}
            <TrackCard onClick={() => handleTrackSelect('drift')}>
              <TrackIcon>🏁</TrackIcon>
              <TrackName>Drift Track</TrackName>
              <TrackDesc>Open parking lot — perfect for drifting</TrackDesc>



            </TrackCard>

            {/* ── Karting Club card ── */}
            <TrackCard onClick={() => handleTrackSelect('karting')}>
              <TrackIcon>🏎️</TrackIcon>
              <TrackName>Karting Club</TrackName>
              <TrackDesc>Outdoor race track — precision and speed</TrackDesc>



            </TrackCard>
          </TrackGrid>
        </ModalPanel>
      </ModalOverlay>
    </>
  )
}