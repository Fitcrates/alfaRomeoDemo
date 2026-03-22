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
  
  /* Carbon fiber base */
  background:
    linear-gradient(
      180deg,
      rgba(14, 14, 18, 0.97) 100%,
      rgba(10, 10, 12, 0.94) 100%,
      rgba(10, 10, 12, 0) 100%
    );

  /* Carbon weave texture overlay */
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

 /* Bottom accent line — Italian flag */
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

  /* Hover underline accent */
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

/* ── Vertical separator between links ── */
const LinkSeparator = styled.span`
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
  display: block;
`

/* ── CTA Buttons ── */
const CTAGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`

const CTAButton = styled.a`
  position: relative;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.62rem;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 0.55rem 1.3rem;
  cursor: pointer;
  overflow: hidden;
  border-radius: 4px;
  transition: all 0.3s ease;
  white-space: nowrap;

  /* Carbon + glass background */
  background:
    linear-gradient(
      160deg,
      rgba(22, 22, 26, 0.9) 0%,
      rgba(12, 12, 16, 0.95) 100%
    );
  border: 1px solid rgba(192, 57, 43, 0.35);
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);

  /* Carbon fiber micro-texture */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 1px,
        rgba(255, 255, 255, 0.015) 1px,
        rgba(255, 255, 255, 0.015) 2px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 1px,
        rgba(255, 255, 255, 0.015) 1px,
        rgba(255, 255, 255, 0.015) 2px
      );
    pointer-events: none;
    border-radius: inherit;
  }

  /* Top accent line */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(192, 57, 43, 0.6),
      transparent
    );
    transition: width 0.3s ease;
  }

  &:hover {
    border-color: rgba(192, 57, 43, 0.7);
    box-shadow:
      0 4px 20px rgba(192, 57, 43, 0.15),
      0 2px 12px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    text-shadow: 0 0 8px rgba(192, 57, 43, 0.3);

    &::after {
      width: 90%;
    }
  }

  &:active {
    transform: scale(0.97);
  }

  @media (max-width: 768px) {
    padding: 0.45rem 0.9rem;
    font-size: 0.58rem;
  }
`

/* Track Mode variant — more visually prominent */
const TrackButton = styled(CTAButton)`
  background:
    linear-gradient(
      160deg,
      rgba(192, 57, 43, 0.12) 0%,
      rgba(139, 0, 0, 0.08) 100%
    );
  border-color: rgba(192, 57, 43, 0.45);

  &:hover {
    background:
      linear-gradient(
        160deg,
        rgba(192, 57, 43, 0.22) 0%,
        rgba(139, 0, 0, 0.15) 100%
      );
    border-color: rgba(192, 57, 43, 0.8);
  }
`

/* Return variant for racetrack */
const ReturnButton = styled(CTAButton)`
  background: rgba(192, 57, 43, 0.15);

  &::after {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
  }
`

/* Status LED dot */
const StatusDot = styled.span`
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${props => props.$active ? '#c0392b' : 'rgba(255,255,255,0.15)'};
  box-shadow: ${props => props.$active ? '0 0 6px rgba(192,57,43,0.6)' : 'none'};
  margin-right: 0.4rem;
  animation: ${props => props.$active ? subtlePulse : 'none'} 2s ease-in-out infinite;
`

/* ── Mobile Hamburger ── */
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
  opacity: ${props => props.$isOpen ? 1 : 0};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
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

export default function Navbar({ onTakeToRacetrack, inRacetrack }) {
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  return (
    <Nav $scrolled={scrolled}>
      <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <LogoIcon src={AlfaRomeoLogo} alt="Alfa Romeo" />
        <LogoText>Alfa Romeo</LogoText>
      </Logo>

      <NavLinks>
        <NavLink onClick={() => scrollToSection('engine')}>Performance</NavLink>
        <LinkSeparator />
        <NavLink onClick={() => scrollToSection('suspension')}>Dynamics</NavLink>
        <LinkSeparator />
        <NavLink onClick={() => scrollToSection('interior')}>Interior</NavLink>
        <LinkSeparator />
        <NavLink onClick={() => scrollToSection('enginebay')}>Engine Bay</NavLink>
        <LinkSeparator />
        <NavLink onClick={() => scrollToSection('gallery')}>Colors</NavLink>
        <LinkSeparator />
        <NavLink onClick={() => scrollToSection('contact')}>Test Drive</NavLink>
        <LinkSeparator />
        <NavLink onClick={() => scrollToSection('footer')}>Credits</NavLink>
        <LinkSeparator />
        <NavLink onClick={() => scrollToSection('freeroam')}>Free Roam</NavLink>
      </NavLinks>

      {inRacetrack ? (
        <ReturnButton onClick={onTakeToRacetrack}>
          <StatusDot $active />
          Return to Showcase
        </ReturnButton>
      ) : (
        <CTAGroup>
          <TrackButton onClick={onTakeToRacetrack}>
            <StatusDot />
            Track Mode
          </TrackButton>
        </CTAGroup>
      )}

      <MobileMenuButton aria-label="Menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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

        <MobileNavLink onClick={() => { scrollToSection('engine'); setIsMobileMenuOpen(false); }}>Performance</MobileNavLink>
        <MobileNavLink onClick={() => { scrollToSection('suspension'); setIsMobileMenuOpen(false); }}>Dynamics</MobileNavLink>
        <MobileNavLink onClick={() => { scrollToSection('interior'); setIsMobileMenuOpen(false); }}>Interior</MobileNavLink>
        <MobileNavLink onClick={() => { scrollToSection('enginebay'); setIsMobileMenuOpen(false); }}>Engine Bay</MobileNavLink>
        <MobileNavLink onClick={() => { scrollToSection('gallery'); setIsMobileMenuOpen(false); }}>Colors</MobileNavLink>
        <MobileNavLink onClick={() => { scrollToSection('contact'); setIsMobileMenuOpen(false); }}>Test Drive</MobileNavLink>
        <MobileNavLink onClick={() => { scrollToSection('footer'); setIsMobileMenuOpen(false); }}>Credits</MobileNavLink>
        {/* Track Mode button inside mobile menu as well */}
        {!inRacetrack && (
          <TrackButton onClick={() => { onTakeToRacetrack(); setIsMobileMenuOpen(false); }} style={{marginTop: '1rem'}}>
            <StatusDot />
            Track Mode
          </TrackButton>
        )}
      </MobileOverlay>
    </Nav>
  )
}
