import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AnalyzedIngredient {
  name: string;
  safety: "Safe" | "Caution" | "Avoid";
  reasoning: string;
  sources: Array<{ title: string; url: string }>;
  allergen: boolean;
  concerns?: string[];
}

export interface Scan {
  id: string;
  timestamp: number;
  imageUrl: string;
  ingredients: Array<{ name: string; amount?: string; unit?: string }>;
  analysis: {
    results: AnalyzedIngredient[];
    product_risk_score: "Low" | "Medium" | "High";
    top_concerns: string[];
  };
}

export interface UserProfile {
  allergies: string[];
  dietary_restrictions: string[];
}

interface AppStore {
  // User profile
  userProfile: UserProfile;
  setAllergies: (allergies: string[]) => void;
  setDietaryRestrictions: (restrictions: string[]) => void;

  // Scan history
  scanHistory: Scan[];
  addScan: (scan: Scan) => void;
  clearHistory: () => void;

  // Current scan state
  currentScan: Partial<Scan> | null;
  setCurrentScan: (scan: Partial<Scan> | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // User profile
      userProfile: {
        allergies: [],
        dietary_restrictions: [],
      },
      setAllergies: (allergies: string[]) =>
        set((state) => ({
          userProfile: { ...state.userProfile, allergies },
        })),
      setDietaryRestrictions: (restrictions: string[]) =>
        set((state) => ({
          userProfile: { ...state.userProfile, dietary_restrictions: restrictions },
        })),

      // Scan history
      scanHistory: [],
      addScan: (scan: Scan) =>
        set((state) => ({
          scanHistory: [scan, ...state.scanHistory],
        })),
      clearHistory: () => set({ scanHistory: [] }),

      // Current scan
      currentScan: null,
      setCurrentScan: (scan: Partial<Scan> | null) =>
        set({ currentScan: scan }),
    }),
    {
      name: "foodsafe-storage",
    }
  )
);
