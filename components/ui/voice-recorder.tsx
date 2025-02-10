/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./button";
import { Mic, MicOff, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceState } from "@/types/voice";
import { toast } from "sonner";
import { axiosInstance } from "@/app/config/axios";
import { VoiceVisualizer } from "./voice-visualizer";
import { AIChatWindow } from "@/components/ai-chat-window";

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
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "ai";
      content: string;
      timestamp: Date;
    }>
  >([]);

  const [recognition, setRecognition] = useState<any>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join("");

        const isFinal = event.results[event.results.length - 1].isFinal;

        if (isFinal) {
          // Update messages for the chat window
          setMessages((prev) => [
            ...prev,
            {
              role: "user",
              content: transcript,
              timestamp: new Date(),
            },
          ]);

          // Update voice state to show the transcript
          onVoiceStateChange({
            transcript: transcript,
            isProcessing: true,
          });
        } else {
          // Update voice state with interim results
          onVoiceStateChange({
            transcript: transcript,
            isProcessing: false,
          });
        }
      };

      recognition.onstart = () => {
        console.log("Speech recognition started");
        setSpeechStatus("listening");
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setSpeechStatus("stopped");
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        setSpeechStatus("stopped");
      };

      setRecognition(recognition);
    }
  }, [onVoiceStateChange]);
  useEffect(() => {
    console.log("Current messages state:", messages);
  }, [messages]);

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

      const pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });
      peerConnectionRef.current = pc;

      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioEl.volume = 1.0;
      audioElementRef.current = audioEl;

      pc.ontrack = (e) => {
        //console.log("Received audio track", e.streams[0]);
        audioEl.srcObject = e.streams[0];
        audioEl.play().catch((e) => console.error("Audio playback error:", e));
      };

      const ms = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);

      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.addEventListener("message", (e) => {
        if (e.data) {
          try {
            const response = JSON.parse(e.data);

            switch (response.type) {
              case "response.audio_transcript.done":
                if (response.transcript) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "ai",
                      content: response.transcript,
                      timestamp: new Date(),
                    },
                  ]);

                  onVoiceStateChange({
                    isProcessing: false,
                    response: response.transcript,
                  });
                }

                break;

              default:
                console.log(response);
                console.log("Unhandled response type:", response.type);
            }
          } catch (error) {
            console.error("Error parsing AI response:", error);
            toast.error("Error processing AI response");
          }
        }
      });

      pc.oniceconnectionstatechange = () => {
        // console.log("ICE Connection State:", pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        // console.log("Connection State:", pc.connectionState);
      };

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
        if (recognition) {
          recognition.stop();
        }
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
      if (recognition) {
        recognition.start();
      }
      setIsMuted(false);
      setSpeechStatus("listening");
    } catch (error) {
      console.error("Error toggling microphone:", error);
      toast.error("Failed to access microphone");
    }
  }, [hasPermission, isMuted, initializeWebRTC, recognition]);

  const cancelRecording = useCallback(() => {
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
    <>
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
              disabled={
                voiceState.isProcessing || speechStatus === "connecting"
              }
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

      <div className="relative">
        <AIChatWindow messages={messages} />
      </div>
    </>
  );
};
