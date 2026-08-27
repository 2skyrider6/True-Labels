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
    <div className="space-y-4">
      {scans.map((scan) => (
        <button
          key={scan.id}
          onClick={() => onSelectScan(scan)}
          className="w-full text-left p-5 border border-amber-100 rounded-xl bg-white hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="flex gap-5 items-start">
            {/* Thumbnail */}
            {scan.imageUrl && (
              <div className="flex-shrink-0 w-20 h-20 bg-amber-100 rounded-xl overflow-hidden border border-amber-200 shadow-sm">
                <img
                  src={scan.imageUrl}
                  alt="Scan"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm line-clamp-2">
                    {scan.ingredients
                      .slice(0, 3)
                      .map((i) => i.name)
                      .join(", ")}
                    {scan.ingredients.length > 3
                      ? `, +${scan.ingredients.length - 3} more`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">
                    {formatAnalysisDate(scan.timestamp)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${riskColors[scan.analysis.product_risk_score]}`}
                >
                  {scan.analysis.product_risk_score}
                </span>
              </div>

              {/* Top Concerns Preview */}
              {scan.analysis.top_concerns.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {scan.analysis.top_concerns.slice(0, 2).map((concern) => (
                    <span
                      key={concern}
                      className="text-xs bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200 font-medium"
                    >
                      {concern}
                    </span>
                  ))}
                  {scan.analysis.top_concerns.length > 2 && (
                    <span className="text-xs text-gray-600 px-2.5 py-1 font-medium">
                      +{scan.analysis.top_concerns.length - 2} more
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
                className="text-gray-400 hover:text-rose-600 flex-shrink-0 transition-colors font-bold"
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
