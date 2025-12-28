
import React, { useState, useRef, useEffect } from 'react';
import { AudioGeneration } from '../types.ts';
import { VOICE_PROFILES } from '../constants.tsx';
import { TTSService, getAudioCtx } from '../services/geminiService.ts';

interface HistoryItemProps {
  item: AudioGeneration;
  onDelete: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const voice = VOICE_PROFILES.find(v => v.id === item.voiceId);

  // Sync gain node with volume state
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, getAudioCtx().currentTime, 0.05);
    }
  }, [volume]);

  const startPlayback = async () => {
    if (!item.audioBuffer) return;
    
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Stop existing if any
    stopPlayback();

    const source = ctx.createBufferSource();
    source.buffer = item.audioBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;
    gainNodeRef.current = gainNode;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.onended = () => {
      setIsPlaying(false);
      sourceNodeRef.current = null;
    };

    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch (e) {}
      gainNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const downloadAudio = () => {
    if (!item.audioBuffer) return;
    const wavBlob = TTSService.bufferToWav(item.audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swar_audio_${item.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 transition-all hover:bg-slate-800/60 hover:border-slate-600 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">{voice?.name}</span>
          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">{item.emotion}</span>
          <span className="text-[10px] text-slate-500 font-medium">{new Date(item.timestamp).toLocaleTimeString()}</span>
        </div>
        <p className="text-sm text-slate-300 truncate hindi-font leading-relaxed">{item.text}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-700/50 md:border-t-0">
        {/* Playback Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-full border border-slate-700/30">
          {!isPlaying ? (
            <button
              onClick={startPlayback}
              className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              title="Play"
            >
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
          ) : (
            <button
              onClick={stopPlayback}
              className="w-9 h-9 flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-all shadow-lg shadow-rose-600/20 active:scale-95 animate-pulse"
              title="Stop"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
          )}
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-full border border-slate-700/30">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 md:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto md:ml-0">
          <button
            onClick={downloadAudio}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all"
            title="Download Audio"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryItem;
