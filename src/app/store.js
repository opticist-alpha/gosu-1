import { create } from "zustand";
import { CATEGORIES, SAMPLE_PROS } from "../features/pros/data/mockPros";

export const useAppStore = create(() => ({
  categories: CATEGORIES,
  pros: SAMPLE_PROS,
}));
