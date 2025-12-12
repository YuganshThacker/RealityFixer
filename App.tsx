import React, { useState, useCallback } from 'react';
import { CameraCapture } from './components/CameraCapture';
import { ResultsPanel } from './components/ResultsPanel';
import { AnnotationCanvas } from './components/AnnotationCanvas';
import { analyzeImage } from './services/geminiService';
import { AnalysisState } from './types';
import { Loader2, Sparkles, X, BrainCircuit } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    imageSrc: null,
    result: null,
    error: null,
  });

  const [viewportDims, setViewportDims] = useState({ width: window.innerWidth, height: window.innerHeight });

  React.useEffect(() => {
    const handleResize = () => setViewportDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCapture = useCallback(async (imageData: string) => {
    setState(prev => ({ ...prev, status: 'analyzing', imageSrc: imageData, error: null }));

    try {
      const diagnosis = await analyzeImage(imageData);
      setState(prev => ({ 
        ...prev, 
        status: 'complete', 
        result: diagnosis 
      }));
    } catch (err) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: "Failed to analyze the image. Please try again or check your internet connection." 
      }));
    }
  }, []);

  const handleReset = useCallback(() => {
    setState({
      status: 'idle',
      imageSrc: null,
      result: null,
      error: null,
    });
  }, []);

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col font-sans">
      {/* App Header */}
      <div className="absolute top-0 left-0 z-50 p-6 w-full flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-md">
          <Sparkles className="text-blue-500" size={24} fill="currentColor" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            RealityFixer
          </span>
        </h1>
        {state.status === 'idle' && (
            <div className="px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center gap-2">
                <BrainCircuit size={14} className="text-purple-400" />
                <span className="text-[10px] uppercase font-bold text-neutral-300 tracking-wider">Gemini Powered</span>
            </div>
        )}
      </div>

      <div className="flex-1 relative bg-neutral-900">
        
        {state.status === 'idle' && (
           <div className="relative w-full h-full">
              <CameraCapture onCapture={handleCapture} isProcessing={false} />
              
              {/* Startup Message Overlay */}
              <div className="absolute top-1/4 left-0 right-0 z-20 flex justify-center px-6 pointer-events-none">
                <div className="bg-neutral-900/80 backdrop-blur-md px-6 py-6 rounded-3xl border border-white/10 text-center max-w-sm shadow-2xl">
                  <h2 className="text-white font-semibold text-xl mb-2">What's broken?</h2>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Point your camera at any object. 
                    <br/>
                    I'll analyze it, find the issue, and guide you through the fix.
                  </p>
                </div>
              </div>
           </div>
        )}

        {(state.status === 'analyzing' || state.status === 'complete' || state.status === 'error') && state.imageSrc && (
          <div className="relative w-full h-full animate-in fade-in duration-500">
            <img 
              src={state.imageSrc} 
              alt="Analysis Target" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

            {state.status === 'complete' && state.result && (
              <AnnotationCanvas 
                width={viewportDims.width} 
                height={viewportDims.height} 
                annotations={state.result.annotations} 
              />
            )}

            {state.status === 'analyzing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-30">
                <div className="relative">
                    <Loader2 className="animate-spin text-purple-500" size={64} />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" size={24} />
                </div>
                <p className="text-white font-bold text-xl mt-6 animate-pulse">Thinking...</p>
                <p className="text-purple-300 text-sm mt-2">Identifying mechanical parts & hazards</p>
              </div>
            )}

            {state.status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-30 p-8 text-center">
                 <div className="bg-red-500/20 p-6 rounded-full mb-6">
                   <X size={48} className="text-red-500" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Diagnosis Failed</h3>
                 <p className="text-neutral-400 mb-8 max-w-xs mx-auto">{state.error}</p>
                 <button 
                   onClick={handleReset}
                   className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition transform hover:scale-105"
                 >
                   Try Again
                 </button>
              </div>
            )}
            
            {state.status !== 'analyzing' && (
                 <button 
                 onClick={handleReset}
                 className="absolute top-6 right-6 z-40 p-3 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:bg-black/60 hover:text-white transition border border-white/10"
               >
                 <X size={24} />
               </button>
            )}

          </div>
        )}
      </div>

      {state.status === 'complete' && state.result && (
        <ResultsPanel result={state.result} onReset={handleReset} />
      )}
    </div>
  );
}
