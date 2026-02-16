
import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import LoadingOverlay from './components/LoadingOverlay';
import { colorizePortrait, animatePortrait } from './services/gemini';
import { ProcessingState, MediaResult } from './types';

type Language = 'it' | 'en';
type Orientation = '16:9' | '9:16';

const translations = {
  it: {
    navColorizer: "Coloratore",
    navAnimator: "Animatore",
    navPortraits: "Ritratti",
    linkKey: "Collega Chiave API",
    keyLinked: "Chiave API Collegata",
    heroTitle: "Riporta in vita i tuoi ",
    heroTitleSpan: "vecchi ricordi",
    heroDesc: "Carica un ritratto vintage e guardalo trasformarsi. Usa il nostro Coloratore AI per ripristinare tonalità naturali o l'Animatore per infondere vita all'immagine.",
    uploadPortrait: "Carica Ritratto",
    colorizeBtn: "Colora Ritratto",
    animateBtn: "Anima in Video",
    howItWorks: "Come funziona",
    step1: "Carica una foto ritratto",
    step2: "L'IA analizza i tratti somatici",
    step3: "Il motore genera movimento realistico",
    resultsPlaceholder: "I risultati appariranno qui",
    resultsDesc: "Carica una foto e scegli un'operazione per vedere la magia.",
    aiResult: "Risultato Generato dall'IA",
    download: "Scarica",
    original: "Originale",
    aiColorized: "Colorato dall'IA",
    footerText: "Sviluppato con Motori AI di ultima generazione",
    processingColor: "Miglioramento colori e texture in corso...",
    processingAnim: "Inizializzazione motore di movimento...",
    processingWait: "Sintetizzando i fotogrammi (potrebbe richiedere un minuto)...",
    processingHold: "Ancora un momento, stiamo quasi finendo!",
    errorKey: "Sessione chiave API scaduta. Seleziona nuovamente la chiave.",
    studioBrand: "VirtualArchitectsStudio",
    orientation: "Orientamento",
    landscape: "Orizzontale",
    portrait: "Verticale"
  },
  en: {
    navColorizer: "Colorizer",
    navAnimator: "Animator",
    navPortraits: "Portraits",
    linkKey: "Link API Key",
    keyLinked: "API Key Linked",
    heroTitle: "Bring your ",
    heroTitleSpan: "old memories",
    heroTitleEnd: " back to life.",
    heroDesc: "Upload a vintage portrait and watch it transform. Use our AI Colorizer to restore natural hues or the Animator to breathe life into the frame.",
    uploadPortrait: "Upload Portrait",
    colorizeBtn: "Colorize Portrait",
    animateBtn: "Animate to Video",
    howItWorks: "How it works",
    step1: "Upload a portrait photo",
    step2: "AI analyzes facial features",
    step3: "The engine generates realistic motion",
    resultsPlaceholder: "Results will appear here",
    resultsDesc: "Upload a photo and choose an AI operation to see the magic happen.",
    aiResult: "AI Generated Result",
    download: "Download",
    original: "Original",
    aiColorized: "AI Colorized",
    footerText: "Powered by next-gen AI Engines",
    processingColor: "Enhancing colors and textures...",
    processingAnim: "Initializing motion engine...",
    processingWait: "Synthesizing motion frames (may take a minute)...",
    processingHold: "Almost there, hang tight!",
    errorKey: "API key session expired. Please re-select your key.",
    studioBrand: "VirtualArchitectsStudio",
    orientation: "Orientation",
    landscape: "Landscape",
    portrait: "Portrait"
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('it');
  const [orientation, setOrientation] = useState<Orientation>('16:9');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle' });
  const [hasKey, setHasKey] = useState<boolean>(false);

  const t = translations[lang];

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true);
      }
    } catch (e) {
      setHasKey(false);
    }
  };

  const handleOpenKeySelection = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
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
    setProcessing({ status: 'processing', message: t.processingColor });
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
      setProcessing({ status: 'error', message: error.message || 'Error' });
    }
  };

  const handleAnimate = async () => {
    if (!originalFile) return;
    if (!hasKey) await handleOpenKeySelection();

    setProcessing({ status: 'processing', message: t.processingAnim });
    try {
      const base64 = await toBase64(originalFile);
      const videoUrl = await animatePortrait(base64, (msg) => {
        const mappedMsg = msg.includes("Synthesizing") ? t.processingWait : 
                          msg.includes("Still") ? t.processingHold : t.processingAnim;
        setProcessing(prev => ({ ...prev, message: mappedMsg }));
      }, orientation);
      setResult({
        type: 'video',
        url: videoUrl,
        originalUrl: originalPreview!
      });
      setProcessing({ status: 'done' });
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        setProcessing({ status: 'error', message: t.errorKey });
      } else {
        setProcessing({ status: 'error', message: error.message || 'Error' });
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
      <nav className="glass sticky top-0 z-40 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <i className="fas fa-wand-sparkles text-white"></i>
          </div>
          <span className="text-xl font-bold tracking-tight">Portrait<span className="text-indigo-400">AI</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
            <button 
              onClick={() => setLang('it')} 
              className={`px-3 py-1 rounded-md transition-all ${lang === 'it' ? 'bg-indigo-500 text-white shadow-sm' : 'hover:text-white'}`}
            >
              IT
            </button>
            <button 
              onClick={() => setLang('en')} 
              className={`px-3 py-1 rounded-md transition-all ${lang === 'en' ? 'bg-indigo-500 text-white shadow-sm' : 'hover:text-white'}`}
            >
              EN
            </button>
          </div>
          <div className="w-[1px] h-8 bg-white/10 mx-2"></div>
          <a href="#" className="hover:text-white transition-colors">{t.navColorizer}</a>
          <a href="#" className="hover:text-white transition-colors">{t.navAnimator}</a>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenKeySelection}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all 
              ${hasKey ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'}`}
          >
            <i className={`fas ${hasKey ? 'fa-check-circle' : 'fa-key'}`}></i>
            {hasKey ? t.keyLinked : t.linkKey}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12">
        <header className="max-w-3xl mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            {t.heroTitle}<span className="gradient-text">{t.heroTitleSpan}</span>{lang === 'en' && t.heroTitleEnd}
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            {t.heroDesc}
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass rounded-3xl p-6 space-y-6 shadow-xl shadow-black/20">
              {!originalPreview ? (
                <FileUploader 
                  onUpload={handleFileUpload} 
                  isLoading={processing.status === 'processing'} 
                  label={t.uploadPortrait}
                />
              ) : (
                <div className="space-y-6">
                  <div className="relative group">
                    <img src={originalPreview} className="w-full h-80 object-cover rounded-2xl border border-white/10" alt="Original" />
                    <button 
                      onClick={reset} 
                      className="absolute top-4 right-4 bg-red-500/20 hover:bg-red-500/60 text-red-100 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{t.orientation}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setOrientation('16:9')}
                          className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all border ${orientation === '16:9' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-white/5 text-slate-500'}`}
                        >
                          <i className="fas fa-image"></i>
                          {t.landscape}
                        </button>
                        <button 
                          onClick={() => setOrientation('9:16')}
                          className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all border ${orientation === '9:16' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-white/5 text-slate-500'}`}
                        >
                          <i className="fas fa-mobile-alt"></i>
                          {t.portrait}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <button onClick={handleColorize} disabled={processing.status === 'processing'} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all border border-white/5 hover:border-indigo-500/50 group">
                        <i className="fas fa-palette text-indigo-400 group-hover:scale-110 transition-transform"></i>
                        {t.colorizeBtn}
                      </button>
                      <button onClick={handleAnimate} disabled={processing.status === 'processing'} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all shadow-lg shadow-indigo-500/30 group">
                        <i className="fas fa-play text-white group-hover:translate-x-0.5 transition-transform"></i>
                        {t.animateBtn}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-6 shadow-xl shadow-black/10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">{t.howItWorks}</h3>
              <ul className="space-y-4">
                {[
                  { icon: 'fa-upload', text: t.step1 },
                  { icon: 'fa-microchip', text: t.step2 },
                  { icon: 'fa-video', text: t.step3 }
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 items-center">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-white/5 shadow-inner">
                      <i className={`fas ${step.icon} text-xs`}></i>
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{step.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="glass rounded-3xl min-h-[500px] flex flex-col overflow-hidden relative shadow-2xl shadow-indigo-500/5 border border-white/10">
              {!result ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                  <div className="w-20 h-20 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <i className="fas fa-magic text-3xl"></i>
                  </div>
                  <h3 className="text-xl font-medium text-slate-300 mb-2">{t.resultsPlaceholder}</h3>
                  <p className="max-w-xs">{t.resultsDesc}</p>
                </div>
              ) : (
                <div className="flex-1 p-6 space-y-6 flex flex-col h-full">
                   <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <i className={`fas ${result.type === 'video' ? 'fa-video' : 'fa-image'} text-indigo-400`}></i>
                        </div>
                        {t.aiResult}
                      </h3>
                      <div className="flex gap-2">
                         <a href={result.url} download={`result.${result.type === 'video' ? 'mp4' : 'png'}`} className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-indigo-500/20">
                            <i className="fas fa-download"></i>
                            {t.download}
                         </a>
                      </div>
                   </div>

                   <div className={`relative flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center ${result.type === 'video' && orientation === '9:16' ? 'max-w-sm mx-auto' : ''}`}>
                      {result.type === 'video' ? (
                        <video 
                          key={result.url} 
                          src={result.url} 
                          controls 
                          autoPlay 
                          loop 
                          className="w-full h-full object-contain shadow-2xl" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col md:flex-row">
                          <div className="flex-1 relative group overflow-hidden">
                             <img src={result.originalUrl} className="w-full h-full object-cover grayscale brightness-50" alt="Old" />
                             <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black border border-white/10 shadow-lg">{t.original}</div>
                          </div>
                          <div className="flex-1 relative group overflow-hidden border-l border-white/10">
                             <img src={result.url} className="w-full h-full object-cover" alt="Colorized" />
                             <div className="absolute top-4 left-4 bg-indigo-500/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black border border-white/10 shadow-lg">{t.aiColorized}</div>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              )}
              {processing.status === 'error' && (
                <div className="absolute bottom-6 right-6 left-6 bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-4 text-red-400 animate-slide-up shadow-2xl backdrop-blur-lg">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <i className="fas fa-exclamation-circle text-xl"></i>
                  </div>
                  <p className="text-sm font-semibold">{processing.message}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {processing.status === 'processing' && (
        <LoadingOverlay message={processing.message || '...'} lang={lang} />
      )}

      <footer className="glass border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-2.5 rounded-xl border border-white/5 shadow-inner">
                <i className="fas fa-wand-sparkles text-indigo-400"></i>
              </div>
              <span className="text-xl font-bold tracking-tight">Portrait<span className="text-indigo-400">AI</span></span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-indigo-400/60 mt-4 pl-1">{t.studioBrand}</p>
          </div>
          <p className="text-slate-500 text-sm font-medium text-center md:text-left">{t.footerText} &bull; © 2024</p>
          <div className="flex gap-4">
             <a href="#" className="w-11 h-11 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/20 border border-white/5 transition-all"><i className="fab fa-instagram"></i></a>
             <a href="#" className="w-11 h-11 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/20 border border-white/5 transition-all"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
