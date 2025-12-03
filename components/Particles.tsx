import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType, HandGestures } from '../types';
import { generateParticles } from '../utils/shapes';

interface ParticlesProps {
  shape: ShapeType;
  color: string;
  gesture: HandGestures;
}

const Particles: React.FC<ParticlesProps> = ({ shape, color, gesture }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const targetPositionsRef = useRef<Float32Array>(generateParticles(shape));
  const currentPositionsRef = useRef<Float32Array>(generateParticles(shape));
  const count = currentPositionsRef.current.length / 3;
  
  // Update target when shape changes
  useEffect(() => {
    targetPositionsRef.current = generateParticles(shape);
  }, [shape]);

  // Create geometry once
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(currentPositionsRef.current, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const target = targetPositionsRef.current;

    // Interaction Logic
    // If hands detected, map tension to scale/expansion
    let expansion = 1.0;
    if (gesture.detected) {
         // Smoothly interpolate expansion based on hand distance
         // If tension is high (hands apart), expansion is high
         expansion = 0.5 + gesture.tension * 2.0; 
    } else {
         // Breathing idle animation
         expansion = 1.0 + Math.sin(time) * 0.2;
    }

    // Lerp positions
    const lerpSpeed = 0.05;
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Base target position
        let tx = target[i3];
        let ty = target[i3 + 1];
        let tz = target[i3 + 2];

        // Apply noise/movement based on time
        if (shape === ShapeType.FIREWORKS) {
            tx += Math.sin(time * 2 + i) * 0.05;
            ty += Math.cos(time * 3 + i) * 0.05;
        } else if (shape === ShapeType.FLOWER) {
             // Rotate flower
             const cos = Math.cos(time * 0.2);
             const sin = Math.sin(time * 0.2);
             const x = tx; 
             const z = tz;
             tx = x * cos - z * sin;
             tz = x * sin + z * cos;
        }

        // Apply Expansion
        tx *= expansion;
        ty *= expansion;
        tz *= expansion;

        // Interpolate current to target
        positions[i3] += (tx - positions[i3]) * lerpSpeed;
        positions[i3+1] += (ty - positions[i3+1]) * lerpSpeed;
        positions[i3+2] += (tz - positions[i3+2]) * lerpSpeed;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Rotation based on gesture position (parallax effect)
    if (gesture.detected) {
        const targetRotX = (gesture.position.y - 0.5) * 1.5;
        const targetRotY = (gesture.position.x - 0.5) * 1.5;
        pointsRef.current.rotation.x += (targetRotX - pointsRef.current.rotation.x) * 0.1;
        pointsRef.current.rotation.y += (targetRotY - pointsRef.current.rotation.y) * 0.1;
    } else {
        pointsRef.current.rotation.y += 0.002;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
};

export default Particles;
