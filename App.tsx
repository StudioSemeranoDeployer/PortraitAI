
import React, { useState, useEffect, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import LoadingOverlay from './components/LoadingOverlay';
import { colorizePortrait, animatePortrait } from './services/gemini';
import { ProcessingState, MediaResult } from './types';

// Extend window for AI Studio helpers
declare global {
  // Define AIStudio interface to match the environment's expected type
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle' });
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      if (typeof window.aistudio !== 'undefined') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback for environment where this isn't available
        setHasKey(true);
      }
    } catch (e) {
      setHasKey(false);
    }
  };

  const handleOpenKeySelection = async () => {
    if (typeof window.aistudio !== 'undefined') {
      await window.aistudio.openSelectKey();
      // Assume success after triggering key selection as per guidelines to mitigate race conditions
      setHasKey(true);
    }
  };

  const handleFileUpload = (file: File) => {
    setOriginalFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setOriginalPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const toBase64 = (file: File): Promise<string> => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handleColorize = async () => {
    if (!originalFile) return;
    setProcessing({ status: 'processing', message: 'Enhancing colors and textures...' });
    try {
      const base64 = await toBase64(originalFile);
      const colorizedUrl = await colorizePortrait(base64);
      setResult({
        type: 'image',
        url: colorizedUrl,
        originalUrl: originalPreview!
      });
      setProcessing({ status: 'done' });
    } catch (error: any) {
      console.error(error);
      setProcessing({ status: 'error', message: error.message || 'Colorization failed' });
    }
  };

  const handleAnimate = async () => {
    if (!originalFile) return;
    
    // Check key for Veo specifically
    if (!hasKey) {
      await handleOpenKeySelection();
    }

    setProcessing({ status: 'processing', message: 'Initializing AI motion engine...' });
    try {
      const base64 = await toBase64(originalFile);
      const videoUrl = await animatePortrait(base64, (msg) => {
        setProcessing(prev => ({ ...prev, message: msg }));
      });
      setResult({
        type: 'video',
        url: videoUrl,
        originalUrl: originalPreview!
      });
      setProcessing({ status: 'done' });
    } catch (error: any) {
      console.error(error);
      // Handle key expiration as per guidelines
      if (error.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        setProcessing({ status: 'error', message: "API key session expired. Please re-select your key." });
      } else {
        setProcessing({ status: 'error', message: error.message || 'Animation failed' });
      }
    }
  };

  const reset = () => {
    setOriginalFile(null);
    setOriginalPreview(null);
    setResult(null);
    setProcessing({ status: 'idle' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-40 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <i className="fas fa-wand-sparkles text-white"></i>
          </div>
          <span className="text-xl font-bold tracking-tight">Portrait<span className="text-indigo-400">AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors">Colorizer</a>
          <a href="#" className="hover:text-white transition-colors">Animator</a>
          <a href="#" className="hover:text-white transition-colors">Portraits</a>
        </div>
        <button 
          onClick={handleOpenKeySelection}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all 
            ${hasKey ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
        >
          <i className={`fas ${hasKey ? 'fa-check-circle' : 'fa-key'}`}></i>
          {hasKey ? 'API Key Linked' : 'Link API Key'}
        </button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12">
        <header className="max-w-3xl mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Bring your <span className="gradient-text">Old Memories</span> back to life.
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Upload a vintage portrait and watch it transform. Use our AI Colorizer to restore natural hues or the Animator to breathe life into the frame.
          </p>
        </header>

        {/* Workspace */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass rounded-3xl p-6 space-y-6">
              {!originalPreview ? (
                <FileUploader onUpload={handleFileUpload} isLoading={processing.status === 'processing'} />
              ) : (
                <div className="space-y-6">
                  <div className="relative group">
                    <img 
                      src={originalPreview} 
                      className="w-full h-80 object-cover rounded-2xl border border-white/10" 
                      alt="Original" 
                    />
                    <button 
                      onClick={reset}
                      className="absolute top-4 right-4 bg-red-500/20 hover:bg-red-500/40 text-red-300 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={handleColorize}
                      disabled={processing.status === 'processing'}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all border border-white/5 hover:border-indigo-500/50"
                    >
                      <i className="fas fa-palette text-indigo-400"></i>
                      Colorize Portrait
                    </button>
                    <button 
                      onClick={handleAnimate}
                      disabled={processing.status === 'processing'}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <i className="fas fa-play text-white"></i>
                      Animate to Video
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">How it works</h3>
              <ul className="space-y-4">
                {[
                  { icon: 'fa-upload', text: 'Upload a portrait photo' },
                  { icon: 'fa-microchip', text: 'Gemini 3 analyzes facial features' },
                  { icon: 'fa-video', text: 'Veo generates realistic motion' }
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 items-center">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <i className={`fas ${step.icon} text-xs`}></i>
                    </div>
                    <span className="text-sm text-slate-300">{step.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="glass rounded-3xl min-h-[500px] flex flex-col overflow-hidden relative">
              {!result ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                  <div className="w-20 h-20 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center mb-6">
                    <i className="fas fa-magic text-3xl"></i>
                  </div>
                  <h3 className="text-xl font-medium text-slate-300 mb-2">Results will appear here</h3>
                  <p className="max-w-xs">Upload a photo and choose an AI operation to see the magic happen.</p>
                </div>
              ) : (
                <div className="flex-1 p-6 space-y-6">
                   <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <i className={`fas ${result.type === 'video' ? 'fa-video' : 'fa-image'} text-indigo-400`}></i>
                        AI Generated Result
                      </h3>
                      <div className="flex gap-2">
                         <a 
                            href={result.url} 
                            download={`result-${Date.now()}.${result.type === 'video' ? 'mp4' : 'png'}`}
                            className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                         >
                            <i className="fas fa-download"></i>
                            Download
                         </a>
                      </div>
                   </div>

                   <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/5">
                      {result.type === 'video' ? (
                        <video 
                          key={result.url}
                          src={result.url} 
                          controls 
                          autoPlay 
                          loop 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col md:flex-row">
                          <div className="flex-1 relative group overflow-hidden">
                             <img src={result.originalUrl} className="w-full h-full object-cover grayscale brightness-50" alt="Old" />
                             <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded text-xs uppercase tracking-widest font-bold">Original</div>
                          </div>
                          <div className="flex-1 relative group overflow-hidden border-l border-white/10">
                             <img src={result.url} className="w-full h-full object-cover" alt="Colorized" />
                             <div className="absolute top-4 left-4 bg-indigo-500/80 backdrop-blur px-3 py-1 rounded text-xs uppercase tracking-widest font-bold">AI Colorized</div>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {processing.status === 'error' && (
                <div className="absolute bottom-6 right-6 left-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-4 text-red-400 animate-slide-up">
                  <i className="fas fa-exclamation-circle text-xl"></i>
                  <p className="text-sm font-medium">{processing.message}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Processing State */}
      {processing.status === 'processing' && (
        <LoadingOverlay message={processing.message || 'Connecting to AI...'} />
      )}

      {/* Footer */}
      <footer className="glass border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-2 rounded-lg">
              <i className="fas fa-wand-sparkles text-indigo-400"></i>
            </div>
            <span className="text-lg font-bold tracking-tight">PortraitAI</span>
          </div>
          <p className="text-slate-500 text-sm">Powered by Gemini 3 & Veo &bull; © 2024 AI Creative Studio</p>
          <div className="flex gap-4">
             <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"><i className="fab fa-github"></i></a>
             <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"><i className="fab fa-twitter"></i></a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
