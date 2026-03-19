import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes, css } from 'styled-components'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import EngineStartButton from '../UI/EngineStartButton'

gsap.registerPlugin(ScrollTrigger)

const breathe = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(192, 57, 43, 0.3), inset 0 0 4px rgba(192, 57, 43, 0.1); }
  50% { box-shadow: 0 0 16px rgba(192, 57, 43, 0.5), inset 0 0 8px rgba(192, 57, 43, 0.2); }
`

const flagShimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

const Section = styled.section`
  min-height: 150vh;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  position: relative;
  padding: 0 2vw 2vh 2vw;
`

const ControlPanel = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  gap: 0;
  align-items: stretch;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;

  &.active {
    opacity: 1;
    pointer-events: auto;
  }
`

/* ── Main console body ── */
const ConsoleBody = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 0;
  background:
    linear-gradient(
      160deg,
      rgba(18, 18, 22, 0.96) 0%,
      rgba(12, 12, 16, 0.98) 100%
    );
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.6),
    0 2px 0 rgba(255, 255, 255, 0.04) inset;

  /* Carbon fibre texture overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.015) 2px,
        rgba(255, 255, 255, 0.015) 4px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.015) 2px,
        rgba(255, 255, 255, 0.015) 4px
      );
    pointer-events: none;
    z-index: 0;
  }
`

const PanelSection = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 20px;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 14px;
    bottom: 14px;
    width: 1px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(255, 255, 255, 0.08) 30%,
      rgba(255, 255, 255, 0.08) 70%,
      transparent 100%
    );
  }
`

const PanelLabel = styled.div`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.28);
  text-transform: uppercase;
  letter-spacing: 0.25em;
  margin-bottom: 14px;
  text-align: center;
`

/* ── Italian flag accent stripe ── */
const FlagStripe = styled.div`
  width: 100%;
  height: 3px;
  border-radius: 2px;
  margin-bottom: 14px;
  background: linear-gradient(
    90deg,
    #009246 0%,
    #009246 33%,
    #ffffff 33%,
    #ffffff 66%,
    #CE2B37 66%,
    #CE2B37 100%
  );
  opacity: 0.7;
`

/* ── Drive Controls ── */
const ShifterArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`

const ShifterGate = styled.div`
  position: relative;
  width: 120px;
  height: 160px;
  background: linear-gradient(
    180deg,
    rgba(30, 30, 35, 0.9) 0%,
    rgba(20, 20, 25, 0.95) 100%
  );
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 8px;
`

const GearLabel = styled.button`
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$active
    ? 'linear-gradient(180deg, rgba(192, 57, 43, 0.35), rgba(139, 0, 0, 0.25))'
    : 'transparent'
  };
  border: none;
  border-radius: 6px;
  color: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.35)'};
  font-family: 'Orbitron', sans-serif;
  font-size: ${props => props.$small ? '0.65rem' : '0.85rem'};
  font-weight: 700;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  ${props => props.$active && css`
    text-shadow: 0 0 12px rgba(192, 57, 43, 0.6);
    &::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #C0392B;
      box-shadow: 0 0 6px rgba(192, 57, 43, 0.8);
    }
  `}

  &:hover {
    color: rgba(255, 255, 255, 0.7);
    background: rgba(192, 57, 43, 0.15);
  }

  &:active {
    transform: scale(0.96);
  }
`

const ManualRow = styled.div`
  display: flex;
  width: 100%;
  gap: 2px;
`

const ShifterKnobIndicator = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin: 4px 0;
  background: linear-gradient(
    145deg,
    rgba(50, 50, 55, 0.9),
    rgba(25, 25, 30, 0.95)
  );
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;

  /* Red stitch accent */
  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1px dashed rgba(192, 57, 43, 0.3);
  }
`

const GearStatus = styled.div`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  color: ${props => props.$moving ? '#C0392B' : 'rgba(255, 255, 255, 0.2)'};
  text-align: center;
  margin-top: 8px;
  letter-spacing: 0.15em;
  transition: color 0.3s ease;
  text-shadow: ${props => props.$moving ? '0 0 8px rgba(192,57,43,0.4)' : 'none'};
`

/* ── Rotary Knob (for steering) ── */
const RotaryArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`

const RotaryOuter = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(
    145deg,
    rgba(45, 45, 50, 0.9),
    rgba(20, 20, 25, 0.95)
  );
  border: 2px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

const RotaryRing = styled.div`
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.06);
`

const RotaryCenter = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(
    145deg,
    rgba(35, 35, 40, 0.95),
    rgba(15, 15, 18, 0.98)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.4),
    0 1px 0 rgba(255, 255, 255, 0.06);
  display: grid;
  grid-template-areas:
    '. up .'
    'left . right'
    '. down .';
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  align-items: center;
  justify-items: center;
  padding: 2px;
`

const RotaryArrow = styled.button`
  background: none;
  border: none;
  color: ${props => props.$active
    ? '#C0392B'
    : 'rgba(255, 255, 255, 0.3)'
  };
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  grid-area: ${props => props.$area};
  transition: all 0.15s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  &:active {
    color: #C0392B;
  }

  svg {
    width: 12px;
    height: 12px;
    fill: currentColor;
  }
`

/* Cardinal direction buttons around the rotary */
const DirectionButton = styled.button`
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${props => props.$active
    ? 'linear-gradient(145deg, rgba(192, 57, 43, 0.5), rgba(139, 0, 0, 0.35))'
    : 'linear-gradient(145deg, rgba(40, 40, 45, 0.8), rgba(25, 25, 30, 0.9))'
  };
  border: 1px solid ${props => props.$active
    ? 'rgba(192, 57, 43, 0.5)'
    : 'rgba(255, 255, 255, 0.08)'
  };
  color: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.4)'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: ${props => props.$active
    ? '0 0 10px rgba(192, 57, 43, 0.3)'
    : '0 2px 6px rgba(0, 0, 0, 0.3)'
  };

  ${props => props.$top && 'top: -6px; left: 50%; transform: translateX(-50%);'}
  ${props => props.$bottom && 'bottom: -6px; left: 50%; transform: translateX(-50%);'}
  ${props => props.$left && 'left: -6px; top: 50%; transform: translateY(-50%);'}
  ${props => props.$right && 'right: -6px; top: 50%; transform: translateY(-50%);'}

  &:hover {
    border-color: rgba(192, 57, 43, 0.4);
    color: rgba(255, 255, 255, 0.8);
  }

  &:active {
    transform: ${props => {
    if (props.$top) return 'translateX(-50%) scale(0.92)'
    if (props.$bottom) return 'translateX(-50%) scale(0.92)'
    if (props.$left) return 'translateY(-50%) scale(0.92)'
    if (props.$right) return 'translateY(-50%) scale(0.92)'
    return 'scale(0.92)'
  }};
  }

  svg {
    width: 12px;
    height: 12px;
    fill: currentColor;
  }
`

/* ── Lights Toggle (round chrome-ring button) ── */
const LightsArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`

const LightsButton = styled.button`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${props => props.$active
    ? 'linear-gradient(145deg, rgba(60, 60, 65, 0.9), rgba(30, 30, 35, 0.95))'
    : 'linear-gradient(145deg, rgba(40, 40, 45, 0.8), rgba(20, 20, 25, 0.95))'
  };
  border: 2px solid ${props => props.$active
    ? 'rgba(120, 200, 80, 0.5)'
    : 'rgba(255, 255, 255, 0.1)'
  };
  box-shadow:
    ${props => props.$active
    ? '0 0 16px rgba(120, 200, 80, 0.25), inset 0 0 8px rgba(120, 200, 80, 0.1)'
    : '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
  };
  color: ${props => props.$active ? '#78c850' : 'rgba(255, 255, 255, 0.35)'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;

  /* Chrome ring */
  &::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: linear-gradient(
      145deg,
      rgba(80, 80, 85, 0.3),
      rgba(40, 40, 45, 0.1)
    );
    z-index: -1;
  }

  ${props => props.$active && css`animation: ${breathe} 3s ease-in-out infinite;`}

  &:hover {
    transform: scale(1.05);
    border-color: ${props => props.$active
    ? 'rgba(120, 200, 80, 0.6)'
    : 'rgba(255, 255, 255, 0.2)'
  };
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 30px;
    height: 30px;
    fill: currentColor;
  }
`

const LightsStatus = styled.div`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.55rem;
  color: ${props => props.$active ? '#78c850' : 'rgba(255, 255, 255, 0.2)'};
  letter-spacing: 0.15em;
  text-shadow: ${props => props.$active ? '0 0 6px rgba(120,200,80,0.3)' : 'none'};
  transition: all 0.3s ease;
`

/* ── Engine area ── */
const EngineArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`

const EngineStatus = styled.div`
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: ${props => props.$active ? '#78c850' : 'rgba(255, 255, 255, 0.3)'};
  text-shadow: ${props => props.$active ? '0 0 8px rgba(120, 200, 80, 0.4)' : 'none'};
  transition: all 0.3s ease;
`

/* ── Camera hints ── */
const HintsArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
`

const HintRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
`

const HintKey = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 24px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.55);
`

const ExitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  background: linear-gradient(
    145deg,
    rgba(192, 57, 43, 0.2),
    rgba(139, 0, 0, 0.15)
  );
  border: 1px solid rgba(192, 57, 43, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(192, 57, 43, 0.15);

  &:hover {
    background: linear-gradient(
      145deg,
      rgba(192, 57, 43, 0.35),
      rgba(139, 0, 0, 0.25)
    );
    border-color: rgba(192, 57, 43, 0.5);
    color: #ffffff;
  }

  &:active {
    transform: scale(0.96);
  }

  svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    fill: none;
  }
`

/* ──────────── Component ──────────── */
export default function FreeRoamSection({
  id,
  onFreeRoamEnter,
  onFreeRoamLeave,
  headlightsOn,
  engineOn,
  onToggleLights,
  onToggleEngine,
  onDrive,
}) {
  const sectionRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [activeDirection, setActiveDirection] = useState(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGINE SOUND SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  // IMPORTANT: DO NOT MODIFY WITHOUT UNDERSTANDING THE LOGIC!
  // 
  // The sound system has TWO states:
  // 1. engineOn (prop) - Current engine state from parent
  // 2. engineWasOnRef - Previous engine state (to detect CHANGES)
  //
  // Sound should ONLY play when engine TURNS ON (false -> true)
  // Sound should ONLY stop when engine TURNS OFF (true -> false)
  // Sound should NEVER play on component mount or when engineOn is already false
  // ═══════════════════════════════════════════════════════════════════════════

  const startupSoundRef = useRef(null)
  const runningSoundRef = useRef(null)
  // Track if we've already synced with the initial engineOn state
  const initialSyncDoneRef = useRef(false)
  // Track the PREVIOUS engine state to detect transitions
  const prevEngineOnRef = useRef(false)

  // Initialize audio elements ONCE on mount
  useEffect(() => {
    startupSoundRef.current = new Audio('/sounds/GiuliaEngine (mp3cut.net).mp3')
    startupSoundRef.current.volume = 0.6

    runningSoundRef.current = new Audio('/sounds/engingRunning.mp3')
    runningSoundRef.current.volume = 0
    runningSoundRef.current.loop = true // Native HTML5 loop for seamless playback

    return () => {
      // Cleanup on unmount
      if (startupSoundRef.current) {
        startupSoundRef.current.pause()
        startupSoundRef.current.onended = null
        startupSoundRef.current = null
      }
      if (runningSoundRef.current) {
        runningSoundRef.current.pause()
        runningSoundRef.current = null
      }
    }
  }, [])

  // Start the engine running loop sound (called after startup sound ends)
  const startEngineLoop = () => {
    if (!runningSoundRef.current) return
    const audio = runningSoundRef.current
    audio.currentTime = 0
    audio.volume = 0.6
    audio.play().catch(() => { })
  }

  // Handle engine state TRANSITIONS (not just state)
  useEffect(() => {
    // On first render, just sync the ref with current state - DON'T play sounds
    if (!initialSyncDoneRef.current) {
      initialSyncDoneRef.current = true
      prevEngineOnRef.current = engineOn
      return // EXIT - no sound on initial mount
    }

    // Detect state TRANSITION
    const wasOn = prevEngineOnRef.current
    const isOn = engineOn

    // Update ref for next render
    prevEngineOnRef.current = engineOn

    // ─────────────────────────────────────────────────────────────────────────
    // ENGINE TURNING ON (was OFF, now ON)
    // ─────────────────────────────────────────────────────────────────────────
    if (isOn && !wasOn) {
      if (startupSoundRef.current) {
        startupSoundRef.current.currentTime = 0
        startupSoundRef.current.play().catch(() => { })

        // When startup sound ends, start the running loop
        startupSoundRef.current.onended = () => {
          // Only start loop if engine is STILL on
          if (prevEngineOnRef.current) {
            startEngineLoop()
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENGINE TURNING OFF (was ON, now OFF)
    // ─────────────────────────────────────────────────────────────────────────
    if (!isOn && wasOn) {
      // Stop startup sound immediately and clear callback
      if (startupSoundRef.current) {
        startupSoundRef.current.pause()
        startupSoundRef.current.onended = null // CRITICAL: Remove callback!
        startupSoundRef.current.currentTime = 0
      }

      // Fade out running sound smoothly
      if (runningSoundRef.current && runningSoundRef.current.volume > 0) {
        const audio = runningSoundRef.current
        const fadeOut = () => {
          if (audio.volume > 0.05) {
            audio.volume = Math.max(0, audio.volume - 0.05)
            requestAnimationFrame(fadeOut)
          } else {
            audio.pause()
            audio.volume = 0
            audio.currentTime = 0
          }
        }
        fadeOut()
      }
    }

    // NOTE: If isOn === wasOn, no transition occurred, so no sound action needed
  }, [engineOn])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 80%',
        end: 'bottom 20%',
        onEnter: () => { setIsActive(true); onFreeRoamEnter?.() },
        onLeave: () => { setIsActive(false); onFreeRoamLeave?.() },
        onEnterBack: () => { setIsActive(true); onFreeRoamEnter?.() },
        onLeaveBack: () => { setIsActive(false); onFreeRoamLeave?.() },
      })
    })

    return () => ctx.revert()
  }, [onFreeRoamEnter, onFreeRoamLeave])

  /* Keyboard support - tracks multiple keys for combined movement */
  const keysPressed = useRef(new Set())

  useEffect(() => {
    if (!isActive) return

    const throttleKeys = {
      ArrowUp: 'forward', w: 'forward', W: 'forward',
      ArrowDown: 'backward', s: 'backward', S: 'backward',
    }
    const steeringKeys = {
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
    }

    const updateDriveState = () => {
      if (!engineOn) return

      // Determine throttle direction (W/S or Up/Down arrows)
      let throttle = null
      if (keysPressed.current.has('w') || keysPressed.current.has('W') || keysPressed.current.has('ArrowUp')) {
        throttle = 'forward'
      } else if (keysPressed.current.has('s') || keysPressed.current.has('S') || keysPressed.current.has('ArrowDown')) {
        throttle = 'backward'
      }

      // Determine steering direction (A/D or Left/Right arrows)
      let steering = null
      if (keysPressed.current.has('a') || keysPressed.current.has('A') || keysPressed.current.has('ArrowLeft')) {
        steering = 'left'
      } else if (keysPressed.current.has('d') || keysPressed.current.has('D') || keysPressed.current.has('ArrowRight')) {
        steering = 'right'
      }

      // Update active direction for UI feedback (show primary action)
      setActiveDirection(throttle || steering)

      // ═══════════════════════════════════════════════════════════════════════════
      // COMBINED INPUT: Send BOTH throttle and steering in a SINGLE call
      // This ensures React state update captures both values atomically
      // ═══════════════════════════════════════════════════════════════════════════
      onDrive?.('combined', { throttle, steering })
    }

    const onDown = (e) => {
      if (throttleKeys[e.key] || steeringKeys[e.key]) {
        keysPressed.current.add(e.key)
        updateDriveState()
      }
    }

    const onUp = (e) => {
      if (throttleKeys[e.key] || steeringKeys[e.key]) {
        keysPressed.current.delete(e.key)
        updateDriveState()
      }
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      keysPressed.current.clear()
    }
  }, [isActive, onDrive, engineOn])

  const handleDriveStart = (direction) => {
    if (!engineOn) return
    setActiveDirection(direction)
    // Determine if this is throttle or steering
    const isThrottle = direction === 'forward' || direction === 'backward'
    const type = isThrottle ? 'throttle' : 'steering'
    onDrive?.(type, direction, true)
  }

  const handleDriveEnd = (direction) => {
    setActiveDirection(null)
    // Determine if this is throttle or steering
    const isThrottle = direction === 'forward' || direction === 'backward'
    const type = isThrottle ? 'throttle' : 'steering'
    onDrive?.(type, null, false)
  }

  const mkDriveProps = (dir) => ({
    onMouseDown: () => handleDriveStart(dir),
    onMouseUp: () => handleDriveEnd(dir),
    onMouseLeave: () => handleDriveEnd(dir),
    onTouchStart: () => handleDriveStart(dir),
    onTouchEnd: () => handleDriveEnd(dir),
  })

  /* Headlight beam SVG icon (automotive style) */
  const HeadlightIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      {/* Lamp housing */}
      <path d="M4 12c0-3.3 2.7-6 6-6h1v12h-1c-3.3 0-6-2.7-6-6z" opacity="0.7" />
      {/* Beam lines */}
      <line x1="13" y1="7" x2="21" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="10" x2="22" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="14" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="17" x2="21" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )

  const ArrowUp = () => (
    <svg viewBox="0 0 24 24"><path d="M12 5l-7 7h4.5v7h5v-7H19z" /></svg>
  )
  const ArrowDown = () => (
    <svg viewBox="0 0 24 24"><path d="M12 19l7-7h-4.5V5h-5v7H5z" /></svg>
  )
  const ArrowLeft = () => (
    <svg viewBox="0 0 24 24"><path d="M5 12l7-7v4.5h7v5h-7V19z" /></svg>
  )
  const ArrowRight = () => (
    <svg viewBox="0 0 24 24"><path d="M19 12l-7 7v-4.5H5v-5h7V5z" /></svg>
  )

  const controlPanelContent = (
    <ControlPanel className={isActive ? 'active' : ''}>
      <ConsoleBody>
        {/* ── Engine Start ── */}
        <PanelSection>
          <PanelLabel>Engine</PanelLabel>
          <EngineArea>
            <EngineStartButton
              onClick={onToggleEngine}
              size="90px"
              active={engineOn}
            />
            <EngineStatus $active={engineOn}>
              {engineOn ? 'RUNNING' : 'OFF'}
            </EngineStatus>
            <ExitButton onClick={() => {
              const contact = document.getElementById('contact')
              if (contact) {
                contact.scrollIntoView({ behavior: 'smooth' })
              }
            }}>
              <svg viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Exit
            </ExitButton>
          </EngineArea>
        </PanelSection>

        {/* ── Camera hints ── */}
        <PanelSection>
          <PanelLabel>Camera</PanelLabel>
          <HintsArea>
            <HintRow>
              <HintKey>LMB</HintKey>
              <span>Rotate</span>
            </HintRow>
            <HintRow>
              <HintKey>RMB</HintKey>
              <span>Pan</span>
            </HintRow>
            <HintRow>
              <HintKey>Scroll</HintKey>
              <span>Zoom</span>
            </HintRow>
          </HintsArea>
        </PanelSection>

        {/* ── Shifter / Drive ── */}
        <PanelSection>
          <PanelLabel>Drive</PanelLabel>
          <FlagStripe />
          <ShifterArea>
            <ShifterGate>
              <GearLabel
                $active={activeDirection === 'forward'}
                {...mkDriveProps('forward')}
              >
                P
              </GearLabel>
              <GearLabel
                $active={activeDirection === 'forward'}
                {...mkDriveProps('forward')}
              >
                R
              </GearLabel>
              <ShifterKnobIndicator />
              <GearLabel
                $active={activeDirection === 'forward'}
                {...mkDriveProps('forward')}
              >
                N
              </GearLabel>
              <GearLabel
                $active={activeDirection === 'forward' || activeDirection === 'backward'}
                {...mkDriveProps('forward')}
              >
                D
              </GearLabel>
              <ManualRow>
                <GearLabel
                  $small
                  $active={activeDirection === 'left'}
                  {...mkDriveProps('left')}
                >
                  M−
                </GearLabel>
                <GearLabel
                  $small
                  $active={activeDirection === 'right'}
                  {...mkDriveProps('right')}
                >
                  M+
                </GearLabel>
              </ManualRow>
            </ShifterGate>
            <GearStatus $moving={!!activeDirection}>
              {activeDirection ? activeDirection.toUpperCase() : 'P'}
            </GearStatus>
          </ShifterArea>
        </PanelSection>

        {/* ── Rotary direction controller ── */}
        <PanelSection>
          <PanelLabel>Steer</PanelLabel>
          <RotaryArea>
            <RotaryOuter>
              <RotaryRing />

              <DirectionButton
                $top
                $active={activeDirection === 'forward'}
                {...mkDriveProps('forward')}
              >
                <ArrowUp />
              </DirectionButton>

              <DirectionButton
                $bottom
                $active={activeDirection === 'backward'}
                {...mkDriveProps('backward')}
              >
                <ArrowDown />
              </DirectionButton>

              <DirectionButton
                $left
                $active={activeDirection === 'left'}
                {...mkDriveProps('left')}
              >
                <ArrowLeft />
              </DirectionButton>

              <DirectionButton
                $right
                $active={activeDirection === 'right'}
                {...mkDriveProps('right')}
              >
                <ArrowRight />
              </DirectionButton>

              <RotaryCenter>
                <RotaryArrow
                  $area="up"
                  $active={activeDirection === 'forward'}
                  {...mkDriveProps('forward')}
                >
                  <ArrowUp />
                </RotaryArrow>
                <RotaryArrow
                  $area="left"
                  $active={activeDirection === 'left'}
                  {...mkDriveProps('left')}
                >
                  <ArrowLeft />
                </RotaryArrow>
                <RotaryArrow
                  $area="right"
                  $active={activeDirection === 'right'}
                  {...mkDriveProps('right')}
                >
                  <ArrowRight />
                </RotaryArrow>
                <RotaryArrow
                  $area="down"
                  $active={activeDirection === 'backward'}
                  {...mkDriveProps('backward')}
                >
                  <ArrowDown />
                </RotaryArrow>
              </RotaryCenter>
            </RotaryOuter>

            <HintRow>
              <HintKey>W</HintKey>
              <HintKey>A</HintKey>
              <HintKey>S</HintKey>
              <HintKey>D</HintKey>
            </HintRow>
          </RotaryArea>
        </PanelSection>

        {/* ── Headlights ── */}
        <PanelSection>
          <PanelLabel>Lights</PanelLabel>
          <LightsArea>
            <LightsButton $active={headlightsOn} onClick={onToggleLights}>
              <HeadlightIcon />
            </LightsButton>
            <LightsStatus $active={headlightsOn}>
              {headlightsOn ? 'ON' : 'OFF'}
            </LightsStatus>
          </LightsArea>
        </PanelSection>

      </ConsoleBody>
    </ControlPanel>
  )

  return (
    <>
      <Section ref={sectionRef} id={id} />
      {typeof document !== 'undefined' && createPortal(controlPanelContent, document.body)}
    </>
  )
}