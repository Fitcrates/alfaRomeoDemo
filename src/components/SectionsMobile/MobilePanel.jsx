// SectionsMobile/MobilePanel.jsx
import { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Section = styled.section`
  height: 100vh;
  height: 100svh; /* Small viewport for mobile browsers */
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

/* Top half — transparent, car shows through from fixed Canvas */
const CarViewport = styled.div`
  flex: 0 0 60%;
  pointer-events: none;
  position: relative;

  /* Subtle gradient fade into panel */
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(
      to bottom,
      transparent,
      rgba(10, 10, 12, 0.6)
    );
    pointer-events: none;
  }
`;

/* Bottom half — content panel */
const PanelContainer = styled.div`
  flex: 0 0 40%;
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(14, 14, 16, 0.95) 0%,
    rgba(10, 10, 12, 0.98) 100%
  );
  border-top: 1px solid rgba(192, 57, 43, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(30px);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.012) 2px,
        rgba(255, 255, 255, 0.012) 4px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.012) 2px,
        rgba(255, 255, 255, 0.012) 4px
      );
    pointer-events: none;
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`;

/* Drag handle at top of panel */
const DragHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  margin: 8px auto 0;
  flex-shrink: 0;
`;

/* Section label + title header — always visible */
const PanelHeader = styled.div`
  padding: 12px 20px 8px;
  flex-shrink: 0;
`;

const SectionLabel = styled.div`
  font-family: "Rajdhani", sans-serif;
  font-size: 0.6rem;
  color: #c0392b;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  margin-bottom: 2px;
`;

const Title = styled.h2`
  font-family: "Orbitron", sans-serif;
  font-size: 1.05rem;
  color: #ffffff;
  letter-spacing: 0.08em;
  margin: 0;
`;

const FlagDivider = styled.div`
  width: 36px;
  height: 2px;
  border-radius: 1px;
  margin-top: 6px;
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

/* Horizontal swipe area */
const SwipeArea = styled.div`
  flex: 1;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

/* Each swipe page takes full width */
const SwipePage = styled.div`
  min-width: 100%;
  max-width: 100%;
  scroll-snap-align: start;
  padding: 12px 20px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  /* Hide scrollbar for vertical scroll within page */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

/* Dot indicators for swipe pages */
const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 6px 0 10px;
  flex-shrink: 0;
`;

const Dot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) =>
    p.$active
      ? "rgba(192, 57, 43, 0.9)"
      : "rgba(255, 255, 255, 0.15)"};
  transition: background 0.3s ease;
`;

/**
 * MobilePanel — reusable wrapper for all mobile sections.
 *
 * @param {string}    label     - e.g. "Dynamics"
 * @param {string}    title     - e.g. "Suspension & Chassis"
 * @param {ReactNode} action    - Primary page (button, interactive element)
 * @param {ReactNode} details   - Secondary page (specs, text)
 * @param {ReactNode} extra     - Optional third page
 */
export default function MobilePanel({
  id,
  label,
  title,
  action,
  details,
  extra,
  onEnterAction,
  onLeaveAction,
}) {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const swipeRef = useRef(null);
  const [activePage, setActivePage] = useState(0);

  const pages = [action, details, extra].filter(Boolean);

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
            duration: 0.6,
            ease: "power3.out",
          });
          if (onEnterAction) onEnterAction();
        },
        onLeave: () => {
          gsap.to(panel, {
            opacity: 0,
            y: 30,
            duration: 0.4,
          });
          if (onLeaveAction) onLeaveAction();
        },
        onEnterBack: () => {
          gsap.to(panel, {
            opacity: 1,
            y: 0,
            duration: 0.4,
          });
          if (onEnterAction) onEnterAction();
        },
        onLeaveBack: () => {
          gsap.to(panel, {
            opacity: 0,
            y: 30,
            duration: 0.4,
          });
          if (onLeaveAction) onLeaveAction();
        },
      });
    });

    return () => ctx.revert();
  }, []);

  // Track which swipe page is active
  useEffect(() => {
    const swipe = swipeRef.current;
    if (!swipe) return;

    const handleScroll = () => {
      const index = Math.round(
        swipe.scrollLeft / swipe.clientWidth,
      );
      setActivePage(index);
    };

    swipe.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () => swipe.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Section ref={sectionRef} id={id}>
      <CarViewport />

      <PanelContainer ref={panelRef}>
        <DragHandle />

        <PanelHeader>
          <SectionLabel>{label}</SectionLabel>
          <Title>{title}</Title>
          <FlagDivider />
        </PanelHeader>

        <SwipeArea ref={swipeRef}>
          {pages.map((page, i) => (
            <SwipePage key={i}>{page}</SwipePage>
          ))}
        </SwipeArea>

        {pages.length > 1 && (
          <DotsContainer>
            {pages.map((_, i) => (
              <Dot key={i} $active={i === activePage} />
            ))}
          </DotsContainer>
        )}
      </PanelContainer>
    </Section>
  );
}