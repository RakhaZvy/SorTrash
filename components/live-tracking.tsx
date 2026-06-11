"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Ganti dictionary warna mentah dengan Mapper Presentasi Lengkap
const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  "Papel_y_carton": { label: "Paper & Cardboard", color: "#f59e0b" },
  "Paper": { label: "Paper", color: "#f59e0b" },
  "paper & cardboard": { label: "Paper & Cardboard", color: "#f59e0b" },
  "Plastic": { label: "Plastic", color: "#3b82f6" },
  "Plastico": { label: "Plastic", color: "#3b82f6" },
  "plastic": { label: "Plastic", color: "#3b82f6" },
  "Organic": { label: "Organic", color: "#22c55e" },
  "Organico": { label: "Organic", color: "#22c55e" },
  "organic": { label: "Organic", color: "#22c55e" },
  "Metal": { label: "Metal", color: "#6b7280" },
  "metal": { label: "Metal", color: "#6b7280" },
  "Glass": { label: "Glass", color: "#10b981" },
  "glass": { label: "Glass", color: "#10b981" },
  "Trash": { label: "Trash", color: "#ef4444" },
  "trash": { label: "Trash", color: "#ef4444" },
  "Cardboard": { label: "Cardboard", color: "#8b5cf6" },
  "cardboard": { label: "Cardboard", color: "#8b5cf6" },
};

// Fungsi helper untuk menerjemahkan class mentah ke format UI
function getCategoryDisplay(rawClass: string) {
  // Coba cari exact match dulu (case-sensitive)
  if (CATEGORY_MAP[rawClass]) return CATEGORY_MAP[rawClass];
  
  // Coba cari lowercase match
  const lowerMatch = CATEGORY_MAP[rawClass.toLowerCase()];
  if (lowerMatch) return lowerMatch;

  // Fallback rasional jika backend mengirim kategori tak terduga
  const cleanLabel = rawClass
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.
