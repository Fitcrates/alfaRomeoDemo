import { useState, useEffect } from 'react'
import styled from 'styled-components'
import AlfaRomeoLogo from '../../assets/Alfa Romeo.svg'

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1.5rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  background: ${props => props.$scrolled 
    ? 'linear-gradient(180deg, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0) 100%)'
    : 'transparent'
  };
  
  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`

const Logo = styled.a`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  cursor: pointer;
`

const LogoIcon = styled.img`
  width: 45px;
  height: 45px;
  object-fit: contain;
`

const LogoText = styled.span`
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.15em;
  
  @media (max-width: 768px) {
    display: none;
  }
`

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`

const NavLink = styled.a`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: color 0.3s ease;
  cursor: pointer;
  
  &:hover {
    color: #C0392B;
  }
`

const CTAButton = styled.a`
  position: relative;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 0.65rem 1.75rem;
  background: transparent;
  border: 1px solid rgba(192, 57, 43, 0.6);
  border-radius: 4px;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;

  /* Thin red accent line at top */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      #c0392b,
      transparent
    );
    transition: width 0.3s ease;
  }

  /* Subtle fill on hover */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, rgba(192, 57, 43, 0.15), rgba(139, 0, 0, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }

  &:hover {
    border-color: rgba(192, 57, 43, 0.9);
    color: #ffffff;
    text-shadow: 0 0 8px rgba(192, 57, 43, 0.4);

    &::before {
      width: 100%;
    }

    &::after {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(0.97);
  }

  @media (max-width: 768px) {
    padding: 0.55rem 1.2rem;
    font-size: 0.65rem;
  }
`

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  span {
    width: 24px;
    height: 2px;
    background: #ffffff;
    transition: all 0.3s ease;
  }
`

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

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
        <NavLink onClick={() => scrollToSection('suspension')}>Dynamics</NavLink>
        <NavLink onClick={() => scrollToSection('interior')}>Interior</NavLink>
        <NavLink onClick={() => scrollToSection('enginebay')}>Engine Bay</NavLink>
        <NavLink onClick={() => scrollToSection('gallery')}>Colors</NavLink>
        <NavLink onClick={() => scrollToSection('freeroam')}>Free Roam</NavLink>
        <NavLink onClick={() => scrollToSection('footer')}>Credits</NavLink>
      </NavLinks>
      
      <CTAButton onClick={() => scrollToSection('contact')}>
        Test Drive
      </CTAButton>
      
      <MobileMenuButton aria-label="Menu">
        <span />
        <span />
        <span />
      </MobileMenuButton>
    </Nav>
  )
}
