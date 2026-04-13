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
        where("userId", "==", currentUser.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          notesData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          
          setNotes(notesData);
          setLoading(false);
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

    try {
      if (db) {
        const docRef = await addDoc(collection(db, "notes"), newNote);
        return docRef.id;
      }
    } catch (e) {
      console.error("Error adding note:", e);
    }
  };

  const updateNote = async (noteId, updates) => {
    const updatedAt = new Date().toISOString();
    const finalUpdates = { ...updates, updatedAt };

    try {
      if (db) {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, finalUpdates);
      }
    } catch (e) {
      console.error("Error updating note:", e);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      if (db) {
        const noteRef = doc(db, "notes", noteId);
        await deleteDoc(noteRef);
      }
    } catch (e) {
      console.error("Error deleting note:", e);
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
