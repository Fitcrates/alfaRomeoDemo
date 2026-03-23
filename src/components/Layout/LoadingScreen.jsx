import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import AlfaRomeoLogo from '../../assets/Alfa Romeo.svg'

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    visibility: hidden;
  }
`

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`

const LoadingContainer = styled.div`
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${props => props.$fadeOut ? fadeOut : 'none'} 0.8s ease-out forwards;
  animation-delay: ${props => props.$fadeOut ? '0.3s' : '0s'};
`

const Logo = styled.div`
  width: 100px;
  height: 100px;
  margin-bottom: 2rem;
  position: relative;
`

const LogoImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

const LogoRing = styled.svg`
  width: 100%;
  height: 100%;
`

const LogoCircle = styled.circle`
  fill: none;
  stroke: #C0392B;
  stroke-width: 2;
  stroke-dasharray: 314;
  stroke-dashoffset: ${props => 314 - (props.$progress / 100) * 314};
  transition: stroke-dashoffset 0.3s ease-out;
  transform: rotate(-90deg);
  transform-origin: center;
`

const BrandName = styled.h1`
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(1rem, 5vw, 1.5rem);
  color: #ffffff;
  letter-spacing: 0.3em;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  text-align: center;
  padding: 0 10px;
`

const ModelName = styled.p`
  font-family: 'Rajdhani', sans-serif;
  font-size: clamp(0.7rem, 3.5vw, 0.9rem);
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.2em;
  margin-bottom: 3rem;
  text-align: center;
  padding: 0 10px;
`

const ProgressContainer = styled.div`
  width: min(80vw, 200px);
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
  overflow: hidden;
  margin-bottom: 1rem;
`

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #C0392B, #E74C3C);
  width: ${props => props.$progress}%;
  transition: width 0.3s ease-out;
  box-shadow: 0 0 10px rgba(192, 57, 43, 0.5);
`

const ProgressText = styled.span`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  animation: ${pulse} 1.5s ease-in-out infinite;
`

export default function LoadingScreen({ progress = 0, isLoaded = false }) {
  const [shouldFadeOut, setShouldFadeOut] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      setShouldFadeOut(true)
      const timer = setTimeout(() => {
        setIsHidden(true)
      }, 1100)
      return () => clearTimeout(timer)
    } else {
      setShouldFadeOut(false)
      setIsHidden(false)
    }
  }, [isLoaded])

  if (isHidden) return null

  return (
    <LoadingContainer $fadeOut={shouldFadeOut}>
      <Logo>
        <LogoRing viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="48" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.1)" 
            strokeWidth="2"
          />
          <LogoCircle cx="50" cy="50" r="48" $progress={progress} />
        </LogoRing>
        <LogoImage src={AlfaRomeoLogo} alt="Alfa Romeo" />
      </Logo>
      
      <BrandName>Alfa Romeo</BrandName>
      <ModelName>Giulia Quadrifoglio</ModelName>
      
      <ProgressContainer>
        <ProgressBar $progress={progress} />
      </ProgressContainer>
      
      <ProgressText>
        {progress < 100 ? `Loading Experience... ${Math.round(progress)}%` : 'Ready'}
      </ProgressText>
    </LoadingContainer>
  )
}
