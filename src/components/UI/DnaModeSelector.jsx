import { useState } from 'react'
import styled, { keyframes } from 'styled-components'

const modes = [
  { id: 'dynamic', label: 'D', fullName: 'Dynamic', color: '#C0392B' },
  { id: 'natural', label: 'N', fullName: 'Natural', color: '#ffffff' },
  { id: 'efficient', label: 'A', fullName: 'Advanced Efficient', color: '#27ae60' },
  { id: 'race', label: 'R', fullName: 'Race', color: '#ff0000' }
]

const glow = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`

const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const SelectorBody = styled.div`
  position: relative;
  width: 200px;
  height: 60px;
  background: linear-gradient(
    145deg,
    #2a2a2a 0%,
    #1a1a1a 50%,
    #0a0a0a 100%
  );
  border-radius: 30px;
  padding: 5px;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.5),
    inset 0 2px 3px rgba(255, 255, 255, 0.05),
    inset 0 -2px 3px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-around;
`

const ChromeBezel = styled.div`
  position: absolute;
  inset: -3px;
  border-radius: 33px;
  background: linear-gradient(
    145deg,
    #e8e8e8 0%,
    #a0a0a0 25%,
    #c0c0c0 50%,
    #808080 75%,
    #a0a0a0 100%
  );
  z-index: -1;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
`

const ModeButton = styled.button`
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$active 
    ? `radial-gradient(circle, ${props.$color} 0%, ${props.$color}80 100%)`
    : 'linear-gradient(145deg, #3a3a3a, #1a1a1a)'
  };
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${props => props.$active
    ? `0 0 20px ${props.$color}80, inset 0 1px 2px rgba(255, 255, 255, 0.3)`
    : 'inset 0 2px 4px rgba(0, 0, 0, 0.5), inset 0 -1px 2px rgba(255, 255, 255, 0.1)'
  };
  
  &:hover {
    background: ${props => props.$active 
      ? `radial-gradient(circle, ${props.$color} 0%, ${props.$color}80 100%)`
      : 'linear-gradient(145deg, #4a4a4a, #2a2a2a)'
    };
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.$active ? props.$color : '#333'};
    box-shadow: ${props => props.$active ? `0 0 8px ${props.$color}` : 'none'};
    animation: ${props => props.$active ? glow : 'none'} 1.5s ease-in-out infinite;
  }
`

const ModeLabel = styled.span`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.$active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'};
  text-shadow: ${props => props.$active ? '0 0 10px rgba(255, 255, 255, 0.5)' : 'none'};
`

const ModeInfo = styled.div`
  text-align: center;
`

const ModeName = styled.div`
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: ${props => props.$color};
  text-transform: uppercase;
  letter-spacing: 0.15em;
  text-shadow: 0 0 20px ${props => props.$color}60;
  margin-bottom: 0.25rem;
`

const ModeDescription = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
`

const DnaTitle = styled.div`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
`

export default function DnaModeSelector({ onModeChange, initialMode = 'dynamic' }) {
  const [activeMode, setActiveMode] = useState(initialMode)
  
  const handleModeChange = (mode) => {
    setActiveMode(mode.id)
    if (onModeChange) {
      onModeChange(mode)
    }
  }
  
  const currentMode = modes.find(m => m.id === activeMode)

  return (
    <SelectorContainer>
      <DnaTitle>Alfa™ DNA Pro</DnaTitle>
      
      <SelectorBody>
        <ChromeBezel />
        {modes.map((mode) => (
          <ModeButton
            key={mode.id}
            $active={activeMode === mode.id}
            $color={mode.color}
            onClick={() => handleModeChange(mode)}
            aria-label={mode.fullName}
          >
            <ModeLabel $active={activeMode === mode.id}>
              {mode.label}
            </ModeLabel>
          </ModeButton>
        ))}
      </SelectorBody>
      
      <ModeInfo>
        <ModeName $color={currentMode.color}>
          {currentMode.fullName}
        </ModeName>
        <ModeDescription>
          {activeMode === 'dynamic' && 'Maximum performance & responsiveness'}
          {activeMode === 'natural' && 'Balanced everyday driving'}
          {activeMode === 'efficient' && 'Optimized fuel economy'}
          {activeMode === 'race' && 'Track-focused, all systems maximized'}
        </ModeDescription>
      </ModeInfo>
    </SelectorContainer>
  )
}
