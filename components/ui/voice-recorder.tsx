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
import { AIChatWindow } from "../ai-chat-window";

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

  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "ai";
      content: string;
      timestamp: Date;
    }>
  >([]);

  const recognitionRef = useRef<any>(null);
  const [currentAIMessage, setCurrentAIMessage] = useState("");

  const saveConversationToDb = async () => {
    console.log("Saving conversation to DB. Current messages:", messages);

    if (!messages.length) {
      toast.error("No messages to save");
      return;
    }

    try {
      const response = await axiosInstance.post("/conversations", {
        messages,
      });

      if (response.status === 201) {
        toast.success("Conversation saved successfully");
      }

      console.log("API Response:", response);
    } catch (error) {
      toast.error("Error saving conversation to db");
      console.error("Error saving conversation to db:", error);
    }
  };

  const startSpeechRecognition = useCallback(() => {
    console.log("Starting speech recognition");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        console.log("Speech recognition started");
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.enabled = false;
      });
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        // Prevent auto-restart by removing the onend handler temporarily
        const originalOnEnd = recognitionRef.current.onend;
        recognitionRef.current.onend = () => {
          console.log("Speech recognition stopped by user");
          // Restore the original onend handler for next time
          recognitionRef.current.onend = originalOnEnd;
        };
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
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
      startSpeechRecognition();
      return true;
    }
    return false;
  }, [startSpeechRecognition]);

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
        if (e.data) {
          try {
            const response = JSON.parse(e.data);

            switch (response.type) {
              case "response.audio_transcript.done":
                if (response.transcript) {
                  setCurrentAIMessage(response.transcript);
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
      startSpeechRecognition();
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
        onVoiceStateChange({ isProcessing: false });
        return;
      }

      if (startMicrophone()) {
        onVoiceStateChange({ isListening: true });
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
      onVoiceStateChange({ isListening: true });
    } catch (error) {
      console.error("Error toggling microphone:", error);
      toast.error("Failed to access microphone");
    }
  }, [
    hasPermission,
    isMuted,
    initializeWebRTC,
    startMicrophone,
    onVoiceStateChange,
  ]);

  const cancelRecording = useCallback(() => {
    console.log("Canceling recording. Messages before save:", messages);

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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }

    stopMicrophone();
    setIsMuted(true);
    setSpeechStatus("idle");
    onVoiceStateChange({
      transcript: "",
      isProcessing: false,
      response: "",
      isListening: false,
    });

    // Save conversation after state updates if there are messages
    if (messages.length > 0) {
      setTimeout(async () => {
        console.log("Messages right before saving:", messages);
        await saveConversationToDb();
        // Clear messages after saving
        setMessages([]);
      }, 0);
    } else {
      // If no messages, just clear the state
      setMessages([]);
    }
  }, [messages, onVoiceStateChange, stopMicrophone]);

  useEffect(() => {
    console.log("Setting up speech recognition");
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition service has started");
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition service disconnected");
        if (!isMuted) {
          console.log("Restarting speech recognition");
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (error) {
              console.error("Error restarting speech recognition:", error);
            }
          }, 100);
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        console.log("Speech recognition result received");
        const currentTranscript =
          event.results[event.results.length - 1][0].transcript;

        if (event.results[event.results.length - 1].isFinal) {
          // Only filter out if it's a very close match to the AI's speech
          const normalizedTranscript = currentTranscript.toLowerCase().trim();
          const normalizedAIMessage = currentAIMessage.toLowerCase().trim();

          // Calculate similarity ratio (how much of one string matches the other)
          const similarity = (str1: string, str2: string) => {
            const longer = str1.length > str2.length ? str1 : str2;
            const shorter = str1.length > str2.length ? str2 : str1;
            return longer.includes(shorter)
              ? shorter.length / longer.length
              : 0;
          };

          const similarityRatio = similarity(
            normalizedTranscript,
            normalizedAIMessage
          );

          // Only filter out if it's a very close match (90% or more similar)
          if (similarityRatio > 0.9) {
            console.log("Filtered out AI speech echo:", currentTranscript);
            return;
          }

          console.log("Final transcript:", currentTranscript);
          if (currentTranscript.trim()) {
            setMessages((prev) => {
              const newMessage = {
                role: "user" as const,
                content: currentTranscript.trim(),
                timestamp: new Date(),
              };

              if (!prev.length || prev[prev.length - 1].role === "ai") {
                return [...prev, newMessage];
              }

              return [...prev.slice(0, -1), newMessage];
            });

            onVoiceStateChange({
              transcript: currentTranscript,
              isProcessing: true,
            });
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast.error(`Speech recognition error: ${event.error}`);

        setSpeechStatus("idle");
        setIsMuted(true);
      };
    } else {
      toast.error("Speech recognition not supported in this browser");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping speech recognition:", error);
        }
      }
    };
  }, [isMuted, onVoiceStateChange]);

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

          <div className="bg-background/95 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg border border-border/50 flex items-center gap-6">
            <Button
              variant="secondary"
              size="lg"
              className="h-10 w-10 rounded-full"
              onClick={toggleMicrophone}
              disabled={speechStatus === "connecting"}
            >
              {speechStatus === "connecting" ? (
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
