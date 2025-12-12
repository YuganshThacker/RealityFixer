import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, // Prefer back camera
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied. Please allow camera access in your browser settings and try again.");
      } else if (err.name === 'NotFoundError') {
        setError("No camera found on this device.");
      } else {
        setError("Unable to access camera. Please ensure permissions are granted.");
      }
    }
  }, []);

  // Initialize Camera
  useEffect(() => {
    startCamera();

    return () => {
      // Cleanup is handled by the dependency effect below
    };
  }, [startCamera]);

  // Cleanup stream on unmount or change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Bind stream to video element whenever ref or stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Match canvas size to video actual size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get high quality JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      }
    }
  }, [onCapture]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-neutral-900">
        <div className="bg-red-500/10 p-4 rounded-full mb-4 animate-pulse">
           <AlertCircle size={48} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Camera Access Error</h3>
        <p className="text-red-400 mb-6 max-w-xs mx-auto text-sm leading-relaxed">{error}</p>
        <button 
            onClick={() => startCamera()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition flex items-center gap-2"
        >
            <RefreshCw size={18} />
            Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Capture Button Overlay */}
      <div className="absolute bottom-12 w-full flex justify-center z-10 px-4">
        <button
          onClick={handleCapture}
          disabled={isProcessing}
          className={`
            group relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-white
            transition-all duration-200 active:scale-95
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}
          `}
          aria-label="Take Photo"
        >
          <div className="w-16 h-16 bg-white rounded-full group-active:scale-90 transition-transform duration-200" />
        </button>
      </div>
      
    </div>
  );
};
