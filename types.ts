export enum ShapeType {
  SPHERE = 'Sphere',
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  MEDITATOR = 'Buddha',
  FIREWORKS = 'Fireworks',
}

export interface ParticleTheme {
  color: string;
  shape: ShapeType;
  label: string;
}

export interface HandGestures {
  pinched: boolean; // Are fingers pinched (closed)?
  tension: number; // 0 to 1, distance between hands or finger spread
  detected: boolean;
  position: { x: number; y: number }; // Normalized screen position
}
