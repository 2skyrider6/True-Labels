"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { fileToBase64, getMediaType } from "@/lib/utils";
import { useAppStore, type Scan } from "@/lib/store";

interface CameraScannerProps {
  onScanComplete: (scan: Partial<Scan>) => void;
  isLoading: boolean;
}

export function CameraScanner({
  onScanComplete,
  isLoading,
}: CameraScannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setExtractError("Please select a valid image file");
      return;
    }

    setSelectedFile(file);
    setExtractError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setExtractError("No image selected");
      return;
    }

    try {
      setExtractError(null);

      // Convert to base64
      const base64 = await fileToBase64(selectedFile);
      const mediaType = getMediaType(selectedFile);

      if (!base64 || base64.length === 0) {
        throw new Error("Failed to process image file");
      }

      // Call extraction API
      const extractResponse = await fetch("/api/extract-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, imageMediaType: mediaType }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server error: ${extractResponse.status}`
        );
      }

      const extractedData = await extractResponse.json();

      // Check if we got valid ingredients or an error message
      if (extractedData.error && (!extractedData.ingredients || extractedData.ingredients.length === 0)) {
        throw new Error(extractedData.error);
      }

      // Even if error is present but we have ingredients, proceed
      const newScan: Partial<Scan> = {
        id: `scan_${Date.now()}`,
        timestamp: Date.now(),
        imageUrl: preview || "",
        ingredients: extractedData.ingredients || [],
      };

      onScanComplete(newScan);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process image. Please try again with a clearer photo of the ingredient label.";
      setExtractError(message);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Preview Section */}
      {preview && (
        <div className="mb-6 relative w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt="Selected image"
            className="w-full h-auto max-h-96 object-cover"
          />
          <button
            onClick={() => {
              setPreview(null);
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="absolute top-3 right-3 bg-gray-900 bg-opacity-75 hover:bg-opacity-90 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {extractError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <p className="text-sm font-medium">{extractError}</p>
        </div>
      )}

      {/* Camera/Upload Input */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {isLoading ? "Processing..." : "Upload Photo"}
        </button>

        {/* Extract Button */}
        {selectedFile && !isLoading && (
          <button
            onClick={handleExtract}
            className="w-full py-3 px-6 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
          >
            Analyze Ingredients
          </button>
        )}
      </div>

      {/* Instructions */}
      {!preview && (
        <div className="mt-8 p-5 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-3 text-sm">Tips for best results</p>
          <ul className="space-y-2">
            <li className="flex gap-3 text-sm text-gray-700">
              <span className="text-emerald-600 font-bold flex-shrink-0">•</span>
              <span>Take a clear, well-lit photo of the ingredient label</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-700">
              <span className="text-emerald-600 font-bold flex-shrink-0">•</span>
              <span>Ensure all text is readable and not blurry</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-700">
              <span className="text-emerald-600 font-bold flex-shrink-0">•</span>
              <span>Avoid glare and shadows on the label</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-700">
              <span className="text-emerald-600 font-bold flex-shrink-0">•</span>
              <span>Include the complete ingredient list in the frame</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
