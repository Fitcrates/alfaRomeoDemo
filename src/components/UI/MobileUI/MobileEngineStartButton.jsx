import { useState } from "react";
import styled, { keyframes, css } from "styled-components";

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 12px rgba(192, 57, 43, 0.5); }
  50% { box-shadow: 0 0 24px rgba(192, 57, 43, 0.8); }
`;

const ButtonContainer = styled.button`
  position: relative;
  width: ${(p) => p.$size || "64px"};
  height: ${(p) => p.$size || "64px"};
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: transparent;
  padding: 0;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:focus {
    outline: none;
  }
`;

const OuterRing = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(
    145deg,
    #d0d0d0 0%,
    #909090 25%,
    #b0b0b0 50%,
    #707070 75%,
    #909090 100%
  );
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.3),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3);
`;

const MiddleRing = styled.div`
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8),
    inset 0 -1px 1px rgba(255, 255, 255, 0.1);
`;

const InnerButton = styled.div`
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: ${(p) =>
        p.$active
            ? "linear-gradient(145deg, #ff4444 0%, #8B0000 100%)"
            : "linear-gradient(145deg, #C0392B 0%, #8B0000 50%, #5a1a1a 100%)"};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(192, 57, 43, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.2),
    inset 0 -1px 3px rgba(0, 0, 0, 0.3);

  ${(p) =>
        p.$active &&
        css`
      animation: ${pulse} 1.5s ease-in-out infinite;
    `}

  ${ButtonContainer}:active & {
    transform: scale(0.93);
    box-shadow: 0 1px 5px rgba(192, 57, 43, 0.4),
      inset 0 1px 3px rgba(0, 0, 0, 0.4),
      inset 0 -1px 1px rgba(255, 255, 255, 0.1);
  }
`;

const PowerIcon = styled.div`
  width: 14px;
  height: 14px;

  svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: #ffffff;
    stroke-width: 2.5;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
  }
`;

const ButtonText = styled.span`
  font-family: "Orbitron", sans-serif;
  font-size: 0.32rem;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
  line-height: 1;
  text-align: center;
`;

export default function MobileEngineStartButton({
    onClick,
    size = "64px",
    active = false,
}) {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = () => {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
        if (onClick) onClick();
    };

    return (
        <ButtonContainer $size={size} onClick={handleClick}>
            <OuterRing />
            <MiddleRing />
            <InnerButton $active={active || isPressed}>
                <PowerIcon>
                    <svg viewBox="0 0 24 24">
                        <path
                            d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0"
                            strokeLinecap="round"
                        />
                    </svg>
                </PowerIcon>
                <ButtonText>ENGINE</ButtonText>
            </InnerButton>
        </ButtonContainer>
    );
}