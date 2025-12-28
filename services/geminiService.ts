
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceProfile, Emotion, Speed, Pitch } from "../types.ts";

// Global AudioContext with safe lazy initialization
let sharedAudioCtx: AudioContext | null = null;
export const getAudioCtx = () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return sharedAudioCtx;
};

export class TTSService {
  private getClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API कुंजी (API Key) नहीं मिली।");
    }
    return new GoogleGenAI({ apiKey });
  }

  private decodeBase64(base64: string): Uint8Array {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      throw new Error("ऑडियो डेटा डिकोडिंग में विफल रहा।");
    }
  }

  private async convertPcmToAudioBuffer(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const buffer = data.buffer;
    const byteOffset = data.byteOffset;
    const byteLength = data.byteLength;
    
    // Ensure memory alignment for Int16Array
    let dataInt16: Int16Array;
    if (byteOffset % 2 !== 0) {
      dataInt16 = new Int16Array(buffer.slice(byteOffset, byteOffset + byteLength));
    } else {
      dataInt16 = new Int16Array(buffer, byteOffset, byteLength / 2);
    }

    const frameCount = dataInt16.length / numChannels;
    const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    const normalizationFactor = 1.0 / 32768.0;
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] * normalizationFactor;
      }
    }
    return audioBuffer;
  }

  static bufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    let offset = 0;

    const writeString = (s: string) => {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(offset++, s.charCodeAt(i));
      }
    };

    writeString('RIFF');
    view.setUint32(offset, length - 8, true); offset += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, channels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * channels * 2, true); offset += 4;
    view.setUint16(offset, channels * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString('data');
    view.setUint32(offset, length - offset - 4, true); offset += 4;

    const normalizationFactor = 0x7FFF;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        let sample = buffer.getChannelData(channel)[i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * normalizationFactor, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  async generateSpeech(
    text: string,
    profile: VoiceProfile,
    emotion: Emotion,
    speed: Speed,
    pitch: Pitch
  ): Promise<AudioBuffer> {
    const ai = this.getClient();

    const emotionCues: Record<Emotion, string> = {
      Neutral: "neutral and balanced",
      Happy: "joyful and upbeat with a clear smile",
      Sad: "deeply melancholic, slow, and somber",
      Excited: "high energy, enthusiastic, and fast-paced",
      Calm: "whisper-soft, serene, and peaceful"
    };

    const speedVal = speed === 'Slow' ? 'slow' : speed === 'Fast' ? 'rapid' : 'standard';
    const pitchVal = pitch === 'Low' ? 'deep' : pitch === 'High' ? 'bright' : 'natural';

    const systemInstruction = `You are a professional Hindi Voice Artist.
Strict Rules:
1. ONLY Pure Indian Hindi. No English words (e.g., use 'सूचना' not 'information').
2. Neutral, high-quality Indian accent. No regional dialect or English-mixed accent.
3. Voice Character: ${profile.promptInstructions}.
4. Target Emotion: ${emotionCues[emotion]}.
5. Pacing: ${speedVal}.
6. Pitch: ${pitchVal}.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Generate pure Hindi audio for: ${text}` }] }],
        config: {
          systemInstruction,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: profile.baseVoice },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const base64Audio = audioPart?.inlineData?.data;
      
      if (!base64Audio) {
        throw new Error("मॉडल से कोई ऑडियो प्राप्त नहीं हुआ।");
      }

      const audioCtx = getAudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      const audioBytes = this.decodeBase64(base64Audio);
      return await this.convertPcmToAudioBuffer(audioBytes, audioCtx, 24000, 1);
    } catch (err: any) {
      console.error("Swar Generation Error:", err);
      throw new Error(err.message || "हिंदी आवाज़ बनाने में त्रुटि हुई।");
    }
  }
}
