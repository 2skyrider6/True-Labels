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
    <div className="w-full space-y-6">
      {/* Disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-gray-700">
        <p className="font-semibold text-amber-900 mb-1">Disclaimer</p>
        <p className="text-amber-900 text-sm">
          FoodSafe Scanner is for informational purposes only. It is not a substitute for professional medical advice. Always consult healthcare providers for dietary concerns or allergies.
        </p>
      </div>

      {/* Overall Risk Score */}
      <div className={`p-6 rounded-xl border ${riskColors[productRiskScore]}`}>
        <p className="text-xs font-medium opacity-75 mb-1">PRODUCT RISK LEVEL</p>
        <p className="text-4xl font-bold mb-2">{productRiskScore}</p>
        <p className="text-sm text-opacity-90">
          {productRiskScore === "Low"
            ? "No significant concerns detected in this product"
            : productRiskScore === "Medium"
              ? "Some ingredients warrant caution based on your profile"
              : "Contains ingredients to avoid or be concerned about"}
        </p>
      </div>

      {/* Top Concerns */}
      {topConcerns.length > 0 && (
        <div className="p-5 bg-red-50 rounded-xl border border-red-200">
          <p className="font-semibold text-red-900 mb-3 text-sm">
            Top {Math.min(3, topConcerns.length)} Concerns
          </p>
          <ul className="space-y-2">
            {topConcerns.map((concern) => (
              <li key={concern} className="flex gap-3 text-red-900 text-sm">
                <span className="text-red-600 font-bold flex-shrink-0">•</span>
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ingredient List */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">INGREDIENT ANALYSIS</h3>
        <div className="space-y-3">
          {ingredients.map((ingredient, idx) => (
            <div
              key={idx}
              className="p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:shadow-sm transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-3">
                  <p className="font-semibold text-gray-900 text-sm">
                    {ingredient.name}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${safetyBadgeColors[ingredient.safety]}`}
                  >
                    {safetyIcons[ingredient.safety]} {ingredient.safety}
                  </span>
                  {ingredient.allergen && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300">
                      Allergen
                    </span>
                  )}
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-sm text-gray-700 mb-3">{ingredient.reasoning}</p>

              {/* Concerns */}
              {ingredient.concerns && ingredient.concerns.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Specific Concerns
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ingredient.concerns.map((concern) => (
                      <span
                        key={concern}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-200"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {ingredient.sources && ingredient.sources.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Sources
                  </p>
                  <div className="space-y-1">
                    {ingredient.sources.map((source, sIdx) => (
                      <a
                        key={sIdx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline block"
                      >
                        {source.title}
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
      <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
        <p className="font-semibold text-gray-900 mb-3 text-sm">SUMMARY</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-3 text-gray-700 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span><strong>Safe:</strong> {ingredients.filter((i) => i.safety === "Safe").length} ingredients</span>
          </li>
          <li className="flex items-center gap-3 text-gray-700 text-sm">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span><strong>Caution:</strong> {ingredients.filter((i) => i.safety === "Caution").length} ingredients</span>
          </li>
          <li className="flex items-center gap-3 text-gray-700 text-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span><strong>Avoid:</strong> {ingredients.filter((i) => i.safety === "Avoid").length} ingredients</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {onSave && (
          <button
            onClick={onSave}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Save Scan
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="flex-1 py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Share Report
          </button>
        )}
      </div>
    </div>
  );
}
