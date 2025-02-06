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

  const stopMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.enabled = false;
      });
    }
    setIsMuted(true);
    setSpeechStatus("stopped");
  }, []);

  const startMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.enabled = true;
      });
      setIsMuted(false);
      setSpeechStatus("listening");
      return true;
    }
    return false;
  }, []);

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

  const toggleMicrophone = useCallback(async () => {
    try {
      if (!isMuted) {
        stopMicrophone();
        return;
      }

      if (startMicrophone()) {
        return;
      }

      if (!hasPermission) {
        const permission = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setHasPermission(true);
        permission.getTracks().forEach((track) => track.stop());
      }

      await initializeWebRTC();
      setIsMuted(false);
      setSpeechStatus("listening");
    } catch (error) {
      console.error("Error toggling microphone:", error);
      toast.error("Failed to access microphone");
    }
  }, [hasPermission, isMuted, initializeWebRTC, startMicrophone]);

  const cancelRecording = useCallback(() => {
    // Stop all audio tracks and close connections
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }

    stopMicrophone();
    onVoiceStateChange({
      transcript: "",
      isProcessing: false,
      response: "",
      isListening: false,
    });
  }, [onVoiceStateChange, stopMicrophone]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 transition-all duration-300 z-50",
        voiceState.isListening ||
          voiceState.isProcessing ||
          speechStatus === "connecting"
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {speechStatus === "connecting" && (
          <div className="bg-background/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border/50 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Connecting...
            </p>
          </div>
        )}

        {speechStatus === "listening" && !isMuted && (
          <div className="bg-background/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-border/50 max-w-md">
            <VoiceVisualizer isListening={voiceState.isListening} />
          </div>
        )}

        {voiceState.transcript && (
          <div className="bg-background/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-border/50 max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-medium text-muted-foreground">
                {speechStatus === "idle" && "Ready"}
                {speechStatus === "connecting" && "Connecting"}
                {speechStatus === "listening" && "Listening"}
                {speechStatus === "processing" && "Processing"}
                {speechStatus === "stopped" && "Stopped"}
              </p>
            </div>
            <p className="text-base leading-relaxed">
              {voiceState.transcript || "Waiting for speech..."}
            </p>
          </div>
        )}

        <div className="bg-background/95 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg border border-border/50 flex items-center gap-6">
          <Button
            variant="secondary"
            size="lg"
            className="h-10 w-10 rounded-full"
            onClick={toggleMicrophone}
            disabled={voiceState.isProcessing || speechStatus === "connecting"}
          >
            {voiceState.isProcessing || speechStatus === "connecting" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="h-10 w-10 rounded-full"
            onClick={cancelRecording}
            disabled={voiceState.isProcessing}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
