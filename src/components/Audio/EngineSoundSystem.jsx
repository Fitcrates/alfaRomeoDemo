import { useEffect, useRef } from 'react';

// KEY FIX: rpmBase must be the actual RPM the sample was recorded at.
// recordedRpm = the exact RPM when the mic was held to the engine.
// crossfadeIn / crossfadeOut define when this sample fades in and out.
const RPM_SOUNDS = [
  { url: '/sounds/IdleGiula.wav', recordedRpm: 950, crossfadeIn: 700, crossfadeOut: 1400 },
  { url: '/sounds/giulia (2 do 2 i 5).wav', recordedRpm: 2000, crossfadeIn: 1400, crossfadeOut: 2700 },
  { url: '/sounds/giulia (2 i 5 do 3).wav', recordedRpm: 2700, crossfadeIn: 2200, crossfadeOut: 3200 },
  { url: '/sounds/giulia (3 do 3 i 5).wav', recordedRpm: 3200, crossfadeIn: 2800, crossfadeOut: 3700 },
  { url: '/sounds/giulia (3 i 5 do 4).wav', recordedRpm: 3700, crossfadeIn: 3300, crossfadeOut: 4200 },
  { url: '/sounds/giulia (4 do 4 i 5).wav', recordedRpm: 4200, crossfadeIn: 3800, crossfadeOut: 4700 },
  { url: '/sounds/giulia(4 i 5 do 5)].wav', recordedRpm: 4700, crossfadeIn: 4300, crossfadeOut: 5200 },
  { url: '/sounds/giulia (5 do 5 i pol).wav', recordedRpm: 5200, crossfadeIn: 4800, crossfadeOut: 5700 },
  { url: '/sounds/giulia (5j 5 do 6).wav', recordedRpm: 5700, crossfadeIn: 5300, crossfadeOut: 6200 },
  { url: '/sounds/giulia (6 do 6 i pol).wav', recordedRpm: 6200, crossfadeIn: 5800, crossfadeOut: 6700 },
  { url: '/sounds/giulia (6 i pol do 7).wav', recordedRpm: 6700, crossfadeIn: 6300, crossfadeOut: 9000 },
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
  const driftAudioRef = useRef(null);

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

    driftAudioRef.current = new Audio('/sounds/giulia-drift-sound.wav');
    driftAudioRef.current.loop = true;
    driftAudioRef.current.volume = 0;

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => { });
      }
      if (startupAudioRef.current) {
        startupAudioRef.current.pause();
        startupAudioRef.current = null;
      }
      if (driftAudioRef.current) {
        driftAudioRef.current.pause();
        driftAudioRef.current = null;
      }
    };
  }, []);

  const startLoopingSounds = () => {
    if (!isLoadedRef.current || !audioContextRef.current) return;
    if (isLoopingRef.current) return;

    isLoopingRef.current = true;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    sourcesRef.current = [];
    gainNodesRef.current = [];

    if (!masterGainNodeRef.current) {
      masterGainNodeRef.current = audioContextRef.current.createGain();
      masterGainNodeRef.current.connect(audioContextRef.current.destination);
    }
    masterGainNodeRef.current.gain.value = 0;
    hasTerminatedStartupRef.current = false;

    buffersRef.current.forEach((buffer, index) => {
      if (!buffer) return;

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0;

      // Low-pass filter: cut harsh highs introduced by pitch-shifting up
      // When pitch > 1.0 the sample's harmonics shift up — filter compensates
      const biquadFilter = audioContextRef.current.createBiquadFilter();
      biquadFilter.type = "lowpass";
      biquadFilter.frequency.value = 5500; // Tighter cutoff — Giulia is a bassy growler
      biquadFilter.Q.value = 0.7;

      source.connect(biquadFilter);
      biquadFilter.connect(gainNode);
      gainNode.connect(masterGainNodeRef.current);
      source.start();

      sourcesRef.current[index] = source;
      gainNodesRef.current[index] = gainNode;
    });

    let currentSpeed = 0;
    let smoothedRpm = 950;

    // FIX: crossfade volume using the per-sample crossfadeIn/crossfadeOut thresholds.
    // Each sample is fully audible between its crossfadeIn and crossfadeOut.
    // It fades in over the 500 RPM below crossfadeIn (blending from previous sample),
    // and fades out over the 500 RPM above crossfadeOut (blending into next sample).
    const calculateVolume = (i, rpm) => {
      const s = RPM_SOUNDS[i];
      const BLEND = 400; // RPM overlap region for crossfade

      if (rpm < s.crossfadeIn - BLEND) return 0;
      if (rpm > s.crossfadeOut + BLEND) return 0;

      let vol = 1.0;

      // Fade in
      if (rpm < s.crossfadeIn) {
        vol = Math.min(vol, (rpm - (s.crossfadeIn - BLEND)) / BLEND);
      }

      // Fade out
      if (rpm > s.crossfadeOut) {
        vol = Math.min(vol, 1.0 - (rpm - s.crossfadeOut) / BLEND);
      }

      return Math.max(0, Math.min(1, vol));
    };

    const updateLoop = () => {
      if (!prevEngineOnRef.current) return;

      const targetSpeed = Math.abs(carPositionRef?.current?.speed || 0);
      const isDrifting = carPositionRef?.current?.isDrifting;
      const isBurnout = carPositionRef?.current?.isBurnout;
      const sidewaysSpeed = Math.abs(carPositionRef?.current?.sidewaysSpeed || 0);
      const isOversteering = carPositionRef?.current?.isOversteering;
      const isUndersteering = carPositionRef?.current?.isUndersteering;

      // Drift / burnout / oversteer / understeer sound modulation
      if (driftAudioRef.current && driftAudioRef.current.readyState >= 2) {
        let targetDriftVolume = 0;
        if (isBurnout) {
          targetDriftVolume = 0.85; // High intensity tire squeal during burnout
        } else if (isDrifting && sidewaysSpeed > 1) {
          targetDriftVolume = Math.min(1.0, sidewaysSpeed * 0.08); // volume scales with slide intensity
        } else if (isOversteering && targetSpeed > 5) {
          // Oversteer = rear tires losing grip, sliding out
          targetDriftVolume = Math.min(0.7, targetSpeed * 0.04);
        } else if (isUndersteering && targetSpeed > 5) {
          // Understeer = front tires losing grip, scrubbing
          targetDriftVolume = Math.min(0.5, targetSpeed * 0.03);
        }
        driftAudioRef.current.volume += (targetDriftVolume - driftAudioRef.current.volume) * 0.15;
      }

      // Startup transition logic (unchanged)
      if (startupAudioRef.current && !hasTerminatedStartupRef.current) {
        const duration = startupAudioRef.current.duration || 4;
        const current = startupAudioRef.current.currentTime;
        const isDrivingEarly = targetSpeed > 0.5;
        const isFinishing = duration > 0 && (duration - current < 1.0);

        if (isDrivingEarly || isFinishing) {
          hasTerminatedStartupRef.current = true;
          if (masterGainNodeRef.current && audioContextRef.current.state === 'running') {
            masterGainNodeRef.current.gain.setTargetAtTime(1.0, audioContextRef.current.currentTime, 0.4);
          }
          clearInterval(startupFadeIntervalRef.current);
          startupFadeIntervalRef.current = setInterval(() => {
            if (startupAudioRef.current && startupAudioRef.current.volume > 0.05) {
              startupAudioRef.current.volume -= 0.05;
            } else {
              if (startupAudioRef.current) startupAudioRef.current.pause();
              clearInterval(startupFadeIntervalRef.current);
            }
          }, 50);
        }
      }

      currentSpeed += (targetSpeed - currentSpeed) * 0.08; // Slightly slower smoothing = more inertia feel

      // During burnout, force RPM to redline by simulating high-speed gear
      const rpmSpeed = isBurnout ? 55 : currentSpeed;

      // FIX: Revised gear ratios keeping RPM in the realistic 1000–5500 band for street driving.
      // Real Giulia QV redlines at ~6800. Road driving rarely exceeds 4500.
      // Max speed of 66 units mapped to ~130km/h equivalent.
      const gears = [
        { maxSpeed: 8, minRpm: 950, maxRpm: 3800 },
        { maxSpeed: 16, minRpm: 1800, maxRpm: 4200 },
        { maxSpeed: 26, minRpm: 2200, maxRpm: 4800 },
        { maxSpeed: 38, minRpm: 2600, maxRpm: 5200 },
        { maxSpeed: 52, minRpm: 3000, maxRpm: 5600 },
        { maxSpeed: 80, minRpm: 3200, maxRpm: 6200 },
      ];

      let currentGearIdx = 0;
      for (let i = 0; i < gears.length; i++) {
        if (rpmSpeed <= gears[i].maxSpeed) { currentGearIdx = i; break; }
      }
      if (rpmSpeed > gears[gears.length - 1].maxSpeed) currentGearIdx = gears.length - 1;

      const gear = gears[currentGearIdx];
      const prevMaxSpeed = currentGearIdx === 0 ? 0 : gears[currentGearIdx - 1].maxSpeed;
      const speedInGear = rpmSpeed - prevMaxSpeed;
      const gearRange = gear.maxSpeed - prevMaxSpeed;
      const speedRatio = Math.max(0, Math.min(1, speedInGear / gearRange));

      // Use sqrt curve so RPM rises faster off the bottom of each gear (more realistic)
      const rawRpm = gear.minRpm + Math.sqrt(speedRatio) * (gear.maxRpm - gear.minRpm);

      // Very gentle jitter — real engine has minor oscillation
      const rpmJitter = (Math.random() - 0.5) * 30;

      // Smooth RPM — 0.08 factor = nice inertia, not too laggy
      smoothedRpm += (rawRpm - smoothedRpm) * 0.08;
      const finalRpm = Math.max(850, Math.min(smoothedRpm + rpmJitter, 8000));

      const isAccelerating = targetSpeed > currentSpeed + 0.2;
      const now = audioContextRef.current.currentTime;

      sourcesRef.current.forEach((source, i) => {
        if (!source || !gainNodesRef.current[i]) return;

        const soundDef = RPM_SOUNDS[i];
        const volume = calculateVolume(i, finalRpm);

        // FIX: pitch = finalRpm / recordedRpm
        // This means when we're exactly at the recorded RPM the sample plays 1:1 — no artificial shift.
        // Pitch only deviates slightly to cover the crossfade range.
        let pitch = finalRpm / soundDef.recordedRpm;

        // Clamp pitch tightly — never let a sample stretch more than ±30%
        // If RPM goes outside that range the crossfade logic should have already faded it out
        pitch = Math.max(0.75, Math.min(pitch, 1.3));

        // Subtle throttle breathiness — keep it very small
        if (isAccelerating) {
          pitch *= 1.008;
        }

        gainNodesRef.current[i].gain.setTargetAtTime(volume * 0.6, now, 0.04);
        source.playbackRate.setTargetAtTime(pitch, now, 0.06);
      });

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    updateLoop();
  };

  const stopLoopingSounds = () => {
    isLoopingRef.current = false;
    cancelAnimationFrame(animationFrameRef.current);

    if (audioContextRef.current && masterGainNodeRef.current) {
      masterGainNodeRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.2);
    }

    setTimeout(() => {
      sourcesRef.current.forEach(source => {
        if (source) {
          try { source.stop(); } catch (e) { }
          try { source.disconnect(); } catch (e) { }
        }
      });
      gainNodesRef.current.forEach(gain => {
        if (gain) { try { gain.disconnect(); } catch (e) { } }
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
        startupAudioRef.current.volume = 0.6;
        const playPromise = startupAudioRef.current.play();
        if (playPromise !== undefined) playPromise.catch(() => { });
      }
      if (driftAudioRef.current) {
        driftAudioRef.current.volume = 0;
        const playD = driftAudioRef.current.play();
        if (playD !== undefined) playD.catch(() => { });
      }
      startLoopingSounds();
    }

    if (!isOn && wasOn) {
      clearInterval(startupFadeIntervalRef.current);
      if (startupAudioRef.current) startupAudioRef.current.pause();
      if (driftAudioRef.current) driftAudioRef.current.pause();
      stopLoopingSounds();
    }
  }, [engineOn, carPositionRef]);

  useEffect(() => { return () => { stopLoopingSounds(); }; }, []);

  return null;
}