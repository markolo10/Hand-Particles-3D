import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import HandManager from './components/HandManager';
import Particles from './components/Particles';
import { HandGestures, ShapeType, ParticleTheme } from './types';
import { generateThemeFromPrompt } from './services/gemini';

const App: React.FC = () => {
  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.HEART);
  const [color, setColor] = useState('#ff0066');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gesture, setGesture] = useState<HandGestures>({
    detected: false,
    tension: 0,
    pinched: false,
    position: { x: 0.5, y: 0.5 }
  });

  const handleGestureUpdate = useCallback((newGesture: HandGestures) => {
    setGesture(newGesture);
  }, []);

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    const theme = await generateThemeFromPrompt(aiPrompt);
    if (theme) {
      setColor(theme.color);
      setCurrentShape(theme.shape);
    }
    setIsGenerating(false);
  };

  return (
    <div className="relative w-full h-full bg-black text-white font-sans">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <color attach="background" args={['#050505']} />
          <Suspense fallback={null}>
             <Particles shape={currentShape} color={color} gesture={gesture} />
             <Environment preset="city" />
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-6 z-10 w-full max-w-sm pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Zen Particles
          </h1>
          
          {/* Shape Selector */}
          <div className="mb-6">
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Template</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(ShapeType).map((shape) => (
                <button
                  key={shape}
                  onClick={() => setCurrentShape(shape)}
                  className={`px-2 py-2 text-xs rounded-lg transition-all border ${
                    currentShape === shape 
                    ? 'bg-white/20 border-white text-white' 
                    : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Color</label>
            <div className="flex gap-2 items-center">
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
              />
              <span className="text-sm font-mono text-gray-300">{color}</span>
            </div>
          </div>

          {/* AI Generator */}
          <div className="mb-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Gemini Magic</label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Describe a mood..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !process.env.API_KEY}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white p-2 rounded-lg disabled:opacity-50 transition-all"
              >
                {isGenerating ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                )}
              </button>
            </div>
             {!process.env.API_KEY && <p className="text-[10px] text-red-400 mt-1">API_KEY missing in env</p>}
          </div>
        </div>
      </div>

      {/* Instructions Overlay */}
      {!gesture.detected && (
         <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center pointer-events-none transition-opacity duration-500">
             <p className="text-white/60 text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                 Show hands to control • Pinch/Spread to resize
             </p>
         </div>
      )}

      {/* Hand Processor (Invisible Logic) */}
      <HandManager onGestureUpdate={handleGestureUpdate} />
    </div>
  );
};

export default App;
