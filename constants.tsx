
import { VoiceProfile } from './types.ts';

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'Male1',
    name: 'Vikram',
    gender: 'Male',
    tagline: 'Deep & Authoritative',
    description: 'A deep, rich, bass-heavy voice. Mature and commanding. Best for audiobooks and documentaries.',
    baseVoice: 'Charon',
    promptInstructions: 'Deep, rich, bass-heavy male voice. Mature, confident, and commanding presence. Like a veteran narrator.',
    previewText: 'नमस्ते, मैं विक्रम हूँ। मेरी आवाज़ गहरी और प्रभावशाली है।'
  },
  {
    id: 'Male2',
    name: 'Arjun',
    gender: 'Male',
    tagline: 'Smooth & Friendly',
    description: 'Warm, pleasant, and approachable. Ideal for storytelling, YouTube, and educational content.',
    baseVoice: 'Puck',
    promptInstructions: 'Smooth, warm, friendly male voice. Calm and approachable personality. Natural storytelling balance.',
    previewText: 'नमस्ते, मैं अर्जुन हूँ। मैं कहानियाँ सुनाना पसंद करता हूँ।'
  },
  {
    id: 'Male3',
    name: 'Ishaan',
    gender: 'Male',
    tagline: 'Powerful & Energetic',
    description: 'Strong, energetic, and bold. Perfect for advertisements, promos, and reels.',
    baseVoice: 'Fenrir',
    promptInstructions: 'Strong, energetic male voice. Bold, clear, and impactful without being harsh. High clarity and energy.',
    previewText: 'नमस्कार! मैं ईशान हूँ। मेरी आवाज़ में बहुत जोश और शक्ति है।'
  },
  {
    id: 'Female1',
    name: 'Ananya',
    gender: 'Female',
    tagline: 'Sweet & Calm',
    description: 'Soothing, gentle, and warm tone. Best for meditation, kids content, and soft storytelling.',
    baseVoice: 'Kore',
    promptInstructions: 'Sweet, soothing female voice. Soft, warm, and emotionally gentle tone. Natural feminine softness.',
    previewText: 'नमस्ते, मैं अनन्या हूँ। मेरी आवाज़ बहुत शांत और मीठी है।'
  },
  {
    id: 'Female2',
    name: 'Meera',
    gender: 'Female',
    tagline: 'Professional & Confident',
    description: 'Clear, authoritative newsroom-style. Perfect for news, corporate explainers, and education.',
    baseVoice: 'Zephyr',
    promptInstructions: 'Confident, professional female voice. Clear, strong newsroom-style delivery with balanced articulation.',
    previewText: 'नमस्कार, मैं मीरा हूँ। मैं पेशेवर और स्पष्ट जानकारी देने में सक्षम हूँ।'
  },
  {
    id: 'Female3',
    name: 'Sia',
    gender: 'Female',
    tagline: 'Emotional & Expressive',
    description: 'Highly dynamic and expressive. Capable of intense emotional variation for drama and films.',
    baseVoice: 'Zephyr',
    promptInstructions: 'Highly expressive and emotional female voice. Capable of conveying extreme happiness or deep sadness naturally.',
    previewText: 'नमस्ते, मैं सिया हूँ। मैं भावनाओं को बहुत गहराई से व्यक्त करती हूँ।'
  }
];

export const EMOTIONS = ['Neutral', 'Happy', 'Sad', 'Excited', 'Calm'] as const;
export const SPEEDS = ['Slow', 'Medium', 'Fast'] as const;
export const PITCHES = ['Low', 'Medium', 'High'] as const;
