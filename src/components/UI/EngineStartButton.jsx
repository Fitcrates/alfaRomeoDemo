import { useState, useRef } from 'react'
import styled, { keyframes, css } from 'styled-components'

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(192, 57, 43, 0.5); }
  50% { box-shadow: 0 0 40px rgba(192, 57, 43, 0.8); }
`

const ButtonContainer = styled.button`
  position: relative;
  width: ${props => props.$size || '120px'};
  height: ${props => props.$size || '120px'};
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
  background: linear-gradient(
    145deg,
    #2a2a2a 0%,
    #1a1a1a 50%,
    #0a0a0a 100%
  );
  box-shadow: 
    inset 0 2px 5px rgba(0, 0, 0, 0.8),
    inset 0 -1px 2px rgba(255, 255, 255, 0.1);
`

const InnerButton = styled.div`
  position: absolute;
  inset: 15px;
  border-radius: 50%;
  background: ${props => props.$active 
    ? 'linear-gradient(145deg, #ff4444 0%, #8B0000 100%)'
    : 'linear-gradient(145deg, #C0392B 0%, #8B0000 50%, #5a1a1a 100%)'
  };
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 
    0 4px 15px rgba(192, 57, 43, 0.4),
    inset 0 2px 3px rgba(255, 255, 255, 0.2),
    inset 0 -2px 5px rgba(0, 0, 0, 0.3);
  
  ${props => props.$active && css`
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}
  
  ${ButtonContainer}:hover & {
    background: linear-gradient(145deg, #d94444 0%, #a02020 50%, #6a2020 100%);
    box-shadow: 
      0 6px 25px rgba(192, 57, 43, 0.6),
      inset 0 2px 3px rgba(255, 255, 255, 0.3),
      inset 0 -2px 5px rgba(0, 0, 0, 0.3);
  }
  
  ${ButtonContainer}:active & {
    transform: scale(0.95);
    box-shadow: 
      0 2px 10px rgba(192, 57, 43, 0.4),
      inset 0 2px 5px rgba(0, 0, 0, 0.4),
      inset 0 -1px 2px rgba(255, 255, 255, 0.1);
  }
`

const ButtonText = styled.span`
  font-family: 'Orbitron', sans-serif;
  font-size: ${props => props.$small ? '0.5rem' : '0.65rem'};
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

export default function EngineStartButton({ onClick, size = '120px', active = false }) {
  const [isPressed, setIsPressed] = useState(false)
  const audioRef = useRef(null)

  const handleClick = () => {
    setIsPressed(true)
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((e) => {
        console.warn("Audio playback failed:", e)
      })
    }
    
    setTimeout(() => setIsPressed(false), 150)
    
    if (onClick) onClick()
  }

  return (
    <ButtonContainer $size={size} onClick={handleClick}>
      <audio ref={audioRef} src="/sounds/GiuliaEngine (mp3cut.net).mp3" preload="auto" />
      <OuterRing />
      <MiddleRing />
      <InnerButton $active={active || isPressed}>
        <PowerIcon>
          <svg viewBox="0 0 24 24">
            <path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0" strokeLinecap="round" />
          </svg>
        </PowerIcon>
        <ButtonText>ENGINE</ButtonText>
        <ButtonText $small>START</ButtonText>
      </InnerButton>
    </ButtonContainer>
  )
}
