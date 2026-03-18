import { useState } from "react";
import styled, { keyframes } from "styled-components";
import EngineStartButton from "./EngineStartButton";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const Modal = styled.div`
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    rgba(22, 22, 26, 0.96) 0%,
    rgba(10, 10, 12, 0.98) 100%
  );
  border: 1px solid rgba(192, 57, 43, 0.25);
  border-radius: 14px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  animation: ${fadeIn} 0.3s ease-out;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(192, 57, 43, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);

  /* Carbon fiber texture */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
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
    border-radius: inherit;
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;

  &:hover {
    background: rgba(192, 57, 43, 0.2);
    border-color: rgba(192, 57, 43, 0.5);
    color: #ffffff;
  }
`;

const Title = styled.h2`
  font-family: "Orbitron", sans-serif;
  font-size: 1.5rem;
  color: #ffffff;
  text-align: center;
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
`;

const Subtitle = styled.p`
  font-family: "Rajdhani", sans-serif;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-bottom: 0.75rem;
`;

const FlagDivider = styled.div`
  width: 60px;
  height: 3px;
  border-radius: 2px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(
    90deg,
    #009246 0%,
    #009246 33%,
    #ffffff 33%,
    #ffffff 66%,
    #ce2b37 66%,
    #ce2b37 100%
  );
  opacity: 0.6;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(192, 57, 43, 0.03) 100%
  );
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 1rem 1.25rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(255, 255, 255, 0.04) inset;
  transition: all 0.3s ease;

  /* Glass highlight at top edge */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 30%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.15) 70%,
      transparent 100%
    );
    pointer-events: none;
  }

  /* Subtle inner glow */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      ellipse at 30% 0%,
      rgba(255, 255, 255, 0.04) 0%,
      transparent 60%
    );
    pointer-events: none;
  }

  &:focus-within {
    border-color: rgba(192, 57, 43, 0.35);
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.03) 50%,
      rgba(192, 57, 43, 0.05) 100%
    );
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(192, 57, 43, 0.06),
      0 1px 2px rgba(255, 255, 255, 0.06) inset;
  }
`;

const Label = styled.label`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  position: relative;
  z-index: 1;
`;

const Input = styled.input`
  font-family: "Rajdhani", sans-serif;
  font-size: 1rem;
  padding: 0;
  background: transparent;
  border: none;
  color: #ffffff;
  position: relative;
  z-index: 1;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  /* Style the date input icon */
  &::-webkit-calendar-picker-indicator {
    filter: invert(0.5);
    cursor: pointer;
  }
`;

const SubmitContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const SubmitText = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.2em;
`;

const SuccessMessage = styled.div`
  text-align: center;
  padding: 2rem;

  h3 {
    font-family: "Orbitron", sans-serif;
    font-size: 1.5rem;
    color: #27ae60;
    margin-bottom: 1rem;
  }

  p {
    font-family: "Rajdhani", sans-serif;
    color: rgba(255, 255, 255, 0.7);
  }
`;

export default function ContactForm({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Validate required fields manually since we bypass native form submit
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.preferredDate
    ) {
      return;
    }

    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        preferredDate: "",
      });
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>

        {isSubmitted ? (
          <SuccessMessage>
            <h3>Request Confirmed</h3>
            <p>
              Our team will contact you shortly to confirm your test drive
              appointment.
            </p>
          </SuccessMessage>
        ) : (
          <>
            <Title>Schedule Test Drive</Title>
            <Subtitle>Experience the Giulia Quadrifoglio</Subtitle>
            <FlagDivider />

            <Form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <InputGroup>
                <Label>Full Name</Label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </InputGroup>

              <InputGroup>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </InputGroup>

              <InputGroup>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </InputGroup>

              <InputGroup>
                <Label>Preferred Date</Label>
                <Input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  required
                />
              </InputGroup>

              <SubmitContainer>
                <SubmitText>Press to confirm</SubmitText>
                <EngineStartButton
                  onClick={() => handleSubmit()}
                  size="100px"
                />
              </SubmitContainer>
            </Form>
          </>
        )}
      </Modal>
    </Overlay>
  );
}