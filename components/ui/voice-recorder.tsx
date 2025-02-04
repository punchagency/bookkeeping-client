/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./button";
import { Mic, MicOff, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceState } from "@/types/voice";
import { toast } from "sonner";
import { VoiceVisualizer } from "./voice-visualizer";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => Promise<void>;
  voiceState: VoiceState;
  onVoiceStateChange: (state: Partial<VoiceState>) => void;
}

export const VoiceRecorder = ({
  onTranscriptionComplete,
  voiceState,
  onVoiceStateChange,
}: VoiceRecorderProps) => {
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [completeTranscript, setCompleteTranscript] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<
    "idle" | "listening" | "processing" | "stopped"
  >("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = "en-US";

        recog.onstart = () => {
          console.log("Speech recognition started");
          onVoiceStateChange({ isListening: true });
          setIsMuted(false);
          setCompleteTranscript("");
          setSpeechStatus("idle");
        };

        recog.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
              console.log("Final transcript:", finalTranscript);
              setCompleteTranscript((prev) => prev + " " + finalTranscript);
            } else {
              interimTranscript += transcript;
              console.log("Interim transcript:", interimTranscript);
            }
          }

          setInterimTranscript(interimTranscript);
          if (finalTranscript) {
            console.log("Sending final transcript:", finalTranscript);
            onVoiceStateChange({ transcript: finalTranscript });
          }
        };

        recog.onaudiostart = () => {
          console.log("Audio capturing started");
          setSpeechStatus("idle");
        };

        recog.onspeechstart = () => {
          console.log("Speech started");
          setSpeechStatus("listening");
        };

        recog.onspeechend = () => {
          console.log("Speech ended");
          setSpeechStatus("stopped");
          setTimeout(() => {
            console.log("Complete conversation:", completeTranscript.trim());
          }, 1000);
        };

        recog.onend = async () => {
          console.log("Speech recognition ended");
          if (voiceState.transcript) {
            console.log(
              "Final complete transcript:",
              completeTranscript.trim()
            );
            onVoiceStateChange({ isProcessing: true });
            setSpeechStatus("processing");
            await onTranscriptionComplete(completeTranscript.trim());
            onVoiceStateChange({ isProcessing: false, transcript: "" });
          }
          onVoiceStateChange({ isListening: false });
          setIsMuted(true);
          setCompleteTranscript("");
          setSpeechStatus("idle");
        };

        recog.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            toast.error("Microphone access denied");
          } else {
            toast.error(`Speech recognition error: ${event.error}`);
          }
          cancelRecording();
        };

        recognitionRef.current = recog;
      } else {
        toast.error("Speech recognition is not supported in your browser");
      }
    }
  }, [onVoiceStateChange]);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error("Error getting microphone permission:", error);
      toast.error("Please allow microphone access to use voice commands");
      return false;
    }
  };

  const toggleMicrophone = useCallback(async () => {
    console.log("toggleMicrophone called", {
      hasPermission,
      isListening: voiceState.isListening,
      recognition: recognitionRef.current,
    });

    if (!hasPermission) {
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) return;
      setHasPermission(true);
    }

    if (isMuted) {
      try {
        console.log("Attempting to start recognition");
        recognitionRef.current?.start();
        console.log("Starting speech recognition...");
      } catch (error) {
        console.error("Error starting recognition:", error);
        toast.error("Error starting voice recognition");
      }
    } else {
      try {
        recognitionRef.current?.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
      setIsMuted(!isMuted);
    }
  }, [hasPermission, voiceState.isListening, isMuted]);

  const cancelRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
      setInterimTranscript("");
      onVoiceStateChange({
        isListening: false,
        transcript: "",
        response: "",
        isProcessing: false,
      });
      setIsMuted(true);
      setHasPermission(false);
    }
  }, [onVoiceStateChange]);

  return (
    <div
      className={cn(
        "fixed bottom-24 left-0 right-0 flex flex-col items-center gap-4 p-4 transition-all duration-300",
        voiceState.isListening || voiceState.isProcessing
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-full pointer-events-none"
      )}
    >
      {voiceState.isListening && !isMuted && (
        <div className="w-full mb-4">
          <VoiceVisualizer isListening={voiceState.isListening} />
        </div>
      )}

      {(voiceState.transcript || interimTranscript) && (
        <div className="bg-background/95 backdrop-blur-md p-6 rounded-xl shadow-xl max-w-2xl w-full border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-medium text-muted-foreground">
              {speechStatus === "idle" && "Ready to listen"}
              {speechStatus === "listening" && "Listening..."}
              {speechStatus === "processing" && "Processing..."}
              {speechStatus === "stopped" && "Stopped"}
            </p>
          </div>
          <p className="text-lg leading-relaxed">
            {voiceState.transcript ||
              interimTranscript ||
              "Waiting for speech..."}
          </p>
          <div className="mt-2 flex justify-end">
            <p className="text-xs text-muted-foreground italic">
              Speak clearly into your microphone
            </p>
          </div>
        </div>
      )}

      {voiceState.response && (
        <div className="bg-primary/5 p-6 rounded-xl shadow-xl max-w-2xl w-full border border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-medium text-primary">AI Response</p>
          </div>
          <p className="text-lg leading-relaxed">{voiceState.response}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          variant="secondary"
          size="lg"
          className="h-16 w-16 rounded-full shadow-lg"
          onClick={toggleMicrophone}
          disabled={voiceState.isProcessing}
        >
          {voiceState.isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="h-16 w-16 rounded-full shadow-lg"
          onClick={cancelRecording}
          disabled={voiceState.isProcessing}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
