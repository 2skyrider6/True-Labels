"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

const COMMON_ALLERGIES = [
  "Peanuts",
  "Tree nuts",
  "Milk",
  "Eggs",
  "Fish",
  "Shellfish",
  "Soy",
  "Wheat",
  "Sesame",
];

const COMMON_RESTRICTIONS = [
  "Gluten-free",
  "Dairy-free",
  "Vegan",
  "Vegetarian",
  "Halal",
  "Kosher",
  "No artificial colors",
  "No artificial sweeteners",
  "Low sodium",
];

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { userProfile, setAllergies, setDietaryRestrictions } = useAppStore();
  const [localAllergies, setLocalAllergies] = useState(userProfile.allergies);
  const [localRestrictions, setLocalRestrictions] = useState(
    userProfile.dietary_restrictions
  );

  const toggleAllergy = (allergy: string) => {
    setLocalAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  };

  const toggleRestriction = (restriction: string) => {
    setLocalRestrictions((prev) =>
      prev.includes(restriction)
        ? prev.filter((r) => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleSave = () => {
    setAllergies(localAllergies);
    setDietaryRestrictions(localRestrictions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="w-full bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Allergies Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">🧬 Allergies</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select all allergies that apply to you. We'll highlight these
            ingredients in scans.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((allergy) => (
              <button
                key={allergy}
                onClick={() => toggleAllergy(allergy)}
                className={`px-4 py-2 rounded-full font-semibold transition ${
                  localAllergies.includes(allergy)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">🥗 Dietary Restrictions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select your dietary preferences and restrictions.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_RESTRICTIONS.map((restriction) => (
              <button
                key={restriction}
                onClick={() => toggleRestriction(restriction)}
                className={`px-4 py-2 rounded-full font-semibold transition ${
                  localRestrictions.includes(restriction)
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {restriction}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sticky bottom-0 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
