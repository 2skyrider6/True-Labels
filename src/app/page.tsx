"use client";

import { useState, useEffect } from "react";
import { CameraScanner } from "@/components/CameraScanner";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { UserProfile } from "@/components/UserProfile";
import { ScanHistory } from "@/components/ScanHistory";
import { useAppStore, type Scan, type AnalyzedIngredient } from "@/lib/store";
import { generateShareText } from "@/lib/utils";

type ViewState = "scanner" | "results" | "history";

export default function Home() {
  const { userProfile, scanHistory, addScan, currentScan, setCurrentScan } =
    useAppStore();
  const [view, setView] = useState<ViewState>("scanner");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    results: AnalyzedIngredient[];
    product_risk_score: "Low" | "Medium" | "High";
    top_concerns: string[];
  } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScanComplete = async (scan: Partial<Scan>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Call analysis API
      const analysisResponse = await fetch("/api/analyze-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: scan.ingredients,
          userAllergies: userProfile.allergies,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Failed to analyze ingredients");
      }

      const analysis = await analysisResponse.json();

      if (analysis.error) {
        throw new Error(analysis.error);
      }

      setAnalysisResults(analysis);
      setCurrentScan(scan);
      setView("results");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveScan = () => {
    if (!currentScan || !analysisResults) return;

    const completeScan: Scan = {
      id: currentScan.id || `scan_${Date.now()}`,
      timestamp: currentScan.timestamp || Date.now(),
      imageUrl: currentScan.imageUrl || "",
      ingredients: currentScan.ingredients || [],
      analysis: analysisResults,
    };

    addScan(completeScan);
    setView("history");
    setCurrentScan(null);
  };

  const handleShareScan = () => {
    if (!currentScan || !analysisResults) return;

    const shareText = generateShareText({
      ingredients: currentScan.ingredients || [],
      analysis: analysisResults,
    });

    if (navigator.share) {
      navigator
        .share({
          title: "FoodSafe Scan Result",
          text: shareText,
        })
        .catch(() => {
          // Copy to clipboard as fallback
          navigator.clipboard.writeText(shareText);
          alert("Scan report copied to clipboard!");
        });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert("Scan report copied to clipboard!");
    }
  };

  const handleSelectScan = (scan: Scan) => {
    setCurrentScan(scan);
    setAnalysisResults(scan.analysis);
    setView("results");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">🛡️ FoodSafe</h1>
            <p className="text-xs text-gray-500">Scanner</p>
          </div>
          <div className="flex gap-2">
            {view !== "history" && (
              <button
                onClick={() => setView("history")}
                className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                📋 History
              </button>
            )}
            <button
              onClick={() => setProfileOpen(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              👤 Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">❌ Error</p>
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scanner View */}
        {view === "scanner" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Scan Your Food Label
              </h2>
              <p className="text-gray-600">
                Upload a clear photo of the ingredient list to analyze what's
                in your food.
              </p>
            </div>
            <CameraScanner
              onScanComplete={handleScanComplete}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Results View */}
        {view === "results" && analysisResults && currentScan && (
          <div>
            <button
              onClick={() => {
                setView("scanner");
                setCurrentScan(null);
                setAnalysisResults(null);
              }}
              className="mb-4 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              ← Back to Scanner
            </button>
            <ResultsDisplay
              ingredients={analysisResults.results}
              productRiskScore={analysisResults.product_risk_score}
              topConcerns={analysisResults.top_concerns}
              onSave={handleSaveScan}
              onShare={handleShareScan}
            />
          </div>
        )}

        {/* History View */}
        {view === "history" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Scan History</h2>
              <button
                onClick={() => setView("scanner")}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                + New Scan
              </button>
            </div>
            <ScanHistory
              scans={scanHistory}
              onSelectScan={handleSelectScan}
            />
          </div>
        )}
      </main>

      {/* User Profile Modal */}
      <UserProfile
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-12">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            🔬 FoodSafe Scanner - Making food safety transparent and
            accessible
          </p>
          <p className="mt-2 text-xs">
            Always consult with healthcare professionals for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
