"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./button";
import { Mic, MicOff, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceState } from "@/types/voice";
import { toast } from "sonner";
import { axiosInstance } from "@/app/config/axios";
import { VoiceVisualizer } from "./voice-visualizer";

interface VoiceRecorderProps {
  voiceState: VoiceState;
  onVoiceStateChange: (state: Partial<VoiceState>) => void;
}

export const VoiceRecorder = ({
  voiceState,
  onVoiceStateChange,
}: VoiceRecorderProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<
    "idle" | "connecting" | "listening" | "processing" | "stopped"
  >("idle");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const initializeWebRTC = async () => {
    try {
      setSpeechStatus("connecting");
      const response = await axiosInstance.post("/ai/session");
      const EPHEMERAL_KEY = response.data.data.client_secret.value;

      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.addEventListener("message", (e) => {
        console.log("Received message from OpenAI:", e.data);
        if (e.data) {
          try {
            const response = JSON.parse(e.data);
            console.log("Parsed response:", response);

            if (response.type === "speech") {
              onVoiceStateChange({
                transcript: response.text,
                isProcessing: false,
                response: response.content || response.text,
              });
            } else if (
              response.type === "function_call" &&
              response.function === "analyze_transactions"
            ) {
              console.log("Transaction analysis:", response.arguments);
            }
          } catch (error) {
            console.error("Error parsing AI response:", error);
            toast.error("Error processing AI response");
          }
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };

      await pc.setRemoteDescription(answer as RTCSessionDescriptionInit);

      setSpeechStatus("listening");
      setIsMuted(false);
      onVoiceStateChange({ isListening: true });
      toast.success("Voice service connected!");
    } catch (error) {
      console.error("Error initializing WebRTC:", error);
      toast.error("Failed to connect to voice service. Please try again.");
      setSpeechStatus("idle");
      setIsMuted(true);
      onVoiceStateChange({ isListening: false });
    }
  };

  const stopWebRTC = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
    }
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }

    setSpeechStatus("stopped");
    setIsMuted(true);
    onVoiceStateChange({ isListening: false });
  };

  const toggleMicrophone = useCallback(async () => {
    if (!hasPermission) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
      } catch (error) {
        console.error("Error getting microphone permission:", error);
        toast.error("Please allow microphone access to use voice commands");
        return;
      }
    }

    if (isMuted) {
      await initializeWebRTC();
    } else {
      stopWebRTC();
    }
  }, [hasPermission, isMuted, onVoiceStateChange]);

  const cancelRecording = useCallback(() => {
    stopWebRTC();
    onVoiceStateChange({
      isListening: false,
      transcript: "",
      response: "",
      isProcessing: false,
    });
  }, [onVoiceStateChange]);

  useEffect(() => {
    return () => {
      stopWebRTC();
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-24 left-0 right-0 flex flex-col items-center gap-4 p-4 transition-all duration-300",
        voiceState.isListening ||
          voiceState.isProcessing ||
          speechStatus === "connecting"
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-full pointer-events-none"
      )}
    >
      {speechStatus === "connecting" && (
        <div className="w-full flex justify-center items-center gap-2 mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Connecting to voice service...
          </p>
        </div>
      )}

      {speechStatus === "listening" && !isMuted && (
        <div className="w-full mb-4">
          <VoiceVisualizer isListening={voiceState.isListening} />
        </div>
      )}

      {voiceState.transcript && (
        <div className="bg-background/95 backdrop-blur-md p-6 rounded-xl shadow-xl max-w-2xl w-full border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-medium text-muted-foreground">
              {speechStatus === "idle" && "Ready to listen"}
              {speechStatus === "connecting" && "Connecting..."}
              {speechStatus === "listening" && "Listening..."}
              {speechStatus === "processing" && "Processing..."}
              {speechStatus === "stopped" && "Stopped"}
            </p>
          </div>
          <p className="text-lg leading-relaxed">
            {voiceState.transcript || "Waiting for speech..."}
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
          disabled={voiceState.isProcessing || speechStatus === "connecting"}
        >
          {voiceState.isProcessing || speechStatus === "connecting" ? (
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
