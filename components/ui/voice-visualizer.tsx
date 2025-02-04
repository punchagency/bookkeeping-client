"use client";
import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
  isListening: boolean;
}

export const VoiceVisualizer = ({ isListening }: VoiceVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  let phase = 0;

  useEffect(() => {
    let cleanup = () => {};

    const setupVisualizer = async () => {
      if (!isListening) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.2;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let animationFrameId: number;

        const draw = () => {
          animationFrameId = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const width = canvas.width;
          const height = canvas.height;
          const centerY = height / 2;

          const averageAmplitude =
            dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

          const amplitude = (averageAmplitude / 255) * height;

          ctx.beginPath();
          ctx.moveTo(0, centerY);

          for (let x = 0; x < width; x++) {
            const y =
              centerY +
              amplitude * Math.sin((x / width) * 2 * Math.PI * 4 + phase);
            ctx.lineTo(x, y);
          }

          ctx.strokeStyle = "hsl(221, 83%, 53%)";
          ctx.lineWidth = 2;
          ctx.stroke();

          phase += 0.05;
        };

        draw();

        cleanup = () => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          audioContext.close();
          stream.getTracks().forEach((track) => track.stop());
        };
      } catch (error) {
        console.error("Error setting up visualizer:", error);
      }
    };

    setupVisualizer();

    return () => cleanup();
  }, [isListening]);

  return (
    <div className="w-full max-w-2xl mx-auto h-40">
      <canvas ref={canvasRef} className="w-full h-full rounded-md" />
    </div>
  );
};
