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
    <div className="w-full max-w-3xl">
      {/* Preview Section */}
      {preview && (
        <div className="mb-8 relative w-full bg-gray-100 rounded-2xl overflow-hidden border border-amber-200 shadow-lg">
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
            className="absolute top-4 right-4 bg-gray-900 bg-opacity-80 hover:bg-opacity-100 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all shadow-md"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {extractError && (
        <div className="mb-8 p-5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl">
          <p className="text-sm font-semibold">{extractError}</p>
        </div>
      )}

      {/* Camera/Upload Input */}
      <div className="space-y-4">
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
          className="w-full py-4 px-8 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
        >
          <svg
            className="w-6 h-6"
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
          {isLoading ? "Analyzing..." : "Upload Food Label"}
        </button>

        {/* Extract Button */}
        {selectedFile && !isLoading && (
          <button
            onClick={handleExtract}
            className="w-full py-4 px-8 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Analyze Ingredients
          </button>
        )}
      </div>

      {/* Instructions */}
      {!preview && (
        <div className="mt-10 p-7 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200">
          <p className="font-bold text-gray-900 mb-4 text-base">How to Scan a Label</p>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-gray-700">
              <span className="text-amber-700 font-bold flex-shrink-0 text-lg">1</span>
              <span>Position the label clearly in good lighting</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-700">
              <span className="text-amber-700 font-bold flex-shrink-0 text-lg">2</span>
              <span>Make sure all ingredient text is readable and in focus</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-700">
              <span className="text-amber-700 font-bold flex-shrink-0 text-lg">3</span>
              <span>Avoid shadows, glare, and reflections on the label</span>
            </li>
            <li className="flex gap-3 text-sm text-gray-700">
              <span className="text-amber-700 font-bold flex-shrink-0 text-lg">4</span>
              <span>Include the complete ingredient list in the frame</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
