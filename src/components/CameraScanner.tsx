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

      // Call extraction API
      const extractResponse = await fetch("/api/extract-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, imageMediaType: mediaType }),
      });

      if (!extractResponse.ok) {
        throw new Error("Failed to extract ingredients");
      }

      const extractedData = await extractResponse.json();

      if (extractedData.error) {
        throw new Error(extractedData.error);
      }

      // Create partial scan object
      const newScan: Partial<Scan> = {
        id: `scan_${Date.now()}`,
        timestamp: Date.now(),
        imageUrl: preview || "",
        ingredients: extractedData.ingredients,
      };

      onScanComplete(newScan);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process image";
      setExtractError(message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Preview Section */}
      {preview && (
        <div className="mb-4 relative w-full bg-gray-900 rounded-lg overflow-hidden">
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
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {extractError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {extractError}
        </div>
      )}

      {/* Camera/Upload Input */}
      <div className="mb-4">
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
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
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
          {isLoading ? "Processing..." : "Take Photo or Upload"}
        </button>
      </div>

      {/* Extract Button */}
      {selectedFile && !isLoading && (
        <button
          onClick={handleExtract}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
        >
          Analyze Ingredients
        </button>
      )}

      {/* Instructions */}
      {!preview && (
        <div className="p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p className="font-semibold mb-2">📸 Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Take a clear, well-lit photo of the ingredient label</li>
            <li>Make sure all text is readable and not blurry</li>
            <li>Avoid glare and shadows</li>
            <li>Include the complete ingredient list</li>
          </ul>
        </div>
      )}
    </div>
  );
}
