import { useEffect, useRef } from 'react';

const RPM_SOUNDS = [
  { url: '/sounds/IdleGiula.wav', rpmBase: 1000, maxVolRpm: 1000 },
  { url: '/sounds/giulia (2 do 2 i 5).wav', rpmBase: 2000, maxVolRpm: 2500 },
  { url: '/sounds/giulia (2 i 5 do 3).wav', rpmBase: 2500, maxVolRpm: 3000 },
  { url: '/sounds/giulia (3 do 3 i 5).wav', rpmBase: 3000, maxVolRpm: 3500 },
  { url: '/sounds/giulia (3 i 5 do 4).wav', rpmBase: 3500, maxVolRpm: 4000 },
  { url: '/sounds/giulia (4 do 4 i 5).wav', rpmBase: 4000, maxVolRpm: 4500 },
  { url: '/sounds/giulia(4 i 5 do 5)].wav', rpmBase: 4500, maxVolRpm: 5000 },
  { url: '/sounds/giulia (5 do 5 i pol).wav', rpmBase: 5000, maxVolRpm: 5500 },
  { url: '/sounds/giulia (5j 5 do 6).wav', rpmBase: 5500, maxVolRpm: 6000 },
  { url: '/sounds/giulia (6 do 6 i pol).wav', rpmBase: 6000, maxVolRpm: 6500 },
  { url: '/sounds/giulia (6 i pol do 7).wav', rpmBase: 6500, maxVolRpm: 7000 },
];

export default function EngineSoundSystem({ engineOn, carPositionRef }) {
  const audioContextRef = useRef(null);
  const sourcesRef = useRef([]);
  const gainNodesRef = useRef([]);
  const buffersRef = useRef([]);
  const isLoadedRef = useRef(false);
  const startupAudioRef = useRef(null);
  const prevEngineOnRef = useRef(false);
  const animationFrameRef = useRef(null);
  const isLoopingRef = useRef(false);
  const masterGainNodeRef = useRef(null);
  const hasTerminatedStartupRef = useRef(false);
  const startupFadeIntervalRef = useRef(null);

  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioContextRef.current = new AudioContext();

    const loadSounds = async () => {
      try {
        const promises = RPM_SOUNDS.map(async (sound, index) => {
          const response = await fetch(sound.url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          buffersRef.current[index] = audioBuffer;
        });

        await Promise.all(promises);
        isLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to load engine sounds", err);
      }
    };

    loadSounds();

    startupAudioRef.current = new Audio('/sounds/EngineStart.wav');
    startupAudioRef.current.volume = 0.6;

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => { });
      }
      if (startupAudioRef.current) {
        startupAudioRef.current.pause();
        startupAudioRef.current = null;
      }
    };
  }, []);

  const startLoopingSounds = () => {
    if (!isLoadedRef.current || !audioContextRef.current) return;
    if (isLoopingRef.current) return; // Prevent multiple starts

    isLoopingRef.current = true;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Reset arrays
    sourcesRef.current = [];
    gainNodesRef.current = [];

    if (!masterGainNodeRef.current) {
      masterGainNodeRef.current = audioContextRef.current.createGain();
      masterGainNodeRef.current.connect(audioContextRef.current.destination);
    }
    // Start silent, updateLoop will fade it in when ready
    masterGainNodeRef.current.gain.value = 0;
    hasTerminatedStartupRef.current = false;

    buffersRef.current.forEach((buffer, index) => {
      if (!buffer) return;

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0;

      const biquadFilter = audioContextRef.current.createBiquadFilter();
      biquadFilter.type = "lowpass";
      biquadFilter.frequency.value = 16000;

      source.connect(biquadFilter);
      biquadFilter.connect(gainNode);
      gainNode.connect(masterGainNodeRef.current);

      source.start();

      sourcesRef.current[index] = source;
      gainNodesRef.current[index] = gainNode;
    });

    // Let's create an artificial gear calculation for more realistic revving
    let currentSpeed = 0;

    // Store current smoothed RPM to avoid jerky audio when physics spikes
    let smoothedRpm = 1000;

    // Helper for crossfading dynamically based on array neighbors
    const calculateVolume = (i, targetRpm) => {
      const currentSound = RPM_SOUNDS[i];
      const nextSound = RPM_SOUNDS[i + 1];
      const prevSound = RPM_SOUNDS[i - 1];

      // If we are at the highest sound and RPM exceeds it, keep volume 1
      if (!nextSound && targetRpm >= currentSound.maxVolRpm) {
         return 1;
      }

      // If it's the very first sound and we are below it
      if (!prevSound && targetRpm <= currentSound.maxVolRpm) {
         return 1;
      }

      // If we are fading IN towards the current sound peak
      if (prevSound && targetRpm > prevSound.maxVolRpm && targetRpm <= currentSound.maxVolRpm) {
         return (targetRpm - prevSound.maxVolRpm) / (currentSound.maxVolRpm - prevSound.maxVolRpm);
      }

      // If we are fading OUT away from the current sound peak
      if (nextSound && targetRpm > currentSound.maxVolRpm && targetRpm <= nextSound.maxVolRpm) {
         return 1 - (targetRpm - currentSound.maxVolRpm) / (nextSound.maxVolRpm - currentSound.maxVolRpm);
      }
      
      return 0;
    };

    const updateLoop = () => {
      if (!prevEngineOnRef.current) return;

      const targetSpeed = Math.abs(carPositionRef?.current?.speed || 0);

      // Smooth termination logic for startup sound
      if (startupAudioRef.current && !hasTerminatedStartupRef.current) {
        const duration = startupAudioRef.current.duration || 4;
        const current = startupAudioRef.current.currentTime;

        const isDrivingEarly = targetSpeed > 0.5;
        const isFinishing = duration > 0 && (duration - current < 1.0);

        if (isDrivingEarly || isFinishing) {
          hasTerminatedStartupRef.current = true;

          // Fade IN RPM sounds globally
          if (masterGainNodeRef.current && audioContextRef.current.state === 'running') {
            masterGainNodeRef.current.gain.setTargetAtTime(1.0, audioContextRef.current.currentTime, 0.4);
          }

          // Fade OUT startup sound
          clearInterval(startupFadeIntervalRef.current);
          startupFadeIntervalRef.current = setInterval(() => {
            if (startupAudioRef.current && startupAudioRef.current.volume > 0.05) {
              startupAudioRef.current.volume -= 0.05;
            } else {
              if (startupAudioRef.current) {
                startupAudioRef.current.pause();
              }
              clearInterval(startupFadeIntervalRef.current);
            }
          }, 50);
        }
      }

      // Interpolate speed a bit for smoother revs
      currentSpeed += (targetSpeed - currentSpeed) * 0.1;

      // Realistic gear simulation
      // Let's assume max speed is 66. We can have 6 virtual gears.
      const gears = [
        { maxSpeed: 12, minRpm: 1000, maxRpm: 5000 },
        { maxSpeed: 24, minRpm: 3200, maxRpm: 5800 },
        { maxSpeed: 36, minRpm: 4200, maxRpm: 6600 },
        { maxSpeed: 48, minRpm: 5200, maxRpm: 7400 },
        { maxSpeed: 60, minRpm: 6500, maxRpm: 8200 },
        { maxSpeed: 80, minRpm: 7200, maxRpm: 9000 }
      ];

      let currentGearIdx = 0;
      for (let i = 0; i < gears.length; i++) {
        if (currentSpeed <= gears[i].maxSpeed) {
          currentGearIdx = i;
          break;
        }
      }
      if (currentSpeed > gears[gears.length - 1].maxSpeed) {
        currentGearIdx = gears.length - 1;
      }

      const gear = gears[currentGearIdx];

      // Speed within gear
      const speedInGear = currentGearIdx === 0
        ? currentSpeed
        : currentSpeed - gears[currentGearIdx - 1].maxSpeed;

      const gearRange = currentGearIdx === 0
        ? gear.maxSpeed
        : gear.maxSpeed - gears[currentGearIdx - 1].maxSpeed;

      const speedRatio = Math.max(0, Math.min(1, speedInGear / gearRange));

      // If we are decelerating, RPM drops slightly under the theoretical curve (engine braking)
      const isAccelerating = targetSpeed > currentSpeed + 0.1;

      let rawRpm = gear.minRpm + (speedRatio * (gear.maxRpm - gear.minRpm));

      // Add a tiny bit of random variation to RPM so it's not perfectly static
      const rpmJitter = (Math.random() - 0.5) * 50;

      // Smooth the RPM
      smoothedRpm += (rawRpm - smoothedRpm) * 0.15;

      const targetRpmComplete = Math.min(Math.max(smoothedRpm + rpmJitter, 1000), 10000);

      sourcesRef.current.forEach((source, i) => {
        if (!source || !gainNodesRef.current[i]) return;

        const soundDef = RPM_SOUNDS[i];
        const volume = calculateVolume(i, targetRpmComplete);

        // Slightly exaggerate pitch to make acceleration feel more powerful
        let pitch = targetRpmComplete / soundDef.rpmBase;
        if (isAccelerating) {
          pitch *= 1.02; // +2% pitch on throttle
        }

        // Apply
        gainNodesRef.current[i].gain.setTargetAtTime(volume * 0.55, audioContextRef.current.currentTime, 0.05);
        source.playbackRate.setTargetAtTime(pitch, audioContextRef.current.currentTime, 0.05);
      });

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    updateLoop();
  };

  const stopLoopingSounds = () => {
    isLoopingRef.current = false;
    cancelAnimationFrame(animationFrameRef.current);

    // Smooth fade out
    if (audioContextRef.current && masterGainNodeRef.current) {
      const currTime = audioContextRef.current.currentTime;
      masterGainNodeRef.current.gain.setTargetAtTime(0, currTime, 0.2);
    }

    // Delay the stop slightly so fade out completes
    setTimeout(() => {
      sourcesRef.current.forEach(source => {
        if (source) {
          try { source.stop(); } catch (e) { }
          try { source.disconnect(); } catch (e) { }
        }
      });
      gainNodesRef.current.forEach(gain => {
        if (gain) {
          try { gain.disconnect(); } catch (e) { }
        }
      });
      sourcesRef.current = [];
      gainNodesRef.current = [];
    }, 500);
  };

  useEffect(() => {
    const wasOn = prevEngineOnRef.current;
    const isOn = engineOn;
    prevEngineOnRef.current = engineOn;

    if (isOn && !wasOn) {
      if (startupAudioRef.current) {
        startupAudioRef.current.currentTime = 0;
        startupAudioRef.current.volume = 0.6; // Reset volume just in case it was faded out
        const playPromise = startupAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => { });
        }
      }

      // Start the loops immediately taking advantage of masterGain starting at 0
      startLoopingSounds();
    }

    if (!isOn && wasOn) {
      clearInterval(startupFadeIntervalRef.current);
      if (startupAudioRef.current) {
        startupAudioRef.current.pause();
      }
      stopLoopingSounds();
    }
  }, [engineOn, carPositionRef]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopLoopingSounds();
    };
  }, []);

  return null;
}
