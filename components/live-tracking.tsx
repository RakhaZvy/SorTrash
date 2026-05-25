"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CLASS_COLORS: Record<string, string> = {
  plastic: "#3b82f6",
  metal: "#6b7280",
  paper: "#f59e0b",
  glass: "#10b981",
  cardboard: "#8b5cf6",
  organic: "#22c55e",
  trash: "#ef4444",
  "paper & cardboard": "#f59e0b",
};

function getColor(cls: string) {
  return CLASS_COLORS[cls.toLowerCase()] ?? "#f97316";
}

interface Detection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
}

const FRAME_INTERVAL_MS = 100; // ~10 fps

export function LiveTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameAt = useRef<number>(0);
  const isRunningRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const fpsFrames = useRef(0);
  const fpsTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const drawOverlay = useCallback((dets: Detection[], videoW: number, videoH: number) => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = videoW;
    canvas.height = videoH;
    ctx.clearRect(0, 0, videoW, videoH);

    for (const det of dets) {
      const [x1, y1, x2, y2] = det.bbox;
      const color = getColor(det.class);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = "bold 14px sans-serif";
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(x1, y1 - 20, tw + 8, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x1 + 4, y1 - 5);
    }
  }, []);

  const sendFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const offscreen = document.createElement("canvas");
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    offscreen.getContext("2d")?.drawImage(video, 0, 0);
    const base64 = offscreen.toDataURL("image/jpeg", 0.7).split(",")[1];

    try {
      const res = await fetch(`${API_URL}/classify-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: base64 }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const dets: Detection[] = data.detections ?? [];
      setDetections(dets);
      drawOverlay(dets, video.videoWidth, video.videoHeight);
      fpsFrames.current += 1;
    } catch {
      // skip frame on network error
    }
  }, [drawOverlay]);

  const loop = useCallback(
    (timestamp: number) => {
      if (!isRunningRef.current) return;
      if (timestamp - lastFrameAt.current >= FRAME_INTERVAL_MS) {
        lastFrameAt.current = timestamp;
        sendFrame();
      }
      rafRef.current = requestAnimationFrame(loop);
    },
    [sendFrame]
  );

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      isRunningRef.current = true;
      setRunning(true);
      fpsFrames.current = 0;
      fpsTimer.current = setInterval(() => {
        setFps(fpsFrames.current);
        fpsFrames.current = 0;
      }, 1000);
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setError("Could not access camera. Check browser permissions.");
    }
  }, [loop]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (fpsTimer.current) clearInterval(fpsTimer.current);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = overlayRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setRunning(false);
    setDetections([]);
    setFps(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: "none" }}
            />
            {running && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
            )}
            {running && (
              <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs">
                {fps} fps
              </div>
            )}
            {!running && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="w-16 h-16 text-white/30" />
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            {!running ? (
              <Button size="lg" onClick={start}>
                <Video className="w-4 h-4 mr-2" />
                Start Live Detection
              </Button>
            ) : (
              <Button size="lg" variant="destructive" onClick={stop}>
                <VideoOff className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>
      </Card>

      {detections.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Detected items</h3>
          <div className="space-y-2">
            {detections.map((det, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
              >
                <span className="font-medium">{det.class}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${det.confidence * 100}%`,
                        backgroundColor: getColor(det.class),
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {(det.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {running && detections.length === 0 && (
        <Card className="p-6 bg-muted/50 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Point the camera at a waste item to detect it.
          </p>
        </Card>
      )}
    </div>
  );
}
