"use client";

import { Scan } from "@/lib/store";
import { formatAnalysisDate } from "@/lib/utils";
import Image from "next/image";

interface ScanHistoryProps {
  scans: Scan[];
  onSelectScan: (scan: Scan) => void;
  onDeleteScan?: (scanId: string) => void;
}

export function ScanHistory({
  scans,
  onSelectScan,
  onDeleteScan,
}: ScanHistoryProps) {
  if (scans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No scans yet</p>
        <p className="text-gray-400 text-sm">
          Start by taking a photo of a food label
        </p>
      </div>
    );
  }

  const riskColors = {
    Low: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-3">
      {scans.map((scan) => (
        <button
          key={scan.id}
          onClick={() => onSelectScan(scan)}
          className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition"
        >
          <div className="flex gap-4 items-start">
            {/* Thumbnail */}
            {scan.imageUrl && (
              <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={scan.imageUrl}
                  alt="Scan"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {scan.ingredients
                      .slice(0, 3)
                      .map((i) => i.name)
                      .join(", ")}
                    {scan.ingredients.length > 3
                      ? `, +${scan.ingredients.length - 3} more`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatAnalysisDate(scan.timestamp)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${riskColors[scan.analysis.product_risk_score]}`}
                >
                  {scan.analysis.product_risk_score}
                </span>
              </div>

              {/* Top Concerns Preview */}
              {scan.analysis.top_concerns.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {scan.analysis.top_concerns.slice(0, 2).map((concern) => (
                    <span
                      key={concern}
                      className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded"
                    >
                      {concern}
                    </span>
                  ))}
                  {scan.analysis.top_concerns.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{scan.analysis.top_concerns.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Delete Button */}
            {onDeleteScan && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteScan(scan.id);
                }}
                className="text-gray-400 hover:text-red-600 transition"
              >
                ✕
              </button>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
