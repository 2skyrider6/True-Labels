"use client";

import { AnalyzedIngredient } from "@/lib/store";
import { generateShareText } from "@/lib/utils";

interface ResultsDisplayProps {
  ingredients: AnalyzedIngredient[];
  productRiskScore: "Low" | "Medium" | "High";
  topConcerns: string[];
  onSave?: () => void;
  onShare?: () => void;
}

export function ResultsDisplay({
  ingredients,
  productRiskScore,
  topConcerns,
  onSave,
  onShare,
}: ResultsDisplayProps) {
  const riskColors = {
    Low: "bg-green-100 text-green-800 border-green-300",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    High: "bg-red-100 text-red-800 border-red-300",
  };

  const safetyBadgeColors = {
    Safe: "bg-green-100 text-green-700 border-green-300",
    Caution: "bg-yellow-100 text-yellow-700 border-yellow-300",
    Avoid: "bg-red-100 text-red-700 border-red-300",
  };

  const safetyIcons = {
    Safe: "✓",
    Caution: "!",
    Avoid: "⚠",
  };

  return (
    <div className="w-full space-y-8">
      {/* Disclaimer */}
      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-sm">
        <p className="font-bold text-gray-900 mb-2">Our Commitment to Transparency</p>
        <p className="text-gray-700 leading-relaxed">
          True Labels provides educational analysis based on ingredient research. This is not medical advice. Please consult healthcare professionals for personal dietary decisions or medical concerns.
        </p>
      </div>

      {/* Overall Risk Score */}
      <div className={`p-8 rounded-2xl border-2 shadow-lg ${riskColors[productRiskScore]}`}>
        <p className="text-xs font-bold opacity-75 mb-2 uppercase tracking-widest">Product Safety Assessment</p>
        <p className="text-5xl font-bold mb-3">{productRiskScore}</p>
        <p className="text-base leading-relaxed">
          {productRiskScore === "Low"
            ? "This product contains no identified concerns based on common ingredient research."
            : productRiskScore === "Medium"
              ? "This product contains some ingredients that may warrant caution for certain individuals."
              : "This product contains ingredients that warrant careful consideration or avoidance."}
        </p>
      </div>

      {/* Top Concerns */}
      {topConcerns.length > 0 && (
        <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200">
          <p className="font-bold text-rose-900 mb-4 text-base">
            ⚠ Key Concerns ({topConcerns.length})
          </p>
          <ul className="space-y-2">
            {topConcerns.map((concern) => (
              <li key={concern} className="flex gap-3 text-rose-900 text-sm">
                <span className="text-rose-600 font-bold flex-shrink-0">▸</span>
                <span className="leading-relaxed">{concern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ingredient List */}
      <div>
        <h3 className="font-bold text-gray-900 mb-5 text-lg">Ingredient Breakdown</h3>
        <div className="space-y-4">
          {ingredients.map((ingredient, idx) => (
            <div
              key={idx}
              className="p-5 border border-amber-100 rounded-xl bg-white hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-3">
                  <p className="font-bold text-gray-900 text-base">
                    {ingredient.name}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${safetyBadgeColors[ingredient.safety]}`}
                  >
                    {safetyIcons[ingredient.safety]} {ingredient.safety}
                  </span>
                  {ingredient.allergen && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300">
                      ⚠ Allergen
                    </span>
                  )}
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">{ingredient.reasoning}</p>

              {/* Concerns */}
              {ingredient.concerns && ingredient.concerns.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Considerations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ingredient.concerns.map((concern) => (
                      <span
                        key={concern}
                        className="text-xs bg-amber-100 text-amber-900 px-3 py-2 rounded-lg border border-amber-200 font-medium"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {ingredient.sources && ingredient.sources.length > 0 && (
                <div className="pt-4 border-t border-amber-100">
                  <p className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Research Sources
                  </p>
                  <div className="space-y-2">
                    {ingredient.sources.map((source, sIdx) => (
                      <a
                        key={sIdx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-700 hover:text-amber-900 hover:underline block font-medium"
                      >
                        ↗ {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Safety Summary */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
        <p className="font-bold text-gray-900 mb-4 text-base">Analysis Summary</p>
        <ul className="space-y-3">
          <li className="flex items-center gap-4 text-gray-700 text-sm">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="font-medium">Safe: <span className="font-bold text-gray-900">{ingredients.filter((i) => i.safety === "Safe").length}</span> ingredients</span>
          </li>
          <li className="flex items-center gap-4 text-gray-700 text-sm">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span className="font-medium">Caution: <span className="font-bold text-gray-900">{ingredients.filter((i) => i.safety === "Caution").length}</span> ingredients</span>
          </li>
          <li className="flex items-center gap-4 text-gray-700 text-sm">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="font-medium">Avoid: <span className="font-bold text-gray-900">{ingredients.filter((i) => i.safety === "Avoid").length}</span> ingredients</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        {onSave && (
          <button
            onClick={onSave}
            className="flex-1 py-4 px-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
          >
            Save Analysis
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="flex-1 py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
          >
            Share Report
          </button>
        )}
      </div>
    </div>
  );
}
