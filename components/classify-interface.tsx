"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { ClassificationResult } from "./classification-result";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiDetection {
  class: string;
  confidence: number;
}

interface ClassifyResult {
  category: string;
  confidence: number;
  color: string;
}

interface ClassificationState {
  primaryCategory: string;
  confidence: number;
  allResults: ClassifyResult[];
  disposalTip: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  plastic: "text-chart-1",
  metal: "text-chart-2",
  paper: "text-chart-3",
  glass: "text-chart-4",
  cardboard: "text-chart-5",
  organic: "text-green-500",
  trash: "text-red-500",
  battery: "text-yellow-500",
};

const DISPOSAL_TIPS: Record<string, string> = {
  plastic: "Rinse the plastic container before recycling to avoid contamination.",
  organic: "Compost this organic waste to create nutrient-rich soil for plants.",
  paper: "Keep paper dry and clean for better recycling quality.",
  metal: "Remove any non-metal parts before recycling metal items.",
  glass: "Rinse glass containers and remove lids before placing in recycling.",
  cardboard: "Flatten cardboard boxes to save space and keep them dry for recycling.",
  battery: "Take batteries to designated collection points. Never throw in regular trash.",
  trash: "This may be general waste. Check local guidelines for proper disposal.",
};

function getDisposalTip(category: string) {
  return (
    DISPOSAL_TIPS[category.toLowerCase()] ||
    "Dispose according to local waste management guidelines."
  );
}

export function ClassifyInterface() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClassificationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const classifyDataUrl = useCallback(async (dataUrl: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const blob = await fetch(dataUrl).then((r) => r.blob());
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      const res = await fetch(`${API_URL}/classify`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      if (!data.detections || data.detections.length === 0) {
        setError("No waste detected in the image. Try a clearer photo.");
        return;
      }

      const allResults = data.detections.map((det: ApiDetection) => ({
        category: det.class,
        confidence: det.confidence,
        color: CATEGORY_COLORS[det.class.toLowerCase()] ?? "text-chart-1",
      }));

      const primary = allResults.reduce((best: ClassifyResult, cur: ClassifyResult) =>
        cur.confidence > best.confidence ? cur : best
      );

      setResult({
        primaryCategory: primary.category,
        confidence: primary.confidence,
        allResults,
        disposalTip: getDisposalTip(primary.category),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to classify. Check that the backend is running.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStartCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setError("Could not access camera. Check browser permissions.");
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    stopCamera();
    setSelectedImage(dataUrl);
    setResult(null);
    classifyDataUrl(dataUrl);
  };

  const handleReset = () => {
    stopCamera();
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <Card className="p-8">
        {isCameraActive ? (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button size="lg" onClick={handleCapture}>
                <Camera className="w-4 h-4 mr-2" />
                Capture &amp; Classify
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Position the waste item in frame and click capture.
            </p>
          </div>
        ) : !selectedImage ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Upload or capture an image</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-3">
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <Button variant="outline" onClick={handleStartCamera}>
                  <Camera className="w-4 h-4 mr-2" />
                  Use Camera
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <Image
                src={selectedImage}
                alt="Selected waste"
                fill
                className="object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleReset}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            {!result && (
              <Button
                className="w-full"
                size="lg"
                onClick={() => classifyDataUrl(selectedImage)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Classify Waste"
                )}
              </Button>
            )}
          </div>
        )}
      </Card>

      {result && <ClassificationResult result={result} onReset={handleReset} />}
    </div>
  );
}
