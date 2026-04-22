import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useAuth } from "./AuthContext";

const TaskContext = createContext();

export function useTasks() {
  return useContext(TaskContext);
}

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const isOnline = useNetworkStatus();
  const { currentUser } = useAuth();

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Load tasks from localStorage on mount
  useEffect(() => {
    const cachedTasks = localStorage.getItem("tasks");
    if (cachedTasks) {
      try {
        const parsedTasks = JSON.parse(cachedTasks);
        setTasks(parsedTasks);
        setLoading(false);
      } catch (e) {
        console.error("Error parsing cached tasks:", e);
      }
    }
  }, []);

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0 || !loading) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks, loading]);

  // Firebase real-time listener
  useEffect(() => {
    if (!db) {
      console.warn("Firebase not initialized, using local storage only");
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const tasksData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTasks(tasksData);
          setLoading(false);

          // Cache to localStorage
          localStorage.setItem("tasks", JSON.stringify(tasksData));
        },
        (error) => {
          console.error("Firebase snapshot error:", error);
          setLoading(false);

          // On error, keep using cached data (already loaded from localStorage)
          console.log("Using cached data due to Firebase error");
        }
      );
      return unsubscribe;
    } catch (e) {
      console.error("Firebase init error:", e);
      setLoading(false);
    }
  }, []);

  const addTask = async (task) => {
    const completionPercentage =
      typeof task.completionPercentage === "number"
        ? task.completionPercentage
        : 0;
    const isUnsuccessful = !!task.isUnsuccessful;
    const progressDisabled = !!task.progressDisabled;

    const newTask = {
      ...task,
      id: `temp-${Date.now()}`, // Temporary ID for offline
      includeLastDay:
        task.includeLastDay !== undefined ? task.includeLastDay : true,
      completionPercentage,
      isUnsuccessful,
      progressDisabled,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update UI
    setTasks((prev) => [newTask, ...prev]);

    try {
      if (db && isOnline) {
        const docRef = await addDoc(collection(db, "tasks"), {
          ...task,
          includeLastDay:
            task.includeLastDay !== undefined ? task.includeLastDay : true,
          completionPercentage,
          isUnsuccessful,
          progressDisabled,
          completed: false,
          createdAt: new Date().toISOString(),
        });

        // Update with real ID from Firebase
        setTasks((prev) =>
          prev.map((t) =>
            t.id === newTask.id ? { ...t, id: docRef.id } : t
          )
        );
      } else {
        console.log("Offline: Task saved locally");
      }
    } catch (e) {
      console.error("Error adding task to firebase:", e);
      // Task already added optimistically, so it stays in the list
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    const taskToToggle = tasks.find((t) => t.id === taskId);
    const nextCompletedStatus = !currentStatus;
    const completionPercentage =
      typeof taskToToggle?.completionPercentage === "number"
        ? taskToToggle.completionPercentage
        : 0;
    const isUnsuccessful = !!taskToToggle?.isUnsuccessful;

    const nextCompletionPercentage =
      nextCompletedStatus && !isUnsuccessful && completionPercentage === 0
        ? 100
        : completionPercentage;

    // Stamp completedAt when marking complete; clear it when uncompleting
    const completedAt = nextCompletedStatus ? new Date().toISOString() : null;

    const completionUpdates = {
      completionPercentage: nextCompletionPercentage,
      isUnsuccessful,
      completedAt,
    };

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: nextCompletedStatus,
              ...completionUpdates,
            }
          : t
      )
    );

    try {
      if (db && isOnline) {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
          completed: nextCompletedStatus,
          ...completionUpdates,
        });
      } else {
        console.log("Offline: Task status updated locally");
      }
    } catch (e) {
      console.error("Error updating task:", e);
      // Revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: currentStatus } : t
        )
      );
    }
  };

  const deleteTask = async (taskId) => {
    // Store task for potential rollback
    const taskToDelete = tasks.find((t) => t.id === taskId);

    // Optimistically update UI
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      if (db && isOnline) {
        const taskRef = doc(db, "tasks", taskId);
        await deleteDoc(taskRef);
      } else {
        console.log("Offline: Task deleted locally");
      }
    } catch (e) {
      console.error("Error deleting task from firebase:", e);
      // Revert on error
      if (taskToDelete) {
        setTasks((prev) => [taskToDelete, ...prev]);
      }
    }
  };

  const updateTask = async (taskId, updates) => {
    // Store old task for potential rollback
    const oldTask = tasks.find((t) => t.id === taskId);

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    try {
      if (db && isOnline) {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, updates);
      } else {
        console.log("Offline: Task updated locally");
      }
    } catch (e) {
      console.error("Error updating task in firebase:", e);
      // Revert on error
      if (oldTask) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? oldTask : t))
        );
      }
    }
  };

  const reorderTasks = async (orderedTaskIds) => {
    if (!orderedTaskIds?.length) return;

    const previousTasks = tasks;
    const orderMap = new Map(
      orderedTaskIds.map((taskId, index) => [taskId, index])
    );

    // Optimistic update for immediate UI response
    setTasks((prev) =>
      prev.map((task) =>
        orderMap.has(task.id)
          ? { ...task, manualOrder: orderMap.get(task.id) }
          : task
      )
    );

    try {
      if (db && isOnline) {
        await Promise.all(
          orderedTaskIds.map((taskId, index) =>
            updateDoc(doc(db, "tasks", taskId), { manualOrder: index })
          )
        );
      } else {
        console.log("Offline: task order updated locally");
      }
    } catch (e) {
      console.error("Error updating task order in firebase:", e);
      setTasks(previousTasks);
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Use manualOrder only when BOTH tasks have it — that means they were
      // explicitly drag-sorted relative to each other.
      // If only one has manualOrder (e.g. a legacy reorder), fall through to
      // createdAt so newly created tasks (no manualOrder) still appear at top.
      const hasOrderA = Number.isInteger(a.manualOrder);
      const hasOrderB = Number.isInteger(b.manualOrder);

      if (hasOrderA && hasOrderB) return a.manualOrder - b.manualOrder;

      // Fall back to createdAt descending (newest first)
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [tasks]);

  const value = {
    tasks: sortedTasks,
    loading,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    updateTask,
    reorderTasks,
    theme,
    toggleTheme,
    isOnline,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
