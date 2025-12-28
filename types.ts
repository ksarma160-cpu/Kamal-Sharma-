
export type VoiceId = 'Male1' | 'Male2' | 'Male3' | 'Female1' | 'Female2' | 'Female3';

export type Emotion = 'Neutral' | 'Happy' | 'Sad' | 'Excited' | 'Calm';
export type Speed = 'Slow' | 'Medium' | 'Fast';
export type Pitch = 'Low' | 'Medium' | 'High';

export interface VoiceProfile {
  id: VoiceId;
  name: string;
  description: string;
  tagline: string;
  gender: 'Male' | 'Female';
  baseVoice: 'Charon' | 'Puck' | 'Fenrir' | 'Kore' | 'Zephyr';
  promptInstructions: string;
  previewText: string;
}

export interface AudioGeneration {
  id: string;
  text: string;
  voiceId: VoiceId;
  emotion: Emotion;
  speed: Speed;
  pitch: Pitch;
  timestamp: number;
  audioBuffer: AudioBuffer | null;
}
