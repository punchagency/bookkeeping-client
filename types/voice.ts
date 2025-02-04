export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  response: string;
  isPlaying: boolean;
}

export interface AIResponse {
  text: string;
  audioUrl?: string;
}
