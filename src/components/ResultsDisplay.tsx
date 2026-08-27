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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Disclaimer */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
        <p className="font-semibold mb-1">⚠️ Important Disclaimer</p>
        <p>
          FoodSafe Scanner is for informational purposes only. It is not a
          substitute for professional medical advice. Always consult with a
          healthcare provider for dietary concerns or allergies.
        </p>
      </div>

      {/* Overall Risk Score */}
      <div className={`p-6 rounded-lg border-2 ${riskColors[productRiskScore]}`}>
        <p className="text-sm font-semibold opacity-75">Product Risk Level</p>
        <p className="text-3xl font-bold">{productRiskScore}</p>
        <p className="text-sm mt-2">
          {productRiskScore === "Low"
            ? "No significant concerns detected"
            : productRiskScore === "Medium"
              ? "Some ingredients warrant caution"
              : "Contains ingredients to avoid or be concerned about"}
        </p>
      </div>

      {/* Top Concerns */}
      {topConcerns.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="font-semibold text-red-900 mb-2">
            🚩 Top {Math.min(3, topConcerns.length)} Concerns
          </p>
          <ul className="space-y-1">
            {topConcerns.map((concern) => (
              <li key={concern} className="text-red-700">
                • {concern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ingredient List */}
      <div>
        <p className="font-semibold text-lg mb-4">Ingredient Analysis</p>
        <div className="space-y-3">
          {ingredients.map((ingredient, idx) => (
            <div
              key={idx}
              className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {ingredient.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold border ${safetyBadgeColors[ingredient.safety]}`}
                  >
                    {safetyIcons[ingredient.safety]} {ingredient.safety}
                  </span>
                  {ingredient.allergen && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 border border-purple-300">
                      🧬 Allergen
                    </span>
                  )}
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-sm text-gray-700 mb-2">{ingredient.reasoning}</p>

              {/* Concerns */}
              {ingredient.concerns && ingredient.concerns.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Specific Concerns:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ingredient.concerns.map((concern) => (
                      <span
                        key={concern}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {ingredient.sources && ingredient.sources.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Sources:
                  </p>
                  <div className="space-y-1">
                    {ingredient.sources.map((source, sIdx) => (
                      <a
                        key={sIdx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline block"
                      >
                        → {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onSave && (
          <button
            onClick={onSave}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            💾 Save Scan
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            📤 Share Report
          </button>
        )}
      </div>

      {/* Safety Summary */}
      <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
        <p className="font-semibold mb-2">Summary</p>
        <ul className="space-y-1">
          <li>
            ✓ <strong>Safe:</strong>{" "}
            {ingredients.filter((i) => i.safety === "Safe").length} ingredients
          </li>
          <li>
            ! <strong>Caution:</strong>{" "}
            {ingredients.filter((i) => i.safety === "Caution").length}{" "}
            ingredients
          </li>
          <li>
            ⚠ <strong>Avoid:</strong>{" "}
            {ingredients.filter((i) => i.safety === "Avoid").length}{" "}
            ingredients
          </li>
        </ul>
      </div>
    </div>
  );
}
