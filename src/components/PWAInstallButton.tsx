import React, { useState } from 'react';
import { Download, Share2, PlusSquare, Check, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={handleInstallClick}
          disabled={installing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          title="Install Learnora as an App"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        disabled={installing}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-98"
      >
        <Download className="w-4 h-4" />
        <span>Install Learnora to Home Screen</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold transition-all ${
            variant === 'full' ? 'w-full justify-center py-2.5 text-sm' : ''
          }`}
          title="Add Learnora to iOS Home Screen"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="font-bold text-base text-slate-900 text-center font-serif">
                Install Learnora on iOS
              </h3>
              <p className="text-xs text-slate-500 text-center mt-1 mb-5">
                Install Learnora to your iPhone or iPad home screen for full-screen offline learning:
              </p>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Tap the Safari <strong>Share</strong> button</span>
                    <Share2 className="w-4 h-4 text-indigo-600 shrink-0 inline" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
                    <PlusSquare className="w-4 h-4 text-indigo-600 shrink-0 inline" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <span>Tap <strong>Add</strong> in the top-right corner to launch!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default browser fallback prompt if available in browser
  return (
    <button
      onClick={handleInstallClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-all ${
        variant === 'full' ? 'w-full justify-center py-2.5 text-sm' : ''
      }`}
      title="Install Learnora App"
    >
      <Download className="w-3.5 h-3.5 text-indigo-600" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
};
