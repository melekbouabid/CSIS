import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import { useAuth } from "./AuthContext";

const PredictionsContext = createContext(null);

export function PredictionsProvider({ children }) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    if (!user) { setPredictions([]); return; }
    apiFetch("/api/predictions")
      .then(setPredictions)
      .catch(() => setPredictions([]));
  }, [user?.email]);

  async function addPrediction(profile, result) {
    try {
      const entry = await apiFetch("/api/predictions", {
        method: "POST",
        body: JSON.stringify({ profile, result }),
      });
      setPredictions((prev) => [entry, ...prev]);
    } catch (err) {
      console.error("Failed to save prediction:", err);
    }
  }

  async function removePrediction(id) {
    try {
      await apiFetch(`/api/predictions/${id}`, { method: "DELETE" });
      setPredictions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete prediction:", err);
    }
  }

  async function clearAll() {
    try {
      await apiFetch("/api/predictions/all", { method: "DELETE" });
      setPredictions([]);
    } catch (err) {
      console.error("Failed to clear predictions:", err);
    }
  }

  async function updatePrediction(id, updates) {
    try {
      await apiFetch(`/api/predictions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setPredictions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    } catch (err) {
      console.error("Failed to update prediction:", err);
    }
  }

  return (
    <PredictionsContext.Provider value={{ predictions, addPrediction, removePrediction, clearAll, updatePrediction }}>
      {children}
    </PredictionsContext.Provider>
  );
}

export function usePredictions() {
  const ctx = useContext(PredictionsContext);
  if (!ctx) throw new Error("usePredictions must be used inside PredictionsProvider");
  return ctx;
}
