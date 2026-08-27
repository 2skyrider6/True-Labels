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
      <div className="w-full bg-white rounded-t-3xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* Allergies Section */}
        <div className="mb-12">
          <h3 className="text-base font-bold text-gray-900 mb-1">Allergies</h3>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            Select all allergies that apply to you. True Labels will flag these ingredients and alert you during scans.
          </p>
          <div className="flex flex-wrap gap-3">
            {COMMON_ALLERGIES.map((allergy) => (
              <button
                key={allergy}
                onClick={() => toggleAllergy(allergy)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  localAllergies.includes(allergy)
                    ? "bg-purple-600 text-white shadow-md hover:shadow-lg hover:bg-purple-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200 hover:border-gray-300"
                }`}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions Section */}
        <div className="mb-12">
          <h3 className="text-base font-bold text-gray-900 mb-1">Dietary Preferences</h3>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            Select your dietary preferences and lifestyle choices.
          </p>
          <div className="flex flex-wrap gap-3">
            {COMMON_RESTRICTIONS.map((restriction) => (
              <button
                key={restriction}
                onClick={() => toggleRestriction(restriction)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  localRestrictions.includes(restriction)
                    ? "bg-amber-600 text-white shadow-md hover:shadow-lg hover:bg-amber-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200 hover:border-gray-300"
                }`}
              >
                {restriction}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 sticky bottom-8 pt-8 border-t border-amber-100 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-6 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 px-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
