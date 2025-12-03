import { ShapeType } from '../types';
import * as THREE from 'three';

const COUNT = 4000;

const randomPointOnSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

export const generateParticles = (type: ShapeType): Float32Array => {
  const positions = new Float32Array(COUNT * 3);
  const vec = new THREE.Vector3();

  for (let i = 0; i < COUNT; i++) {
    let x = 0, y = 0, z = 0;

    switch (type) {
      case ShapeType.SPHERE: {
        const p = randomPointOnSphere(2);
        x = p.x; y = p.y; z = p.z;
        break;
      }
      case ShapeType.HEART: {
        // Parametric Heart
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        // A variation of 3D heart formula
        const t = Math.PI - 2 * Math.PI * Math.random();
        const u = 2 * Math.PI * Math.random();
        
        // x = 16sin^3(t)
        // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
        // Extrude z based on thickness
        x = 16 * Math.pow(Math.sin(t), 3);
        y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        z = (Math.random() - 0.5) * 10 * Math.sin(t); // volume
        
        // Scale down
        x *= 0.15; y *= 0.15; z *= 0.15;
        break;
      }
      case ShapeType.FLOWER: {
        // Phyllotaxis
        const spacing = 0.15;
        const theta = i * 2.39996; // Golden angle approx
        const r = spacing * Math.sqrt(i);
        x = r * Math.cos(theta);
        y = (Math.random() - 0.5) * 2; // thickness
        z = r * Math.sin(theta);
        
        // Cup shape
        y += Math.sin(r * 0.5) * 2;
        break;
      }
      case ShapeType.SATURN: {
        if (i < COUNT * 0.3) {
          // Planet
          const p = randomPointOnSphere(1.5);
          x = p.x; y = p.y; z = p.z;
        } else {
          // Ring
          const angle = Math.random() * Math.PI * 2;
          const dist = 2.5 + Math.random() * 2.5;
          x = Math.cos(angle) * dist;
          z = Math.sin(angle) * dist;
          y = (Math.random() - 0.5) * 0.2;
          
          // Tilt
          const tilt = 0.4;
          const ty = y * Math.cos(tilt) - z * Math.sin(tilt);
          const tz = y * Math.sin(tilt) + z * Math.cos(tilt);
          y = ty;
          z = tz;
        }
        break;
      }
      case ShapeType.MEDITATOR: {
        // Abstract Buddha: Stacked spheres
        const r = Math.random();
        if (r < 0.2) {
          // Head
          const p = randomPointOnSphere(0.6);
          x = p.x; y = p.y + 1.8; z = p.z;
        } else if (r < 0.6) {
          // Body (Ellipsoid)
          const p = randomPointOnSphere(1.2);
          x = p.x * 1.2; y = p.y * 1.2; z = p.z * 1.0;
        } else {
          // Legs/Base (Wide Ellipsoid)
          const p = randomPointOnSphere(1.5);
          x = p.x * 1.8; y = p.y * 0.8 - 1.5; z = p.z * 1.5;
        }
        break;
      }
      case ShapeType.FIREWORKS: {
        // Explosion snapshot
        const p = randomPointOnSphere(0.2 + Math.random() * 4);
        x = p.x; y = p.y; z = p.z;
        // Add some trails
        if (Math.random() > 0.8) {
             x *= 1.5; y *= 1.5; z *= 1.5;
        }
        break;
      }
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
};
