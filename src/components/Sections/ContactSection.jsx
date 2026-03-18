import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import EngineStartButton from "../UI/EngineStartButton";
import ContactForm from "../UI/ContactForm";

gsap.registerPlugin(ScrollTrigger);

const Section = styled.section`
  min-height: 150vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 5vw;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  text-align: center;
`;

const Panel = styled.div`
  width: 100%;
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
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(192, 57, 43, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  opacity: 0;
  transform: translateY(30px);

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

const SectionLabel = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.75rem;
  color: #c0392b;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  margin-bottom: 0.5rem;
`;

const Title = styled.h2`
  font-family: "Orbitron", sans-serif;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  color: #ffffff;
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
`;

const Subtitle = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
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

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
`;

const ButtonLabel = styled.span`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.25em;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(192, 57, 43, 0.5) 50%,
    transparent 100%
  );
  margin: 2rem 0;
`;

const DealerInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  text-align: left;
`;

const InfoCard = styled.div`
  padding: 1.5rem;
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

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.04) 50%,
      rgba(192, 57, 43, 0.06) 100%
    );
    border-color: rgba(192, 57, 43, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(192, 57, 43, 0.06),
      0 1px 2px rgba(255, 255, 255, 0.06) inset;
    transform: translateY(-1px);
  }
`;

const InfoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(
    145deg,
    rgba(192, 57, 43, 0.15),
    rgba(139, 0, 0, 0.1)
  );
  border: 1px solid rgba(192, 57, 43, 0.25);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;

  svg {
    width: 20px;
    height: 20px;
    stroke: #c0392b;
    fill: none;
    stroke-width: 2;
  }
`;

const InfoTitle = styled.h4`
  font-family: "Orbitron", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
  position: relative;
  z-index: 1;
`;

const InfoText = styled.p`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.95rem;
  color: #ffffff;
  line-height: 1.5;
  position: relative;
  z-index: 1;

  a {
    color: #c0392b;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #e74c3c;
    }
  }
`;

const MapContainer = styled.div`
  width: 100%;
  height: 220px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  margin-top: 2rem;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    filter: grayscale(1) invert(1) contrast(1.1) brightness(0.5)
      hue-rotate(180deg);
    transition: filter 0.4s ease;
  }

  &:hover iframe {
    filter: grayscale(0.6) invert(1) contrast(1) brightness(0.55)
      hue-rotate(180deg);
  }

  /* Glass overlay for blending */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      180deg,
      rgba(10, 10, 12, 0.3) 0%,
      transparent 30%,
      transparent 70%,
      rgba(10, 10, 12, 0.4) 100%
    );
    pointer-events: none;
  }
`;

export default function ContactSection({ id }) {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          gsap.to(panel, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
          });
        },
        onLeave: () => {
          gsap.to(panel, {
            opacity: 0,
            y: 30,
            duration: 0.5,
          });
        },
        onEnterBack: () => {
          gsap.to(panel, {
            opacity: 1,
            y: 0,
            duration: 0.5,
          });
        },
        onLeaveBack: () => {
          gsap.to(panel, {
            opacity: 0,
            y: 30,
            duration: 0.5,
          });
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <Section ref={sectionRef} id={id}>
      <ContentWrapper>
        <Panel ref={panelRef}>
          <SectionLabel>Experience</SectionLabel>
          <Title>Schedule a Test Drive</Title>
          <FlagDivider />
          <Subtitle>
            Feel the power of 510 horses. Experience the thrill of Italian
            engineering. Book your exclusive test drive today.
          </Subtitle>

          <ButtonWrapper>
            <ButtonLabel>Press to begin</ButtonLabel>
            <EngineStartButton
              onClick={() => setIsFormOpen(true)}
              size="140px"
            />
          </ButtonWrapper>

          <Divider />

          <DealerInfo>
            <InfoCard>
              <InfoIcon>
                <svg viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </InfoIcon>
              <InfoTitle>Location</InfoTitle>
              <InfoText>
                Alfa Romeo Milano
                <br />
                Via Gattamelata 45
                <br />
                20149 Milano, Italy
              </InfoText>
            </InfoCard>

            <InfoCard>
              <InfoIcon>
                <svg viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </InfoIcon>
              <InfoTitle>Contact</InfoTitle>
              <InfoText>
                <a href="tel:+390212345678">+39 02 1234 5678</a>
                <br />
                <a href="mailto:info@alfaromeo-milano.it">
                  info@alfaromeo-milano.it
                </a>
              </InfoText>
            </InfoCard>

            <InfoCard>
              <InfoIcon>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </InfoIcon>
              <InfoTitle>Hours</InfoTitle>
              <InfoText>
                Mon - Fri: 9:00 - 19:00
                <br />
                Saturday: 10:00 - 18:00
                <br />
                Sunday: Closed
              </InfoText>
            </InfoCard>
          </DealerInfo>

          <MapContainer>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2797.4!2d9.1456!3d45.4785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4786c1468b3e0c9b%3A0x6e1a6e36e3e3e3e3!2sVia+Gattamelata%2C+45%2C+20149+Milano+MI%2C+Italy!5e0!3m2!1sen!2sit!4v1700000000000!5m2!1sen!2sit"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Alfa Romeo Milano - Via Gattamelata 45"
            />
          </MapContainer>
        </Panel>
      </ContentWrapper>

      <ContactForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </Section>
  );
}