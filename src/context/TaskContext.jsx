import React, { createContext, useContext, useState, useEffect } from "react";
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
import { requestFCMPermission, setupForegroundMessageListener } from "../lib/fcm";
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

  // Alarm State
  const [activeAlarm, setActiveAlarm] = useState(null);
  const audioRef = React.useRef(null);

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

  // Initialize Firebase Cloud Messaging for push notifications
  useEffect(() => {
    if (currentUser) {
      // Set up foreground message listener
      setupForegroundMessageListener();

      // Request FCM permission and token
      // This will be called when alarm is enabled, but we set up listener here
      requestFCMPermission(currentUser.uid).catch((error) => {
        console.log("FCM permission request:", error);
      });
    }
  }, [currentUser]);

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

  // Alarm System
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();

      // If an alarm is already ringing, don't trigger another one (FIFO/Priority)
      if (activeAlarm) return;

      tasks.forEach((task) => {
        if (
          task.alarm &&
          task.alarm.enabled &&
          !task.alarm.triggered &&
          task.alarm.date &&
          task.alarm.time
        ) {
          const alarmDateTime = new Date(
            `${task.alarm.date}T${task.alarm.time}`
          );

          if (now >= alarmDateTime) {
            // Trigger Alarm UI
            setActiveAlarm(task);

            // Trigger System Notification
            if (Notification.permission === "granted") {
              const notification = new Notification("Alarm Ringing!", {
                body: `It's time for: ${task.title}`,
                icon: "/icon-192.png", // Ensure this exists or use appropriate icon
                requireInteraction: true, // Key for persisting notification
                tag: `alarm-${task.id}`, // Prevent duplicates
              });

              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            } else if (Notification.permission !== "denied") {
              // Try to request if not denied, though usually requires user gesture
              // We rely on explicit request elsewhere
            }

            // Play Sound Loop
            if (!audioRef.current) {
              audioRef.current = new Audio("/audio.mp3");
              audioRef.current.loop = true;
            }
            audioRef.current
              .play()
              .catch((e) => console.error("Error playing alarm:", e));
          }
        }
      });
    };

    const intervalId = setInterval(checkAlarms, 1000);
    return () => clearInterval(intervalId);
  }, [tasks, activeAlarm]);

  // Schedule background notifications (for PWA/Mobile support)
  useEffect(() => {
    const scheduleNotifications = async () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      try {
        const registration = await navigator.serviceWorker.ready;

        // Check for Notification Triggers support (Experimental)
        // This allows scheduling notifications even if the app is closed
        if ("showTrigger" in Notification.prototype) {
          tasks.forEach(async (task) => {
            if (
              task.alarm &&
              task.alarm.enabled &&
              !task.alarm.triggered &&
              task.alarm.date &&
              task.alarm.time
            ) {
              const alarmTime = new Date(`${task.alarm.date}T${task.alarm.time}`).getTime();
              if (alarmTime > Date.now()) {
                // @ts-ignore
                await registration.showNotification(task.title, {
                  body: "Alarm is ringing! Tap to open.",
                  icon: "/icon-192.png",
                  tag: `alarm-${task.id}`,
                  // @ts-ignore
                  showTrigger: new TimestampTrigger(alarmTime),
                  requireInteraction: true,
                });
              }
            }
          });
        }
      } catch (error) {
        console.log("Notification scheduling failed/not supported", error);
      }
    };

    scheduleNotifications();
  }, [tasks]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  };

  const stopAlarm = () => {
    if (activeAlarm) {
      // Stop Audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Mark as triggered in DB
      updateTask(activeAlarm.id, {
        alarm: {
          ...activeAlarm.alarm,
          triggered: true,
        },
      });

      // Clear UI
      setActiveAlarm(null);
    }
  };

  const addTask = async (task) => {
    const newTask = {
      ...task,
      id: `temp-${Date.now()}`, // Temporary ID for offline
      includeLastDay:
        task.includeLastDay !== undefined ? task.includeLastDay : true,
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
    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !currentStatus } : t
      )
    );

    try {
      if (db && isOnline) {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
          completed: !currentStatus,
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

  const value = {
    tasks,
    loading,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    updateTask,
    theme,
    toggleTheme,
    isOnline,
    activeAlarm,
    stopAlarm,
    requestNotificationPermission,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
