"use client";
import { useState, useCallback } from "react";
import { Mic } from "lucide-react";
import { Button } from "./ui/button";
import { VoiceRecorder } from "./ui/voice-recorder";
import { cn } from "@/lib/utils";
import { VoiceState } from "@/types/voice";
import { axiosInstance } from "@/app/config/axios";
import { toast } from "sonner";

export const VoiceCommandButton = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: "",
    response: "",
    isPlaying: false,
  });

  const handleTranscriptionComplete = useCallback(async (text: string) => {
    try {
      const response = await axiosInstance.post("/ai/chat", {
        message: text,
      });

      const aiResponse = response.data;

      setVoiceState((prev) => ({
        ...prev,
        response: aiResponse.text,
      }));

      if (aiResponse.audioUrl) {
        setVoiceState((prev) => ({ ...prev, isPlaying: true }));
        const audio = new Audio(aiResponse.audioUrl);
        audio.onended = () => {
          setVoiceState((prev) => ({ ...prev, isPlaying: false }));
        };
        await audio.play();
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      toast.error("Failed to process voice command");
    }
  }, []);

  const handleVoiceStateChange = useCallback(
    (newState: Partial<VoiceState>) => {
      setVoiceState((prev) => ({ ...prev, ...newState }));
    },
    []
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          voiceState.isListening || voiceState.isProcessing
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        )}
      />

      <VoiceRecorder
        voiceState={voiceState}
        onVoiceStateChange={handleVoiceStateChange}
      />

      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => handleVoiceStateChange({ isListening: true })}
        disabled={voiceState.isProcessing}
      >
        <Mic className="h-6 w-6" />
      </Button>
    </>
  );
};
