
import React, { useState, useMemo, useRef } from 'react';
import { VoiceId, Emotion, Speed, Pitch, AudioGeneration, VoiceProfile } from './types.ts';
import { VOICE_PROFILES, EMOTIONS, SPEEDS, PITCHES } from './constants.tsx';
import { TTSService, getAudioCtx } from './services/geminiService.ts';
import HistoryItem from './components/HistoryItem.tsx';

// Instantiate service once outside
const ttsService = new TTSService();

const App: React.FC = () => {
  const [inputText, setInputText] = useState('नमस्ते! मैं आपकी हिंदी आवाज हूँ।');
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('Male2');
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>('Neutral');
  const [selectedSpeed, setSelectedSpeed] = useState<Speed>('Medium');
  const [selectedPitch, setSelectedPitch] = useState<Pitch>('Medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<AudioGeneration[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Preview States
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleGenerate = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    setIsGenerating(true);
    setError(null);
    try {
      const profile = VOICE_PROFILES.find(v => v.id === selectedVoice)!;
      const audioBuffer = await ttsService.generateSpeech(
        trimmedText,
        profile,
        selectedEmotion,
        selectedSpeed,
        selectedPitch
      );

      const newGen: AudioGeneration = {
        id: crypto.randomUUID(),
        text: trimmedText,
        voiceId: selectedVoice,
        emotion: selectedEmotion,
        speed: selectedSpeed,
        pitch: selectedPitch,
        timestamp: Date.now(),
        audioBuffer
      };

      setHistory(prev => [newGen, ...prev]);
    } catch (err: any) {
      setError(err.message || "आवाज़ बनाने में विफल।");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async (e: React.MouseEvent, profile: VoiceProfile) => {
    e.stopPropagation(); // Don't trigger voice selection
    setError(null);

    // If already playing this one, stop it
    if (previewingVoiceId === profile.id && !isPreviewLoading) {
      stopPreview();
      return;
    }

    // Stop any existing preview
    stopPreview();

    setIsPreviewLoading(true);
    setPreviewingVoiceId(profile.id);

    try {
      const audioBuffer = await ttsService.generateSpeech(
        profile.previewText,
        profile,
        'Neutral',
        'Medium',
        'Medium'
      );

      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setPreviewingVoiceId(null);
        previewSourceRef.current = null;
      };

      source.start(0);
      previewSourceRef.current = source;
    } catch (err: any) {
      console.error("Preview failed", err);
      setError(`Preview failed: ${err.message || 'Unknown error'}`);
      setPreviewingVoiceId(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const stopPreview = () => {
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop();
        previewSourceRef.current.disconnect();
      } catch (e) {}
      previewSourceRef.current = null;
    }
    setPreviewingVoiceId(null);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // Memoize voice profiles list to prevent unnecessary re-renders
  const voiceProfilesList = useMemo(() => VOICE_PROFILES, []);

  // Animated Waveform Bars
  const WaveformBars = ({ className = "" }) => (
    <div className={`flex items-end gap-1 h-4 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 bg-current rounded-full animate-[waveform_1s_ease-in-out_infinite]"
          style={{ 
            animationDelay: `${i * 0.15}s`,
            height: `${20 + Math.random() * 80}%`
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-20 selection:bg-indigo-500/30">
      <style>{`
        @keyframes waveform {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Swar <span className="text-indigo-400 font-light">Hindi AI</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Studio Grade TTS</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full">24kHz PCM Audio</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Controls & Input */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
            {isGenerating && <div className="absolute inset-0 pointer-events-none animate-shimmer" />}
            
            <div className="flex items-center justify-between mb-3 px-1 relative z-10">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Hindi Input</label>
              <span className="text-[10px] font-mono text-slate-600">{inputText.length} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-36 bg-slate-950/50 border border-slate-800 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl p-4 text-slate-200 placeholder-slate-800 resize-none transition-all hindi-font text-lg leading-relaxed relative z-10"
              placeholder="यहाँ अपना हिंदी टेक्स्ट लिखें..."
            />
            
            <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
              {[
                { label: 'Emotion', value: selectedEmotion, setter: setSelectedEmotion, options: EMOTIONS },
                { label: 'Speed', value: selectedSpeed, setter: setSelectedSpeed, options: SPEEDS },
                { label: 'Pitch', value: selectedPitch, setter: setSelectedPitch, options: PITCHES }
              ].map((group) => (
                <div key={group.label} className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-black px-1">{group.label}</label>
                  <select 
                    value={group.value}
                    onChange={(e) => group.setter(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer hover:bg-slate-900 transition-colors"
                  >
                    {group.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !inputText.trim()}
              className={`w-full mt-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 relative z-10 overflow-hidden ${
                isGenerating 
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:scale-[0.97]'
              }`}
            >
              {isGenerating ? (
                <>
                  <WaveformBars className="text-indigo-400 mr-1" />
                  Processing Studio...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                  Generate Voice
                </>
              )}
            </button>
            {error && <p className="mt-4 text-[11px] font-bold text-rose-400 text-center bg-rose-500/5 py-2.5 rounded-xl border border-rose-500/10 relative z-10">{error}</p>}
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 px-3 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`}></span>
              History
            </h3>
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="bg-slate-900/10 border border-dashed border-slate-800/50 py-16 rounded-[2rem] flex flex-col items-center justify-center text-slate-700">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40">Empty Studio</p>
                </div>
              ) : (
                history.map(item => (
                  <HistoryItem key={item.id} item={item} onDelete={deleteHistoryItem} />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right: Voice Selection */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-2">Voice Profiles</h2>
          
          <div className="grid grid-cols-1 gap-3">
            {voiceProfilesList.map((profile) => (
              <div
                key={profile.id}
                onClick={() => setSelectedVoice(profile.id)}
                className={`text-left p-5 rounded-3xl border transition-all duration-300 relative group overflow-hidden cursor-pointer ${
                  selectedVoice === profile.id
                    ? 'bg-indigo-600/5 border-indigo-500/50 shadow-2xl shadow-indigo-500/5'
                    : 'bg-slate-900/30 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      selectedVoice === profile.id ? 'bg-indigo-600 text-white rotate-3 scale-110' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {profile.gender === 'Male' ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-100">{profile.name}</h4>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${
                        selectedVoice === profile.id ? 'text-indigo-400' : 'text-slate-600'
                      }`}>{profile.tagline}</p>
                    </div>
                  </div>

                  {/* Preview Button */}
                  <button
                    onClick={(e) => handlePreview(e, profile)}
                    disabled={isPreviewLoading && previewingVoiceId !== profile.id}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 min-w-[100px] ${
                      previewingVoiceId === profile.id
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {isPreviewLoading && previewingVoiceId === profile.id ? (
                      <div className="flex items-end gap-0.5 h-3">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-0.5 bg-indigo-400 rounded-full animate-[waveform_0.8s_ease-in-out_infinite]" style={{ animationDelay: `${i*0.1}s` }} />
                        ))}
                      </div>
                    ) : previewingVoiceId === profile.id ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {isPreviewLoading && previewingVoiceId === profile.id ? 'Loading' : previewingVoiceId === profile.id ? 'Stop' : 'Preview'}
                    </span>
                  </button>
                </div>
                <p className="mt-4 text-[13px] font-medium text-slate-400 leading-relaxed opacity-80">{profile.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
