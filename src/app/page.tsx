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
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              TL
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">True Labels</h1>
              <p className="text-xs text-amber-700 font-medium">Transparent Food Analysis</p>
            </div>
          </div>
          <div className="flex gap-2">
            {view !== "history" && (
              <button
                onClick={() => setView("history")}
                className="px-4 py-2 text-gray-700 text-sm font-medium hover:bg-amber-50 rounded-lg transition-colors"
              >
                History
              </button>
            )}
            <button
              onClick={() => setProfileOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Error Message */}
        {error && (
          <div className="mb-8 p-5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl">
            <p className="font-semibold text-sm">Alert</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-xs font-medium text-rose-700 hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scanner View */}
        {view === "scanner" && (
          <div>
            <div className="mb-16">
              <h2 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Scan Food Labels
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Upload a photo of any food label's ingredient list. True Labels uses advanced AI to analyze ingredients, identify allergens, and provide transparent food safety insights.
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
              className="mb-8 text-amber-700 hover:text-amber-900 text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <span>←</span> Back to Scanner
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
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Your Scan History</h2>
              <button
                onClick={() => setView("scanner")}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
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
      <footer className="border-t border-amber-100 bg-gradient-to-b from-white to-amber-50 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            True Labels — Transparency in Every Bite
          </p>
          <p className="text-xs text-gray-600 max-w-2xl mx-auto">
            Our mission is to empower consumers with transparent, accurate food information. This analysis is educational and not a substitute for professional medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
