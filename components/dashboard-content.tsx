"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface ClassificationEntry {
  id: number;
  category: string;
  confidence: number;
  date: string;
  timestamp: number;
}

interface CategoryDistribution {
  category: string;
  count: number;
}

interface Stats {
  totalScans: number;
  thisWeek: number;
  mostCommon: string;
  categoryDistribution: CategoryDistribution[];
  recentClassifications: ClassificationEntry[];
}

export function DashboardContent() {
  const [stats, setStats] = useState<Stats>({
    totalScans: 0,
    thisWeek: 0,
    mostCommon: "N/A",
    categoryDistribution: [],
    recentClassifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/stats`);

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load statistics. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const getCategoryIcon = (category: string) => {
    "Papel_y_carton": { label: "Paper & Cardboard", icon: "📄" },
    "Paper": { label: "Paper", icon: "📄" },
    "Plastic": { label: "Plastic", icon: "♻️" },
    "Plastico": { label: "Plastic", icon: "♻️" },
    "Organic": { label: "Organic", icon: "🌿" },
    "Organico": { label: "Organic", icon: "🌿" },
    "Metal": { label: "Metal", icon: "🔩" },
  };

  const getCategoryColor = (category: string, index: number) => {
    const colors: Record<string, string> = {
      plastic: "bg-chart-1",
      metal: "bg-chart-2",
      paper: "bg-chart-3",
      glass: "bg-chart-4",
      cardboard: "bg-chart-5",
      organic: "bg-green-500",
      battery: "bg-yellow-500",
    };
    return colors[category.toLowerCase()] || `bg-chart-${(index % 4) + 1}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && stats.totalScans === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your waste classification history and environmental impact
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Scans</p>
              <p className="text-3xl font-bold">{stats.totalScans}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">This Week</p>
              <p className="text-3xl font-bold">{stats.thisWeek}</p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Most Common</p>
              <p className="text-3xl font-bold">{stats.mostCommon}</p>
            </div>
            <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-chart-2" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Category Distribution</h2>
          {stats.categoryDistribution.length > 0 ? (
            <div className="space-y-4">
              {stats.categoryDistribution.map((item, index) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {getCategoryIcon(item.category)}
                      </span>
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.count} items
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getCategoryColor(
                        item.category,
                        index
                      )}`}
                      style={{
                        width: `${(item.count / stats.totalScans) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No classifications yet.</p>
              <p className="text-sm">Start scanning waste to see statistics!</p>
            </div>
          )}
        </Card>

        {/* Recent Classifications */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Classifications</h2>
          {stats.recentClassifications.length > 0 ? (
            <>
              <div className="space-y-3">
                {stats.recentClassifications.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getCategoryIcon(item.category)}
                      </span>
                      <div>
                        <p className="font-medium">{item.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent classifications.</p>
              <p className="text-sm">
                Your classification history will appear here.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Environmental Impact */}
      <Card className="p-6 mt-6 bg-primary text-primary-foreground">
        <h2 className="text-xl font-semibold mb-2">
          Your Environmental Impact
        </h2>
        <p className="text-primary-foreground/90 mb-4">
          By correctly sorting {stats.totalScans} items, you&apos;ve helped reduce
          contamination and improve recycling efficiency.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary-foreground/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">
              {stats.totalScans > 0 ? "89%" : "0%"}
            </p>
            <p className="text-sm text-primary-foreground/80">Accuracy Rate</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">
              {(stats.totalScans * 0.095).toFixed(1)}kg
            </p>
            <p className="text-sm text-primary-foreground/80">CO₂ Saved</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">
              {Math.floor(stats.totalScans * 0.35)}
            </p>
            <p className="text-sm text-primary-foreground/80">Trees Equiv.</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">
              {Math.floor(stats.totalScans * 0.18)}L
            </p>
            <p className="text-sm text-primary-foreground/80">Water Saved</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
