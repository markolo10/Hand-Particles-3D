import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { HandGestures } from '../types';

interface HandManagerProps {
  onGestureUpdate: (gesture: HandGestures) => void;
}

const HandManager: React.FC<HandManagerProps> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>(0);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        
        startCamera();
      } catch (e) {
        console.error("Failed to load MediaPipe", e);
        setLoading(false);
      }
    };
    init();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }
        setLoading(false);
      } catch (err) {
        console.error("Camera error", err);
        setLoading(false);
      }
    }
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (video && landmarker && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const startTimeMs = performance.now();
      
      const results = landmarker.detectForVideo(video, startTimeMs);
      
      let tension = 0;
      let pinched = false;
      let detected = false;
      let posX = 0; 
      let posY = 0;

      if (results.landmarks && results.landmarks.length > 0) {
        detected = true;
        
        // Two hands logic
        if (results.landmarks.length === 2) {
            const h1 = results.landmarks[0][8]; // Index tip
            const h2 = results.landmarks[1][8]; // Index tip
            
            // Distance between two index fingers
            const dx = h1.x - h2.x;
            const dy = h1.y - h2.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Map distance to tension (approx 0.05 to 0.8 range usually)
            tension = Math.min(Math.max((dist - 0.1) * 2, 0), 1.5);
            
            // Average position
            posX = (results.landmarks[0][0].x + results.landmarks[1][0].x) / 2;
            posY = (results.landmarks[0][0].y + results.landmarks[1][0].y) / 2;
        } 
        // Single hand logic
        else if (results.landmarks.length === 1) {
             const lm = results.landmarks[0];
             const thumb = lm[4];
             const index = lm[8];
             
             // Pinch detection (distance between thumb and index)
             const pinchDist = Math.sqrt(
                 Math.pow(thumb.x - index.x, 2) + 
                 Math.pow(thumb.y - index.y, 2)
             );
             
             pinched = pinchDist < 0.08;
             
             // Use palm size or spread for tension?
             // Let's use wrist-to-middle tip as a rough scale estimator compared to screen
             // Or just toggle state based on pinch
             tension = pinched ? 0.2 : 1.0; 

             posX = lm[0].x;
             posY = lm[0].y;
        }

        onGestureUpdate({ detected, tension, pinched, position: { x: posX, y: posY } });
      } else {
        onGestureUpdate({ detected: false, tension: 0, pinched: false, position: {x:0, y:0} });
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="absolute bottom-4 right-4 w-32 h-24 bg-black/50 rounded-lg overflow-hidden border border-white/20 z-50">
       {loading && <div className="text-white text-xs p-2">Init Vision...</div>}
       <video 
         ref={videoRef} 
         autoPlay 
         playsInline
         muted
         className="w-full h-full object-cover opacity-80"
       />
    </div>
  );
};

export default HandManager;
