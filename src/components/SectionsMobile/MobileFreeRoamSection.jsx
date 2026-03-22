import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MobilePanel from './MobilePanel'

gsap.registerPlugin(ScrollTrigger)

const Section = styled.section`
  height: 100svh;
  width: 100%;
`

const ControlOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90; /* below navbar if needed, or above. Navbar is z-index 100 */
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.4s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top, 0px) + 74px) 10px max(env(safe-area-inset-bottom, 20px), 20px) 10px;

  &.active {
    opacity: 1;
    pointer-events: auto;
  }
`

const TopControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const ActionButton = styled.button`
  background: linear-gradient(145deg, rgba(30, 30, 35, 0.9), rgba(15, 15, 18, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$active ? '#78c850' : 'rgba(255,255,255,0.6)'};
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  
  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
`

const HeaderActionBtn = styled.button`
  background: ${props => props.$primary ? 'rgba(192, 57, 43, 0.85)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px 16px;
  color: white;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  backdrop-filter: blur(10px);

  &:active {
    background: ${props => props.$primary ? 'rgba(192, 57, 43, 1)' : 'rgba(255, 255, 255, 0.2)'};
  }
`

const BottomControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  pointer-events: none;
`

const DPadContainer = styled.div`
  pointer-events: auto;
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(20, 20, 25, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const DPadBtn = styled.button`
  position: absolute;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;

  ${props => props.$active && `background: rgba(192, 57, 43, 0.6);`}

  &:active { background: rgba(192, 57, 43, 0.8); }

  svg { width: 24px; height: 24px; fill: currentColor; }
  &.up { top: 5px; left: 50%; transform: translateX(-50%); }
  &.down { bottom: 5px; left: 50%; transform: translateX(-50%); }
  &.left { left: 5px; top: 50%; transform: translateY(-50%); }
  &.right { right: 5px; top: 50%; transform: translateY(-50%); }
`

const PedalsContainer = styled.div`
  pointer-events: auto;
  display: flex;
  gap: 12px;
`

const PedalBtn = styled.button`
  width: ${props => props.$large ? '60px' : '50px'};
  height: ${props => props.$large ? '100px' : '80px'};
  background: linear-gradient(180deg, rgba(40,40,45,0.8), rgba(20,20,25,0.9));
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.8rem;
  font-weight: bold;
  
  ${props => props.$active && `
    background: linear-gradient(180deg, rgba(192,57,43,0.7), rgba(139,0,0,0.8));
    border-color: rgba(255,255,255,0.4);
  `}
`

const ActionPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 24px;
`

const ActionText = styled.p`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  max-width: 80%;
  margin: 0;
  line-height: 1.4;
`

export default function MobileFreeRoamSection({
  id,
  onFreeRoamEnter,
  onFreeRoamLeave,
  headlightsOn,
  engineOn,
  onToggleLights,
  onToggleEngine,
  onDrive,
  forceActive
}) {
  const sectionRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [isDriving, setIsDriving] = useState(forceActive || false)
  
  const [activeThrottle, setActiveThrottle] = useState(null)
  const [activeSteer, setActiveSteer] = useState(null)

  useEffect(() => {
    if (forceActive) {
      setIsActive(true)
      setIsDriving(true)
    }
  }, [forceActive])

  useEffect(() => {
    if (forceActive) return

    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 80%',
        end: 'bottom 20%',
        onEnter: () => { setIsActive(true) },
        onLeave: () => { setIsActive(false); setIsDriving(false); onFreeRoamLeave?.() },
        onEnterBack: () => { setIsActive(true) },
        onLeaveBack: () => { setIsActive(false); setIsDriving(false); onFreeRoamLeave?.() },
      })
    })

    return () => ctx.revert()
  }, [forceActive, onFreeRoamLeave])

  const sendCombined = (t, s) => {
    onDrive?.('combined', { throttle: t, steering: s })
  }

  const handleStart = (type, dir) => {
    if (!engineOn) return
    if (type === 'throttle') {
      setActiveThrottle(dir)
      sendCombined(dir, activeSteer)
    } else {
      setActiveSteer(dir)
      sendCombined(activeThrottle, dir)
    }
  }

  const handleEnd = (type) => {
    if (type === 'throttle') {
      setActiveThrottle(null)
      sendCombined(null, activeSteer)
    } else {
      setActiveSteer(null)
      sendCombined(activeThrottle, null)
    }
  }

  const mkProps = (type, dir) => ({
    onPointerDown: (e) => { e.preventDefault(); handleStart(type, dir) },
    onPointerUp: (e) => { e.preventDefault(); handleEnd(type) },
    onPointerLeave: (e) => { e.preventDefault(); handleEnd(type) },
    onPointerCancel: (e) => { e.preventDefault(); handleEnd(type) },
  })
  
  const startDriving = () => {
    setIsDriving(true)
    onFreeRoamEnter?.()
  }

  const stopDriving = () => {
    setIsDriving(false)
    onFreeRoamLeave?.()
  }

  const overlay = (
    <ControlOverlay className={(isActive && isDriving) ? 'active' : ''}>
      <TopControls>
        <ActionButton $active={headlightsOn} onClick={onToggleLights}>
          <svg viewBox="0 0 24 24">
            <path d="M4 12c0-3.3 2.7-6 6-6h1v12h-1c-3.3 0-6-2.7-6-6z" opacity="0.7" />
            <line x1="13" y1="7" x2="21" y2="4" stroke="currentColor" strokeWidth="1.5" />
            <line x1="13" y1="10" x2="22" y2="9" stroke="currentColor" strokeWidth="1.5" />
            <line x1="13" y1="14" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" />
            <line x1="13" y1="17" x2="21" y2="20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </ActionButton>
        
        {!forceActive && (
          <HeaderActionBtn onClick={stopDriving}>
            Stop
          </HeaderActionBtn>
        )}

        {forceActive && (
          <div style={{width: '48px'}}></div> // Spacer when in track mode
        )}

        <ActionButton $active={engineOn} onClick={onToggleEngine} style={{color: engineOn ? '#f39c12' : 'gray'}}>
           <svg viewBox="0 0 24 24"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>
        </ActionButton>
      </TopControls>

      <BottomControlsContainer>
        <DPadContainer>
            <DPadBtn className="left" $active={activeSteer==='left'} {...mkProps('steering', 'left')}>
               <svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
            </DPadBtn>
            <DPadBtn className="right" $active={activeSteer==='right'} {...mkProps('steering', 'right')}>
               <svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
            </DPadBtn>
        </DPadContainer>

        <PedalsContainer>
          <PedalBtn $active={activeThrottle==='backward'} {...mkProps('throttle', 'backward')}>BRK</PedalBtn>
          <PedalBtn $large $active={activeThrottle==='forward'} {...mkProps('throttle', 'forward')}>GAS</PedalBtn>
        </PedalsContainer>

      </BottomControlsContainer>
    </ControlOverlay>
  )

  if (!isDriving && !forceActive) {
    return (
      <>
        <MobilePanel
          id={id}
          label="Interactive"
          title="Studio Simulator"
          action={
            <ActionPage>
              <ActionText>
                Experience the raw power of the Giulia Quadrifoglio. Take full control and explore the studio.
              </ActionText>
              <HeaderActionBtn $primary onClick={startDriving} style={{padding: '12px 24px', fontSize: '0.9rem', width: '80%'}}>
                Start Driving
              </HeaderActionBtn>
            </ActionPage>
          }
        />
        <Section ref={sectionRef} style={{display: 'none', height: '1svh'}} />
      </>
    )
  }

  return (
    <>
      <Section ref={sectionRef} id={id} />
      {typeof document !== 'undefined' && createPortal(overlay, document.body)}
    </>
  )
}

