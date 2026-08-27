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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
              FS
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">FoodSafe</h1>
              <p className="text-xs text-gray-500">Food Safety Scanner</p>
            </div>
          </div>
          <div className="flex gap-3">
            {view !== "history" && (
              <button
                onClick={() => setView("history")}
                className="px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                History
              </button>
            )}
            <button
              onClick={() => setProfileOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            <p className="font-semibold text-sm">Error</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-xs font-medium text-red-700 hover:text-red-900 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scanner View */}
        {view === "scanner" && (
          <div>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Scan Food Labels
              </h2>
              <p className="text-gray-600 max-w-md">
                Upload a photo of an ingredient list to analyze and identify potential allergens and concerns.
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
              className="mb-6 text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <span>←</span> Back
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
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Scan History</h2>
              <button
                onClick={() => setView("scanner")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                New Scan
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
      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-600">
            FoodSafe Scanner — Transparent food safety analysis
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This tool is informational only. Always consult healthcare professionals for dietary advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
