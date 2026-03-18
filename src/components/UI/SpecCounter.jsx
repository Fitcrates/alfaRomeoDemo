import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const CounterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const Value = styled.div`
  font-family: 'Orbitron', sans-serif;
  font-size: ${props => props.$size || '2.5rem'};
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
  
  span.unit {
    font-size: 0.5em;
    color: rgba(255, 255, 255, 0.6);
    margin-left: 0.25em;
  }
`

const Label = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.15em;
`

export default function SpecCounter({ 
  value, 
  label, 
  unit = '', 
  duration = 2000,
  decimals = 0,
  size = '2.5rem',
  isVisible = true 
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef(null)
  const animationRef = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return
    
    hasAnimated.current = true
    startTimeRef.current = null
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }
      
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = easeOutQuart * value
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration, isVisible])

  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString()

  return (
    <CounterContainer>
      <Value $size={size}>
        {formattedValue}
        {unit && <span className="unit">{unit}</span>}
      </Value>
      <Label>{label}</Label>
    </CounterContainer>
  )
}
