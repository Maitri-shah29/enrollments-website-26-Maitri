"use client";

import { Center, Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import helvetiker from "three/examples/fonts/helvetiker_bold.typeface.json";

function ACMLogo3D({ startTime }) {
  const ambientRef = useRef();
  const lightRef = useRef();
  const taglineLightRef = useRef();
  const welcomeLightRef = useRef();
  // Trail lights to keep letters illuminated after the sweep passes
  const trailLight1Ref = useRef();
  const trailLight2Ref = useRef();
  const trailLight3Ref = useRef();
  const trailLight4Ref = useRef();
  const groupRef = useRef();
  const shadowRef = useRef();
  const diamondMaterialRef = useRef();
  const acmMaterialRef = useRef();
  const taglineMaterialRef = useRef();
  const welcomeMaterialRef = useRef();

  // Animate the light revolving around the logo in x-y plane with constant speed
  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    // Use startTime to offset animation start
    const time = startTime ? (Date.now() - startTime) / 1000 : elapsedTime;
    const radius = 5;
    const hideStart = 6;
    const hideDuration = 1.5;
    const welcomeDelay = hideStart + hideDuration + 0.3;
    const welcomeFadeDuration = 1.5;
    const welcomeFadeOutDuration = 1.2;
    const sweepHold = 0.4;

    // Constant anti-clockwise rotation with constant speed
    const baseSpeed = 1;
    const angle = -time * baseSpeed;

    // Move light in circular path anti-clockwise - z stays at a fixed distance from logo
    lightRef.current.position.x = Math.sin(angle) * radius;
    lightRef.current.position.y = Math.cos(angle) * radius;
    lightRef.current.position.z = 4;

    // Smooth intensity transitions: 90% reveal for 80% time, 50% reveal for 20% time
    const normalizedAngle = angle % (Math.PI * 2);
    const normalizedCycleAngle =
      normalizedAngle < 0 ? Math.PI * 2 + normalizedAngle : normalizedAngle;
    const fullCycleAngle = Math.PI * 2;
    const dimPhaseEnd = fullCycleAngle * 0.2; // 20% of cycle is dim (50% visibility)

    const minIntensity = 200; // 50% visibility
    const maxIntensity = 350; // 90% visibility

    if (normalizedCycleAngle < dimPhaseEnd) {
      // First 20% - slowly fade out to 50% visibility
      const fadeProgress = normalizedCycleAngle / dimPhaseEnd;
      lightRef.current.intensity =
        maxIntensity - (maxIntensity - minIntensity) * fadeProgress;
    } else {
      // Remaining 80% - rapidly fade in and maintain 90% visibility
      const fadeProgress =
        (normalizedCycleAngle - dimPhaseEnd) / (fullCycleAngle - dimPhaseEnd);
      const easeIn = fadeProgress * fadeProgress * fadeProgress; // Cubic ease-in
      lightRef.current.intensity =
        minIntensity + (maxIntensity - minIntensity) * easeIn;
    }

    // Additional light for tagline to always be visible
    taglineLightRef.current.position.copy(lightRef.current.position);
    taglineLightRef.current.intensity = lightRef.current.intensity * 0.6;

    // Sweep a light across the welcome text from left to right
    const sweepPeriod = 5;
    const sweepRange = 8;

    // Fade everything out after 6 seconds
    const fadeElapsed = Math.max(0, time - hideStart);
    const fadeFactor =
      fadeElapsed === 0 ? 1 : Math.max(0, 1 - fadeElapsed / hideDuration);

    // Welcome timing windows
    const welcomeStart = welcomeDelay;
    const welcomeInEnd = welcomeStart + welcomeFadeDuration;
    const sweepStart = welcomeStart; // light moves into position as soon as welcome starts
    const sweepHoldEnd = sweepStart + sweepHold;
    const sweepEnd = sweepHoldEnd + sweepPeriod;
    const welcomeOutEnd = sweepEnd + welcomeFadeOutDuration;

    // Welcome fade in/out sequencing with smooth easing to avoid light popping
    const smoothStep = (t) => {
      const x = Math.min(Math.max(t, 0), 1);
      return x * x * (3 - 2 * x);
    };
    let welcomeFade = 0;
    if (time >= welcomeStart && time < welcomeInEnd) {
      const p = (time - welcomeStart) / welcomeFadeDuration;
      welcomeFade = smoothStep(p);
    } else if (time >= welcomeInEnd && time < sweepEnd) {
      welcomeFade = 1;
    } else if (time >= sweepEnd && time < welcomeOutEnd) {
      const p = (time - sweepEnd) / welcomeFadeOutDuration;
      welcomeFade = smoothStep(1 - p);
    } else {
      welcomeFade = 0;
    }

    // Sweep position only during active sweep window
    const west = -sweepRange / 2;
    const east = sweepRange / 2;

    if (time >= sweepStart && time < sweepEnd) {
      if (time < sweepHoldEnd) {
        // Move light to the west and hold briefly before sweeping
        welcomeLightRef.current.position.set(west, -0.2, 4);
      } else {
        const sweepProgress = (time - sweepHoldEnd) / sweepPeriod;
        const sweepX = THREE.MathUtils.lerp(west, east, sweepProgress);
        welcomeLightRef.current.position.set(sweepX, -0.2, 4);

        // Trail lights spread across the already-swept area to keep letters lit
        const sweptDistance = sweepX - west;
        if (trailLight1Ref.current && sweptDistance > 0) {
          trailLight1Ref.current.position.set(
            west + sweptDistance * 0.15,
            -0.2,
            3.5,
          );
          trailLight1Ref.current.intensity =
            60 * welcomeFade * smoothStep(sweepProgress);
        }
        if (trailLight2Ref.current && sweptDistance > 0) {
          trailLight2Ref.current.position.set(
            west + sweptDistance * 0.4,
            -0.2,
            3.5,
          );
          trailLight2Ref.current.intensity =
            60 * welcomeFade * smoothStep(sweepProgress);
        }
        if (trailLight3Ref.current && sweptDistance > 0) {
          trailLight3Ref.current.position.set(
            west + sweptDistance * 0.65,
            -0.2,
            3.5,
          );
          trailLight3Ref.current.intensity =
            60 * welcomeFade * smoothStep(sweepProgress * 0.9);
        }
        if (trailLight4Ref.current && sweptDistance > 0) {
          trailLight4Ref.current.position.set(
            west + sweptDistance * 0.85,
            -0.2,
            3.5,
          );
          trailLight4Ref.current.intensity =
            60 * welcomeFade * smoothStep(sweepProgress * 0.8);
        }
      }
    } else if (time >= sweepEnd && time < welcomeOutEnd) {
      // After sweep completes, keep trail lights on until fade out
      if (trailLight1Ref.current) {
        trailLight1Ref.current.position.set(
          west + (east - west) * 0.15,
          -0.2,
          3.5,
        );
        trailLight1Ref.current.intensity = 60 * welcomeFade;
      }
      if (trailLight2Ref.current) {
        trailLight2Ref.current.position.set(
          west + (east - west) * 0.4,
          -0.2,
          3.5,
        );
        trailLight2Ref.current.intensity = 60 * welcomeFade;
      }
      if (trailLight3Ref.current) {
        trailLight3Ref.current.position.set(
          west + (east - west) * 0.65,
          -0.2,
          3.5,
        );
        trailLight3Ref.current.intensity = 60 * welcomeFade;
      }
      if (trailLight4Ref.current) {
        trailLight4Ref.current.position.set(
          west + (east - west) * 0.85,
          -0.2,
          3.5,
        );
        trailLight4Ref.current.intensity = 60 * welcomeFade;
      }
    }
    const welcomeBaseIntensity = 120;

    // Apply fade to lights
    lightRef.current.intensity *= fadeFactor;
    taglineLightRef.current.intensity *= fadeFactor;
    welcomeLightRef.current.intensity = welcomeBaseIntensity * welcomeFade;
    if (ambientRef.current) {
      // Keep a tiny ambient floor once welcome appears
      const ambientBase = 0.05 * fadeFactor;
      const ambientWelcome = 0.03 * welcomeFade;
      ambientRef.current.intensity = ambientBase + ambientWelcome;
    }

    // Apply fade to materials
    const materials = [
      diamondMaterialRef.current,
      acmMaterialRef.current,
      taglineMaterialRef.current,
    ];

    // Quick fade-in for ACM and tagline at the very beginning (first 0.5s)
    const quickFadeInDuration = 0.5;
    let quickFadeIn = 1; // Start fully visible
    if (time < quickFadeInDuration) {
      quickFadeIn = time / quickFadeInDuration; // Fade in from 0 to 1
    }

    materials.forEach((material) => {
      if (material) material.opacity = fadeFactor * quickFadeIn;
    });

    // Welcome material fades in independently
    if (welcomeMaterialRef.current)
      welcomeMaterialRef.current.opacity = welcomeFade;
  });

  // Create rounded diamond shape using a custom shape
  const diamondShape = useMemo(() => {
    const shape = new THREE.Shape();
    const size = 2.5;
    const radius = 0.35; // Rounded corner radius

    // Create diamond path with all corners rounded
    // Start just after top corner and go clockwise
    shape.moveTo(radius, size - radius);
    shape.quadraticCurveTo(0, size, -radius, size - radius);

    // Top to left
    shape.lineTo(-size + radius, radius);
    shape.quadraticCurveTo(-size, 0, -size + radius, -radius);

    // Left to bottom
    shape.lineTo(-radius, -size + radius);
    shape.quadraticCurveTo(0, -size, radius, -size + radius);

    // Bottom to right
    shape.lineTo(size - radius, -radius);
    shape.quadraticCurveTo(size, 0, size - radius, radius);

    // Right to top
    shape.lineTo(radius, size - radius);

    return shape;
  }, []);

  return (
    <>
      {/* Very minimal ambient light - almost no base illumination */}
      <ambientLight ref={ambientRef} intensity={0.05} />

      {/* Revolving point light with varying intensity */}
      <pointLight
        ref={lightRef}
        intensity={80}
        distance={12}
        decay={2}
        color="#ffffff"
      />

      {/* Additional light for tagline to always be visible */}
      <pointLight
        ref={taglineLightRef}
        intensity={100}
        distance={12}
        decay={2}
        color="#ffffff"
      />

      {/* Sweeping light for the welcome text */}
      <pointLight
        ref={welcomeLightRef}
        intensity={0}
        distance={15}
        decay={2}
        color="#ffffff"
      />

      {/* Trail lights - keep letters illuminated after the sweep passes */}
      <pointLight
        ref={trailLight1Ref}
        intensity={0}
        distance={12}
        decay={2}
        color="#ffffff"
      />
      <pointLight
        ref={trailLight2Ref}
        intensity={0}
        distance={12}
        decay={2}
        color="#ffffff"
      />
      <pointLight
        ref={trailLight3Ref}
        intensity={0}
        distance={12}
        decay={2}
        color="#ffffff"
      />
      <pointLight
        ref={trailLight4Ref}
        intensity={0}
        distance={12}
        decay={2}
        color="#ffffff"
      />

      {/* Logo group - FIXED, no rotation */}
      <group ref={groupRef}>
        {/* Diamond/rhombus shape background with rounded corners */}
        <mesh position={[0, 0, -0.5]}>
          <extrudeGeometry
            args={[
              diamondShape,
              {
                depth: 0.4,
                bevelEnabled: true,
                bevelThickness: 0.1,
                bevelSize: 0.1,
                bevelSegments: 16,
              },
            ]}
          />
          <meshStandardMaterial
            ref={diamondMaterialRef}
            color="#e8e8e8"
            metalness={0.95}
            roughness={0.12}
            envMapIntensity={0} // No environment reflections
            transparent
            opacity={1}
          />
        </mesh>

        {/* ACM Text */}
        <Center position={[0, 0, -0.1]}>
          <Text3D
            font={helvetiker}
            size={1}
            height={0.19}
            curveSegments={20}
            bevelEnabled={true}
            bevelThickness={0.02}
            bevelSize={0.02}
            bevelOffset={0}
            bevelSegments={12}
          >
            acm
            <meshStandardMaterial
              ref={acmMaterialRef}
              color="#2a2a2a"
              metalness={0.98}
              roughness={0.08}
              envMapIntensity={0}
              transparent
              opacity={1}
            />
          </Text3D>
        </Center>

        {/* Tagline Text - in a plane, centered horizontally - 2D metallic text */}
        <group position={[0, -3.0, 0]}>
          <Center>
            <Text3D
              font={helvetiker}
              size={0.32}
              height={0.01}
              curveSegments={20}
              bevelEnabled={false}
            >
              Because Technology matters
              <meshStandardMaterial
                ref={taglineMaterialRef}
                color="#ffffff"
                metalness={0.95}
                roughness={0.1}
                envMapIntensity={0}
                transparent
                opacity={1}
              />
            </Text3D>
          </Center>
        </group>

        {/* Welcome text with metallic finish */}
        <group position={[0, -0.2, 0]}>
          <Center>
            <Text3D
              font={helvetiker}
              size={0.42}
              height={0.08}
              curveSegments={20}
              bevelEnabled
              bevelThickness={0.03}
              bevelSize={0.02}
              bevelSegments={8}
            >
              {"Welcome to OCS'26"}
              <meshStandardMaterial
                ref={welcomeMaterialRef}
                color="#d0d0d0"
                metalness={1}
                roughness={0.08}
                envMapIntensity={0}
                transparent
                opacity={1}
              />
            </Text3D>
          </Center>
        </group>
      </group>
    </>
  );
}

export default ACMLogo3D;
