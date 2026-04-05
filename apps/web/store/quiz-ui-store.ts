import { create } from "zustand";
import type { ScreenState } from "@/lib/types";

interface QuizUiStore {
  screen: ScreenState;
  setScreen: (screen: ScreenState) => void;
}

export const useQuizUiStore = create<QuizUiStore>((set) => ({
  screen: "setup",
  setScreen: (screen) => set({ screen }),
}));
