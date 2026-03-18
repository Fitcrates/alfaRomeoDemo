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

const Title = styled.h1`
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(2.5rem, 8vw, 6rem);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  opacity: 0;
  animation: ${fadeInUp} 1.2s ease-out 0.5s forwards;
  text-shadow: 
    0 0 40px rgba(192, 57, 43, 0.3),
    0 4px 20px rgba(0, 0, 0, 0.5);
  
  span {
    display: block;
    font-size: 0.35em;
    letter-spacing: 0.4em;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.5rem;
  }
`

const Subtitle = styled.p`
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0;
  animation: ${fadeInUp} 1.2s ease-out 0.8s forwards;
  
  span {
    color: #C0392B;
    font-weight: 700;
  }
`

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
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.3em;
`

const ScrollArrow = styled.div`
  width: 24px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.3);
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
    background: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
  }
`

const AlfaLogo = styled.img`
  position: absolute;
  top: 5vh;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  animation: ${fadeInUp} 1s ease-out 0.3s forwards;
  width: 70px;
  height: 70px;
  object-fit: contain;
`

const Tagline = styled.div`
  margin-top: 2rem;
  opacity: 0;
  animation: ${fadeInUp} 1.2s ease-out 1.1s forwards;
  
  span {
    font-family: 'Exo 2', sans-serif;
    font-size: 0.9rem;
    font-style: italic;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.1em;
  }
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
      </Content>
      
      <ScrollIndicator onClick={scrollToNext}>
        <ScrollText>Explore</ScrollText>
        <ScrollArrow />
      </ScrollIndicator>
    </Section>
  )
}
