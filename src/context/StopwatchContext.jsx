import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useAuth } from "./AuthContext";

const StopwatchContext = createContext();

export function useStopwatch() {
  return useContext(StopwatchContext);
}

/**
 * Computes the total elapsed milliseconds for a stopwatch entry.
 * Accounts for all completed laps plus any currently-running lap.
 */
function computeElapsed(entry) {
  let total = entry.accumulatedMs || 0;
  if (entry.status === "running" && entry.lapStartedAt) {
    const lapStart = new Date(entry.lapStartedAt).getTime();
    total += Date.now() - lapStart;
  }
  return total;
}

export function StopwatchProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();
  const { currentUser } = useAuth();
  const tickRef = useRef(null);
  const [, forceRender] = useState(0);

  // Tick every second so running timers update on screen
  useEffect(() => {
    const hasRunning = entries.some((e) => e.status === "running");
    if (hasRunning) {
      tickRef.current = setInterval(() => forceRender((n) => n + 1), 1000);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [entries]);

  // Firebase real-time listener
  useEffect(() => {
    if (!db || !currentUser) {
      if (!currentUser) {
        setEntries([]);
        setLoading(false);
      }
      return;
    }

    try {
      const q = query(
        collection(db, "stopwatches"),
        where("userId", "==", currentUser.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          // Sort: running first, then paused, then stopped — within each group newest first
          data.sort((a, b) => {
            const statusOrder = { running: 0, paused: 1, stopped: 2 };
            const oa = statusOrder[a.status] ?? 3;
            const ob = statusOrder[b.status] ?? 3;
            if (oa !== ob) return oa - ob;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          setEntries(data);
          setLoading(false);
        },
        (error) => {
          console.error("Stopwatch snapshot error:", error);
          setLoading(false);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.error("Stopwatch init error:", e);
      setLoading(false);
    }
  }, [currentUser]);

  // ─── CRUD Operations ───

  /** Create a new stopwatch and immediately start it */
  const createStopwatch = useCallback(
    async (label = "") => {
      if (!currentUser) return;

      const now = new Date().toISOString();
      const entry = {
        userId: currentUser.uid,
        label: label.trim() || "Untitled Timer",
        status: "running", // running | paused | stopped
        outcome: null, // null | "completed" | "not_completed"
        accumulatedMs: 0,
        lapStartedAt: now,
        laps: [], // Array of { startedAt, endedAt, durationMs }
        createdAt: now,
        stoppedAt: null,
      };

      // Optimistic UI
      const tempId = `temp-${Date.now()}`;
      setEntries((prev) => [{ ...entry, id: tempId }, ...prev]);

      try {
        if (db && isOnline) {
          const docRef = await addDoc(collection(db, "stopwatches"), entry);
          setEntries((prev) =>
            prev.map((e) => (e.id === tempId ? { ...e, id: docRef.id } : e))
          );
        }
      } catch (e) {
        console.error("Error creating stopwatch:", e);
      }
    },
    [currentUser, isOnline]
  );

  /** Pause a running stopwatch */
  const pauseStopwatch = useCallback(
    async (id) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry || entry.status !== "running") return;

      const now = new Date().toISOString();
      const lapStart = new Date(entry.lapStartedAt).getTime();
      const lapDuration = Date.now() - lapStart;
      const newAccumulated = (entry.accumulatedMs || 0) + lapDuration;

      const newLap = {
        startedAt: entry.lapStartedAt,
        endedAt: now,
        durationMs: lapDuration,
      };

      const updates = {
        status: "paused",
        accumulatedMs: newAccumulated,
        lapStartedAt: null,
        laps: [...(entry.laps || []), newLap],
      };

      // Optimistic
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );

      try {
        if (db && isOnline) {
          await updateDoc(doc(db, "stopwatches", id), updates);
        }
      } catch (e) {
        console.error("Error pausing stopwatch:", e);
      }
    },
    [entries, isOnline]
  );

  /** Resume a paused stopwatch */
  const resumeStopwatch = useCallback(
    async (id) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry || entry.status !== "paused") return;

      const now = new Date().toISOString();
      const updates = {
        status: "running",
        lapStartedAt: now,
      };

      // Optimistic
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );

      try {
        if (db && isOnline) {
          await updateDoc(doc(db, "stopwatches", id), updates);
        }
      } catch (e) {
        console.error("Error resuming stopwatch:", e);
      }
    },
    [entries, isOnline]
  );

  /** Stop (finish) a stopwatch — saves final elapsed time and session outcome */
  const stopStopwatch = useCallback(
    async (id, outcome = null) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry || entry.status === "stopped") return;

      const now = new Date().toISOString();
      let newAccumulated = entry.accumulatedMs || 0;
      let newLaps = [...(entry.laps || [])];

      // If it was running, close the current lap
      if (entry.status === "running" && entry.lapStartedAt) {
        const lapStart = new Date(entry.lapStartedAt).getTime();
        const lapDuration = Date.now() - lapStart;
        newAccumulated += lapDuration;
        newLaps.push({
          startedAt: entry.lapStartedAt,
          endedAt: now,
          durationMs: lapDuration,
        });
      }

      const updates = {
        status: "stopped",
        outcome,
        accumulatedMs: newAccumulated,
        lapStartedAt: null,
        laps: newLaps,
        stoppedAt: now,
      };

      // Optimistic
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );

      try {
        if (db && isOnline) {
          await updateDoc(doc(db, "stopwatches", id), updates);
        }
      } catch (e) {
        console.error("Error stopping stopwatch:", e);
      }
    },
    [entries, isOnline]
  );

  /** Restore a stopped stopwatch back to Active (paused) from where it stopped */
  const restoreStopwatch = useCallback(
    async (id) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry || entry.status !== "stopped") return;

      const updates = {
        status: "paused",
        outcome: null,
        lapStartedAt: null,
        stoppedAt: null,
      };

      // Optimistic
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );

      try {
        if (db && isOnline) {
          await updateDoc(doc(db, "stopwatches", id), updates);
        }
      } catch (e) {
        console.error("Error restoring stopwatch:", e);
      }
    },
    [entries, isOnline]
  );

  /** Update the label of a stopwatch */
  const updateLabel = useCallback(
    async (id, newLabel) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, label: newLabel } : e))
      );

      try {
        if (db && isOnline) {
          await updateDoc(doc(db, "stopwatches", id), { label: newLabel });
        }
      } catch (e) {
        console.error("Error updating label:", e);
      }
    },
    [isOnline]
  );

  /** Delete a stopwatch entry permanently */
  const deleteStopwatch = useCallback(
    async (id) => {
      const backup = entries.find((e) => e.id === id);
      setEntries((prev) => prev.filter((e) => e.id !== id));

      try {
        if (db && isOnline) {
          await deleteDoc(doc(db, "stopwatches", id));
        }
      } catch (e) {
        console.error("Error deleting stopwatch:", e);
        if (backup) setEntries((prev) => [...prev, backup]);
      }
    },
    [entries, isOnline]
  );

  const value = {
    entries,
    loading,
    computeElapsed,
    createStopwatch,
    pauseStopwatch,
    resumeStopwatch,
    stopStopwatch,
    restoreStopwatch,
    updateLabel,
    deleteStopwatch,
  };

  return (
    <StopwatchContext.Provider value={value}>
      {children}
    </StopwatchContext.Provider>
  );
}
