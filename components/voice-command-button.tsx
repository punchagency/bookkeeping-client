"use client";
import { useState, useCallback } from "react";
import { Mic } from "lucide-react";
import { Button } from "./ui/button";
import { VoiceRecorder } from "./ui/voice-recorder";
import { cn } from "@/lib/utils";
import { VoiceState } from "@/types/voice";
export const VoiceCommandButton = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: "",
    response: "",
    isPlaying: false,
  });

  const handleVoiceStateChange = useCallback(
    (newState: Partial<VoiceState>) => {
      setVoiceState((prev) => ({ ...prev, ...newState }));
    },
    []
  );

  return (
    <>
      <VoiceRecorder
        voiceState={voiceState}
        onVoiceStateChange={handleVoiceStateChange}
      />

      <Button
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          voiceState.isListening || voiceState.isProcessing
            ? "opacity-0 pointer-events-none translate-y-10"
            : "opacity-100 translate-y-0"
        )}
        onClick={() => handleVoiceStateChange({ isListening: true })}
        disabled={voiceState.isProcessing}
      >
        <Mic className="h-6 w-6" />
      </Button>
    </>
  );
};
