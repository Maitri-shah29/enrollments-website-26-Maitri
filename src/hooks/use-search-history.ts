"use client";

import { useEffect, useState } from "react";

const HISTORY_KEY = "search_history";
const MAX_HISTORY = 5;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load history from local storage on mount
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, []);

  const addToHistory = (term: string) => {
    if (!term || !term.trim()) return;

    const trimmedTerm = term.trim();

    setHistory((prev) => {
      // Remove duplicates
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== trimmedTerm.toLowerCase(),
      );
      // Add new term to the beginning
      const newHistory = [trimmedTerm, ...filtered].slice(0, MAX_HISTORY);

      // Save to local storage
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save search history:", error);
      }

      return newHistory;
    });
  };

  //   const clearHistory = () => {
  //     setHistory([]);
  //     try {
  //       localStorage.removeItem(HISTORY_KEY);
  //     } catch (error) {
  //       console.error("Failed to clear search history:", error);
  //     }
  //   };

  const removeFromHistory = (term: string) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== term.toLowerCase(),
      );
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
      } catch (error) {
        console.error("Failed to update search history:", error);
      }
      return filtered;
    });
  };

  return { history, addToHistory, removeFromHistory };
};
