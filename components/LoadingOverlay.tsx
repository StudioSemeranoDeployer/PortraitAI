
import React from 'react';

interface LoadingOverlayProps {
  message: string;
  lang: 'it' | 'en';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, lang }) => {
  const title = lang === 'it' ? 'L\'intelligenza artificiale è al lavoro...' : 'AI is working its magic...';
  const subText = lang === 'it' ? 'Elaborazione con Motore Creativo Avanzato' : 'Processing with Advanced Creative Engine';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <i className="fas fa-magic text-indigo-400 animate-pulse text-2xl"></i>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold gradient-text">{title}</h2>
          <p className="text-slate-400 animate-pulse min-h-[1.5rem]">{message}</p>
        </div>
        <div className="pt-4 flex flex-col items-center gap-2">
           <span className="text-[10px] uppercase tracking-widest text-slate-500">{subText}</span>
           <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]"></div>
           </div>
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 30%; }
          100% { width: 0%; transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;
