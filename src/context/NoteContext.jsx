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
  where,
} from "firebase/firestore";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useAuth } from "./AuthContext";

const NoteContext = createContext();

export function useNotes() {
  return useContext(NoteContext);
}

export function NoteProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();
  const { currentUser } = useAuth();

  // Load notes from localStorage on mount
  useEffect(() => {
    const cachedNotes = localStorage.getItem("notes");
    if (cachedNotes) {
      try {
        setNotes(JSON.parse(cachedNotes));
        setLoading(false);
      } catch (e) {
        console.error("Error parsing cached notes:", e);
      }
    }
  }, []);

  // Firebase real-time listener for current user's notes
  useEffect(() => {
    if (!db || !currentUser) {
      if (!currentUser) {
        setNotes([]);
        setLoading(false);
      }
      return;
    }

    try {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", currentUser.uid),
        orderBy("updatedAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotes(notesData);
          setLoading(false);
          localStorage.setItem("notes", JSON.stringify(notesData));
        },
        (error) => {
          console.error("Firebase notes snapshot error:", error);
          setLoading(false);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.error("Firebase notes init error:", e);
      setLoading(false);
    }
  }, [currentUser]);

  const addNote = async (note) => {
    if (!currentUser) return;

    const newNote = {
      title: note.title || "",
      content: note.content || "",
      userId: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: note.color || "default",
    };

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    setNotes((prev) => [{ id: tempId, ...newNote }, ...prev]);

    try {
      if (db && isOnline) {
        const docRef = await addDoc(collection(db, "notes"), newNote);
        setNotes((prev) =>
          prev.map((n) => (n.id === tempId ? { ...n, id: docRef.id } : n))
        );
        return docRef.id;
      }
    } catch (e) {
      console.error("Error adding note:", e);
    }
  };

  const updateNote = async (noteId, updates) => {
    const updatedAt = new Date().toISOString();
    const finalUpdates = { ...updates, updatedAt };

    // Optimistic UI update
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...finalUpdates } : n))
    );

    try {
      if (db && isOnline) {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, finalUpdates);
      }
    } catch (e) {
      console.error("Error updating note:", e);
    }
  };

  const deleteNote = async (noteId) => {
    const noteToDelete = notes.find((n) => n.id === noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    try {
      if (db && isOnline) {
        const noteRef = doc(db, "notes", noteId);
        await deleteDoc(noteRef);
      }
    } catch (e) {
      console.error("Error deleting note:", e);
      if (noteToDelete) {
        setNotes((prev) => [noteToDelete, ...prev].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      }
    }
  };

  const value = {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
  };

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
}
