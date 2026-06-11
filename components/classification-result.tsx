"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw, Info } from "lucide-react";

interface ClassificationResultProps {
  result: {
    primaryCategory: string;
    confidence: number;
    allResults: Array<{
      category: string;
      confidence: number;
      color: string;
    }>;
    disposalTip: string;
  };
  onReset: () => void;
}

// 1. Buat Mapper Terpusat
// Petakan raw string dari backend ke Label UI yang rapi dan ikonnya
const categoryMapper: Record<string, { label: string; icon: string }> = {
  "Papel_y_carton": { label: "Paper & Cardboard", icon: "📄" },
  "Paper": { label: "Paper", icon: "📄" },
  "Plastic": { label: "Plastic", icon: "♻️" },
  "Plastico": { label: "Plastic", icon: "♻️" },
  "Organic": { label: "Organic", icon: "🌿" },
  "Organico": { label: "Organic", icon: "🌿" },
  "Metal": { label: "Metal", icon: "🔩" },
};

// 2. Fungsi helper untuk memproses kategori mentah
const getCategoryDisplay = (rawCategory: string) => {
  if (categoryMapper[rawCategory]) {
    return categoryMapper[rawCategory];
  }
  // Fallback rasional jika backend mengirim kategori tak terduga:
  // Hilangkan underscore dan jadikan Title Case, beri ikon default
  const cleanLabel = rawCategory
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  return { label: cleanLabel, icon: "🗑️" };
};

export function ClassificationResult({
  result,
  onReset,
}: ClassificationResultProps) {
  // Ambil data presentasi untuk primary category
  const primaryDisplay = getCategoryDisplay(result.primaryCategory);

  return (
    <Card className="p-8">
      <div className="space-y-6">
        {/* Primary Result */}
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Classification Complete</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-3xl">
              {primaryDisplay.icon}
            </span>
            <span className="text-xl font-semibold">
              {primaryDisplay.label}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            Confidence: {(result.confidence * 100).toFixed(1)}%
          </p>
        </div>

        {/* All Results */}
        <div>
          <h3 className="font-semibold mb-3">All Classifications</h3>
          <div className="space-y-2">
            {result.allResults.map((item, index) => {
              const itemDisplay = getCategoryDisplay(item.category);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {itemDisplay.icon}
                    </span>
                    <span className="font-medium">{itemDisplay.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color.replace("text-", "bg-")}`}
                        style={{ width: `${item.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disposal Tip */}
        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Disposal Tip</h4>
              <p className="text-sm text-muted-foreground">
                {result.disposalTip}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Button className="w-full" onClick={onReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Classify Another Item
        </Button>
      </div>
    </Card>
  );
}
