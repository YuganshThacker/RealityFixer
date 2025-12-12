import React, { useState, useEffect } from 'react';
import { DiagnosisResponse } from '../types';
import { AlertTriangle, Wrench, CheckCircle, Lightbulb, Info, RefreshCw, AlertOctagon, Volume2, VolumeX, StopCircle } from 'lucide-react';

interface ResultsPanelProps {
  result: DiagnosisResponse;
  onReset: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, onReset }) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'details'>('steps');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesisUtterance, setSpeechSynthesisUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Stop speaking when unmounting or resetting
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `
      Diagnosis: ${result.issue_detected}. 
      Safety Warning: ${result.safety_warnings ? result.safety_warnings.join('. ') : ''}. 
      Steps: ${result.steps ? result.steps.join('. ') : ''}
    `;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    
    setSpeechSynthesisUtterance(utterance);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-md rounded-t-3xl border-t border-neutral-700 shadow-2xl z-20 max-h-[85vh] overflow-y-auto transition-transform duration-300 ease-in-out">
      
      {/* Handle bar */}
      <div className="w-full flex justify-center pt-3 pb-1 sticky top-0 bg-neutral-900/95 z-30">
        <div className="w-16 h-1.5 bg-neutral-600 rounded-full"></div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-400/10 px-2 py-0.5 rounded-full">
                {result.confidence || "N/A"} Confidence
              </span>
              <h2 className="text-xl font-bold text-white">{result.object_detected}</h2>
            </div>
            <p className="text-neutral-300 font-medium text-lg leading-snug">{result.issue_detected}</p>
          </div>
          
          <div className="flex gap-2 ml-4">
             {/* Text to Speech Button - Accessibility Feature */}
            <button 
              onClick={toggleSpeech}
              className={`p-2 rounded-full transition ${isSpeaking ? 'bg-blue-500 text-white animate-pulse' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
              aria-label={isSpeaking ? "Stop Reading" : "Read Steps Aloud"}
            >
              {isSpeaking ? <StopCircle size={20} /> : <Volume2 size={20} />}
            </button>
            <button 
              onClick={onReset}
              className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 transition"
              aria-label="Reset"
            >
              <RefreshCw size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Safety Warnings - Always Visible */}
        {result.safety_warnings && result.safety_warnings.length > 0 && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
              <AlertOctagon size={18} />
              SAFETY WARNINGS
            </div>
            <ul className="list-disc list-inside text-red-200 text-sm space-y-1 ml-1">
              {result.safety_warnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Camera Guidance Alert */}
        {result.camera_guidance && result.camera_guidance.length > 5 && result.camera_guidance.toLowerCase() !== "none" && (
           <div className="bg-blue-900/30 border border-blue-800 rounded-xl p-3 flex items-start gap-3">
             <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
             <p className="text-blue-200 text-sm">{result.camera_guidance}</p>
           </div>
        )}

        {/* Tools Section */}
        <div>
          <h3 className="text-neutral-300 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Wrench size={16} /> Required Tools
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {result.tools_required && result.tools_required.length > 0 ? result.tools_required.map((tool, idx) => (
              <span key={idx} className="bg-neutral-800 text-white text-sm px-3 py-1.5 rounded-lg border border-neutral-700">
                {tool}
              </span>
            )) : <span className="text-neutral-500 text-sm italic">No special tools listed.</span>}
          </div>
          
          {/* Alternatives */}
          {result.household_tool_alternatives && result.household_tool_alternatives.length > 0 && (
             <div className="flex items-start gap-2 bg-neutral-800/50 p-3 rounded-lg">
                <Lightbulb size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                   <span className="text-yellow-500 font-medium">No tools? Try: </span>
                   <span className="text-neutral-300">{result.household_tool_alternatives.join(', ')}</span>
                </div>
             </div>
          )}
        </div>

        {/* Tabs for Steps vs Details */}
        <div className="border-b border-neutral-700 flex gap-6">
            <button 
                onClick={() => setActiveTab('steps')}
                className={`pb-2 text-sm font-semibold transition ${activeTab === 'steps' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-500'}`}
            >
                Repair Steps
            </button>
            <button 
                onClick={() => setActiveTab('details')}
                className={`pb-2 text-sm font-semibold transition ${activeTab === 'details' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-500'}`}
            >
                Why & How to Prevent
            </button>
        </div>

        {/* Content based on tab */}
        {activeTab === 'steps' ? (
            <div className="space-y-4">
            {result.steps && result.steps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-600/40">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-neutral-200 text-sm leading-relaxed">{step}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="space-y-6">
                <div>
                    <h4 className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Root Cause</h4>
                    <p className="text-neutral-200 text-sm leading-relaxed">{result.cause_explanation}</p>
                </div>
                <div>
                    <h4 className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Prevention Tips</h4>
                    <p className="text-neutral-200 text-sm leading-relaxed">{result.prevention_tips}</p>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};