import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Sparkles, 
  Check, 
  Play, 
  Square, 
  CheckCircle2, 
  ShieldCheck,
  Radio
} from 'lucide-react';
import { VoiceService, VoiceStatus, ElevenLabsVoice } from '../services/voiceService';

interface ElevenLabsVoiceSelectorProps {
  onClose?: () => void;
}

export const ElevenLabsVoiceSelector: React.FC<ElevenLabsVoiceSelectorProps> = ({ onClose }) => {
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(VoiceService.getSelectedVoiceId());
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    VoiceService.getVoiceStatus().then((st) => {
      setStatus(st);
      setSelectedVoice(VoiceService.getSelectedVoiceId());
    });
  }, []);

  const handlePreview = async (voice: ElevenLabsVoice) => {
    if (previewing === voice.voiceId) {
      VoiceService.stop();
      setPreviewing(null);
      return;
    }

    setPreviewing(voice.voiceId);
    setPreviewError(null);
    const result = await VoiceService.speak({
      text: `Hello! I'm ${voice.name}. I'll be narrating your lessons and Socratic discussions on Learnora.`,
      voiceId: voice.voiceId,
      onEnd: () => setPreviewing(null)
    });
    if (result.error) {
      setPreviewError(
        result.error.includes('paid_plan_required') || result.error.includes('Free users cannot use library voices')
          ? 'Your ElevenLabs plan does not allow API synthesis with this library voice. Upgrade your plan to enable it; browser speech remains available as fallback.'
          : result.error
      );
    }
  };

  const handleSave = () => {
    VoiceService.setSelectedVoiceId(selectedVoice);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose?.();
    }, 1500);
  };

  return (
    <div className="space-y-5 text-slate-800 font-sans">
      {/* Header Pill */}
      <div className="p-4 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-violet-500/30 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600/40 border border-violet-400/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-violet-300" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-white font-serif">Nora Voices Studio</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              status?.configured
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
            }`}>
              {status?.configured ? 'Key ready' : 'Setup needed'}
            </span>
          </div>
          <p className="text-xs text-violet-200/90 mt-1 leading-relaxed">
            Ultra-realistic AI speech synthesis for Nora AI Tutor, StudyFetch-style Explainer Videos, and Audio Lessons.
          </p>
        </div>
      </div>

      {status && !status.configured && (
        <div role="status" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
          ElevenLabs needs a valid API key beginning with <code className="font-semibold">sk_</code> in the server <code className="font-semibold">.env</code> file. Nora will use browser speech until it is configured.
        </div>
      )}

      {previewError && (
        <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
          {previewError}
        </div>
      )}

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Nora voice preferences saved successfully!</span>
        </div>
      )}

      {/* Curated Voice Selection */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Select Nora's Voice Model
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {status?.voices.map((voice) => {
            const isSelected = selectedVoice === voice.voiceId;
            const isPlaying = previewing === voice.voiceId;

            return (
              <div
                key={voice.voiceId}
                onClick={() => setSelectedVoice(voice.voiceId)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isSelected 
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 font-serif">{voice.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                      {voice.gender}
                    </span>
                    {voice.voiceId === 'EXAVITQu4vr4xnSDxMaL' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{voice.description}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(voice);
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isPlaying 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700'
                    }`}
                    title={isPlaying ? 'Stop Preview' : 'Sample Voice'}
                  >
                    {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 ml-0.5 fill-current" />}
                  </button>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Server-configured studio voice synthesis</span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            Apply Voice Settings
          </button>
        </div>
      </div>
    </div>
  );
};
