import { useRef, useEffect, useState, Suspense, memo } from "react";
import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  useProgress,
  Environment,
  OrbitControls,
  Stats,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { damp3 } from 'maath/easing';
import styled from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

import CarModel from "./Scene/CarModel";
import Lighting from "./Scene/Lighting";
import Floor from "./Scene/Floor";
import CameraController from "./Scene/CameraController";
import RacetrackScene from "./Scene/RacetrackScene";
import LoadingScreen from "./Layout/LoadingScreen";
import Navbar from "./Layout/Navbar";

import useIsMobile from "../hooks/useIsMobile";

// Desktop sections
import HeroSection from "./Sections/HeroSection";
import EngineSection from "./Sections/EngineSection";
import SuspensionSection from "./Sections/SuspensionSection";
import WheelsSection from "./Sections/WheelsSection";
import InteriorSection from "./Sections/InteriorSection";
import EngineBaySection from "./Sections/EngineBaySection";
import GallerySection from "./Sections/GallerySection";
import FreeRoamSection from "./Sections/FreeRoamSection";
import ContactSection from "./Sections/ContactSection";
import FooterSection from "./Sections/FooterSection";

// Mobile sections
import MobileHeroSection from "./SectionsMobile/MobileHeroSection";
import MobileEngineSection from "./SectionsMobile/MobileEngineSection";
import MobileSuspensionSection from "./SectionsMobile/MobileSuspensionSection";
import MobileWheelsSection from "./SectionsMobile/MobileWheelsSection";
import MobileInteriorSection from "./SectionsMobile/MobileInteriorSection";
import MobileEngineBaySection from "./SectionsMobile/MobileEngineBaySection";
import MobileGallerySection from "./SectionsMobile/MobileGallerySection";
import MobileFreeRoamSection from "./SectionsMobile/MobileFreeRoamSection";
import MobileContactSection from "./SectionsMobile/MobileContactSection";
import MobileFooterSection from "./SectionsMobile/MobileFooterSection";

gsap.registerPlugin(ScrollTrigger);

/**
 * FreeRoamCamera - Handles camera in free roam mode
 */
function FreeRoamCamera({ carPositionRef, driveDirectionRef }) {
  const { camera } = useThree();
  const orbitRef = useRef();
  const smoothedPosition = useRef(new THREE.Vector3());
  const smoothedTarget = useRef(new THREE.Vector3());
  const wasDrivingRef = useRef(false);

  useEffect(() => {
    if (carPositionRef?.current) {
      smoothedTarget.current.set(
        carPositionRef.current.x,
        0.3,
        carPositionRef.current.z
      );
    }
  }, [carPositionRef]);

  useFrame((state, delta) => {
    if (!carPositionRef?.current) return;

    const car = carPositionRef.current;
    const dir = driveDirectionRef?.current || {
      throttle: null,
      steering: null,
    };
    const hasInput = dir.throttle || dir.steering;
    const carSpeed = Math.abs(car.speed || 0);

    const speedThreshold = 0.3;
    const isDriving = hasInput || carSpeed > speedThreshold;

    if (orbitRef.current) {
      orbitRef.current.enabled = !isDriving;
    }

    if (isDriving) {
      const followDistance = 9;
      const followHeight = 2.2;
      const lookAheadDistance = 5;

      const speedRatio = THREE.MathUtils.clamp(
        carSpeed / 15,
        0,
        1
      );
      const baseSmoothTime = 0.4;
      const fastSmoothTime = 0.15;
      const smoothTime = THREE.MathUtils.lerp(
        baseSmoothTime,
        fastSmoothTime,
        speedRatio
      );

      const behindX =
        car.x - Math.sin(car.rotation) * followDistance;
      const behindZ =
        car.z - Math.cos(car.rotation) * followDistance;

      const steerInput =
        dir.steering === "left"
          ? 0.1
          : dir.steering === "right"
            ? -0.1
            : 0;
      const lookRot = car.rotation + steerInput * 0.1;

      const aheadX =
        car.x + Math.sin(lookRot) * lookAheadDistance;
      const aheadZ =
        car.z + Math.cos(lookRot) * lookAheadDistance;

      const targetCamPos = new THREE.Vector3(
        behindX,
        followHeight,
        behindZ
      );
      const targetLookAt = new THREE.Vector3(
        aheadX,
        0.3,
        aheadZ
      );

      if (!wasDrivingRef.current) {
        smoothedPosition.current.copy(camera.position);
        if (orbitRef.current) {
          smoothedTarget.current.copy(orbitRef.current.target);
        }
      }

      damp3(smoothedPosition.current, targetCamPos, smoothTime, delta);
      damp3(smoothedTarget.current, targetLookAt, smoothTime, delta);

      camera.position.copy(smoothedPosition.current);
      camera.lookAt(smoothedTarget.current);
    } else {
      const targetCenter = new THREE.Vector3(
        car.x,
        0.3,
        car.z
      );

      damp3(smoothedTarget.current, targetCenter, 0.35, delta);

      if (orbitRef.current) {
        orbitRef.current.target.copy(smoothedTarget.current);
        orbitRef.current.update();
      }

      smoothedPosition.current.copy(camera.position);
    }

    wasDrivingRef.current = !!isDriving;
  });

  return (
    <OrbitControls
      ref={orbitRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={3}
      maxDistance={15}
      minPolarAngle={Math.PI * 0.05}
      maxPolarAngle={Math.PI * 0.52}
      enableDamping={true}
      dampingFactor={0.95}
    />
  );
}

const Container = styled.div`
  position: relative;
  width: 100%;
  background: #0a0a0a;
`;

const CanvasContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: ${(props) => (props.$freeRoamActive ? 10 : 1)};
  pointer-events: ${(props) =>
    props.$freeRoamActive ? "auto" : "none"};
`;

const SectionsContainer = styled.div`
  position: relative;
  z-index: 2;
  pointer-events: none;

  & > section {
    pointer-events: auto;
  }
`;

const CAR_POSITION = [0, -0.8, 0];
const CAR_ROTATION = Math.PI * 0.05;

function Scene({
  scrollProgressRef,
  dnaMode,
  carColor,
  headlightsOn,
  freeRoamActive,
  hoodOpen,
  driveDirectionRef,
}) {
  const carPositionRef = useRef({
    x: 0,
    y: -0.8,
    z: 0,
    rotation: 0,
  });

  return (
    <>
      <Environment
        files="/textures/HdrSkyEvening006_HDR_4K.hdr"
        background={true}
        blur={0}
        environmentIntensity={0.9}
      />
      <Lighting />
      <Floor />

      <CameraController
        scrollProgressRef={scrollProgressRef}
        freeRoamActive={freeRoamActive}
      />

      <CarModel
        carPosition={CAR_POSITION}
        carRotation={CAR_ROTATION}
        carColor={carColor}
        headlightsOn={headlightsOn}
        freeRoamActive={freeRoamActive}
        hoodOpen={hoodOpen}
        driveDirectionRef={driveDirectionRef}
        carPositionRef={carPositionRef}
      />

      {freeRoamActive && (
        <FreeRoamCamera
          carPositionRef={carPositionRef}
          driveDirectionRef={driveDirectionRef}
        />
      )}

      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom
          luminanceThreshold={0.9}
          luminanceSmoothing={0.4}
          intensity={0.9}
          radius={0.2}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
        <Noise premultiply opacity={0.2} />
      </EffectComposer>
    </>
  );
}

export default function ScrollExperience() {
  const containerRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const { progress } = useProgress();
  const [isLoaded, setIsLoaded] = useState(false);
  const [dnaMode, setDnaMode] = useState("dynamic");
  const [carColor, setCarColor] = useState(null);
  const [headlightsOn, setHeadlightsOn] = useState(false);
  const [engineOn, setEngineOn] = useState(false);
  const [freeRoamActive, setFreeRoamActive] = useState(false);
  const [showRacetrack, setShowRacetrack] = useState(false);
  const [hoodOpen, setHoodOpen] = useState(false);

  const driveDirectionRef = useRef({
    throttle: null,
    steering: null,
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    if (progress >= 100 && !isLoaded) {
      const timer = setTimeout(() => setIsLoaded(true), 500);
      return () => clearTimeout(timer);
    }
  }, [progress, isLoaded]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const handleModeChange = (mode) => {
    setDnaMode(mode.id);
  };

  const handleColorChange = (color) => {
    setCarColor(color);
  };

  const handleEngineStart = () => {
    setHeadlightsOn((prev) => !prev);
  };

  const handleFreeRoamEnter = () => {
    setFreeRoamActive(true);
  };

  const handleFreeRoamLeave = () => {
    setFreeRoamActive(false);
  };

  const handleToggleRacetrack = () => {
    setShowRacetrack((prev) => {
      const isEntering = !prev;
      if (isEntering) {
        document.body.style.overflow = "hidden";
        setIsLoaded(false);
        setEngineOn(true);
      } else {
        document.body.style.overflow = "";
      }
      return isEntering;
    });
  };

  const handleHoodToggle = (open) => {
    setHoodOpen(open);
  };

  const handleToggleLights = () => {
    setHeadlightsOn((prev) => !prev);
  };

  const handleToggleEngine = () => {
    setEngineOn((prev) => !prev);
  };

  const handleDrive = (type, direction, isActive) => {
    if (!engineOn) return;

    if (type === "combined") {
      driveDirectionRef.current = direction;
    } else {
      driveDirectionRef.current = {
        ...driveDirectionRef.current,
        [type]: isActive ? direction : null,
      };
    }
  };

  return (
    <>
      <LoadingScreen progress={progress} isLoaded={isLoaded} />

      <Container ref={containerRef}>
        <Navbar
          onTakeToRacetrack={handleToggleRacetrack}
          inRacetrack={showRacetrack}
        />

        <CanvasContainer
          $freeRoamActive={freeRoamActive || showRacetrack}
        >
          <Canvas
            camera={{ position: [0, 1, 8], fov: 45 }}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.0,
            }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.0;
              gl.physicallyCorrectLights = true;
            }}
            shadows={{ type: THREE.PCFShadowMap }}
            frameloop="always"
          >
            <fog attach="fog" args={["#201c18", 40, 400]} />

            <Suspense fallback={null}>
              {showRacetrack ? (
                <RacetrackScene
                  carColor={carColor}
                  headlightsOn={headlightsOn}
                  driveDirectionRef={driveDirectionRef}
                />
              ) : (
                <Scene
                  scrollProgressRef={scrollProgressRef}
                  dnaMode={dnaMode}
                  carColor={carColor}
                  headlightsOn={headlightsOn}
                  freeRoamActive={freeRoamActive}
                  hoodOpen={hoodOpen}
                  driveDirectionRef={driveDirectionRef}
                />
              )}
            </Suspense>
            <Stats showPanel={0} className="stats-panel" />
          </Canvas>
        </CanvasContainer>

        <SectionsContainer
          style={{
            display: showRacetrack ? "none" : "block",
          }}
        >
          {isMobile ? (
            <>
              <MobileHeroSection id="hero" />
              <MobileEngineSection
                id="engine"
                scrollProgressRef={scrollProgressRef}
                onEngineStart={handleEngineStart}
                headlightsOn={headlightsOn}
              />
              <MobileSuspensionSection
                id="suspension"
                onModeChange={handleModeChange}
              />
              <MobileWheelsSection id="wheels" />
              <MobileInteriorSection id="interior" />
              <MobileEngineBaySection
                id="enginebay"
                onHoodToggle={handleHoodToggle}
                hoodOpen={hoodOpen}
              />
              <MobileGallerySection
                id="gallery"
                onColorChange={handleColorChange}
              />

              <MobileContactSection id="contact" />
              <MobileFooterSection id="footer" />
              <MobileFreeRoamSection
                id="freeroam"
                onFreeRoamEnter={handleFreeRoamEnter}
                onFreeRoamLeave={handleFreeRoamLeave}
                headlightsOn={headlightsOn}
                engineOn={engineOn}
                onToggleLights={handleToggleLights}
                onToggleEngine={handleToggleEngine}
                onDrive={handleDrive}
              />
            </>
          ) : (
            <>
              <HeroSection id="hero" />
              <EngineSection
                id="engine"
                scrollProgressRef={scrollProgressRef}
                onEngineStart={handleEngineStart}
                headlightsOn={headlightsOn}
              />
              <SuspensionSection
                id="suspension"
                onModeChange={handleModeChange}
              />
              <WheelsSection id="wheels" />
              <InteriorSection id="interior" />
              <EngineBaySection
                id="enginebay"
                onHoodToggle={handleHoodToggle}
                hoodOpen={hoodOpen}
              />
              <GallerySection
                id="gallery"
                onColorChange={handleColorChange}
              />
              <ContactSection id="contact" />
              <FooterSection id="footer" />
              <FreeRoamSection
                id="freeroam"
                onFreeRoamEnter={handleFreeRoamEnter}
                onFreeRoamLeave={handleFreeRoamLeave}
                headlightsOn={headlightsOn}
                engineOn={engineOn}
                onToggleLights={handleToggleLights}
                onToggleEngine={handleToggleEngine}
                onDrive={handleDrive}
              />
            </>
          )}
        </SectionsContainer>

        {showRacetrack && isLoaded && (
          isMobile ? (
            <MobileFreeRoamSection
              id="racetrack-controls"
              headlightsOn={headlightsOn}
              engineOn={engineOn}
              onToggleLights={handleToggleLights}
              onToggleEngine={handleToggleEngine}
              onDrive={handleDrive}
              onFreeRoamEnter={() => { }}
              onFreeRoamLeave={() => { }}
              forceActive={true}
            />
          ) : (
            <FreeRoamSection
              id="racetrack-controls"
              headlightsOn={headlightsOn}
              engineOn={engineOn}
              onToggleLights={handleToggleLights}
              onToggleEngine={handleToggleEngine}
              onDrive={handleDrive}
              onFreeRoamEnter={() => { }}
              onFreeRoamLeave={() => { }}
              forceActive={true}
            />
          )
        )}
      </Container>
    </>
  );
}