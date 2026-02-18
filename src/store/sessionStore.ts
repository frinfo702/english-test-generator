import { create } from "zustand";

interface Answer {
  questionId: string;
  correct: boolean;
}

interface AdaptiveState {
  module1Score: number | null;
  module2Branch: "hard" | "easy" | null;
}

interface SessionStore {
  currentSection: "toefl" | "toeic" | null;
  currentTask: string | null;
  answers: Answer[];
  adaptive: AdaptiveState;

  setCurrentSection: (section: "toefl" | "toeic" | null) => void;
  setCurrentTask: (task: string | null) => void;
  recordAnswer: (questionId: string, correct: boolean) => void;
  setAdaptiveModule1Score: (score: number) => void;
  setAdaptiveBranch: (branch: "hard" | "easy") => void;
  resetSession: () => void;
  getScore: () => { correct: number; total: number; percentage: number };
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSection: null,
  currentTask: null,
  answers: [],
  adaptive: {
    module1Score: null,
    module2Branch: null,
  },

  setCurrentSection: (section) => set({ currentSection: section }),
  setCurrentTask: (task) => set({ currentTask: task }),

  recordAnswer: (questionId, correct) =>
    set((state) => ({
      answers: [...state.answers, { questionId, correct }],
    })),

  setAdaptiveModule1Score: (score) =>
    set((state) => ({
      adaptive: { ...state.adaptive, module1Score: score },
    })),

  setAdaptiveBranch: (branch) =>
    set((state) => ({
      adaptive: { ...state.adaptive, module2Branch: branch },
    })),

  resetSession: () =>
    set({
      answers: [],
      adaptive: { module1Score: null, module2Branch: null },
    }),

  getScore: () => {
    const { answers } = get();
    const correct = answers.filter((a) => a.correct).length;
    const total = answers.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percentage };
  },
}));
